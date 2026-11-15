// The game itself: state, economy, combat, the day/night cycle and all
// input. The renderer draws this state; nothing here touches the canvas.

import {
  START_PETALS,
  START_LIVES,
  TOTAL_WAVES,
  DAY_SECONDS,
  NIGHT_SECONDS,
  DAWN_PETALS,
  NIGHT_RANGE_BOOST,
  TOWER_ORDER,
  TOWERS,
  waveClearBonus,
} from './config.js';
import { Rng } from './rng.js';
import { SoundFX } from './audio.js';
import { Tower } from './towers.js';
import { WaveSpawner } from './waves.js';
import { Particles } from './particles.js';
import { isPathTile, HEARTLIGHT } from './path.js';
import {
  tileAt,
  tileCenter,
  pointInRect,
  startWaveButtonRect,
  speedButtonRect,
  pauseButtonRect,
  muteButtonRect,
  buildCardRect,
  upgradeButtonRect,
  sellButtonRect,
  startButtonRect,
  restartButtonRect,
} from './layout.js';

export class Game {
  constructor(seed = 1) {
    this.rng = new Rng(seed);
    this.sfx = new SoundFX();
    this.particles = new Particles();
    this.reset();
  }

  // A fresh run, back at the title screen.
  reset() {
    this.state = 'title'; // title | playing | won | lost
    this.paused = false;
    this.petals = START_PETALS;
    this.lives = START_LIVES;
    this.score = 0;
    this.kills = 0;
    this.leaks = 0;
    this.wave = 0;
    this.waveActive = false;
    this.spawner = null;
    this.enemies = [];
    this.towers = new Map();
    this.projectiles = [];
    this.time = 0;
    this.cycle = 0;
    this.isNight = false;
    this.speed = 1;
    this.selectedBuild = null;
    this.selectedTower = null;
    this.hover = null;
    this.banner = null;
    this.bannerUntil = 0;
    this.shotMode = false;
  }

  // Towers glow further at night.
  rangeBonus() {
    return this.isNight ? NIGHT_RANGE_BOOST : 1;
  }

  // Begin a new run from the title screen.
  startGame() {
    this.reset();
    this.state = 'playing';
    this.showBanner('Plant your garden, then press SPACE to start Wave 1', 3.5);
  }

  // Release the next wave, if none is running.
  startWave() {
    if (this.state !== 'playing' || this.waveActive || this.wave >= TOTAL_WAVES) return false;
    this.wave++;
    this.spawner = new WaveSpawner(this.wave, this.rng);
    this.waveActive = true;
    this.sfx.horn();
    this.showBanner(this.wave === TOTAL_WAVES ? 'Wave 12 — THE MOTH QUEEN approaches!' : `Wave ${this.wave} of ${TOTAL_WAVES}`, 2.5);
    return true;
  }

  // Plant a tower on a tile. `free` stages screenshots without charging.
  placeTower(type, col, row, free = false) {
    if (this.state !== 'playing') return false;
    if (col < 0 || col > 15 || row < 0 || row > 6) return false;
    if (isPathTile(col, row)) return false;
    const key = `${col},${row}`;
    if (this.towers.has(key)) return false;
    const def = TOWERS[type];
    if (!free && this.petals < def.cost) return false;
    if (!free) this.petals -= def.cost;
    const at = tileCenter(col, row);
    this.towers.set(key, new Tower(type, col, row, at.x, at.y));
    this.particles.ring(at.x, at.y, def.color);
    this.sfx.place();
    return true;
  }

  // Grow the selected tower one level.
  upgradeSelected() {
    const tower = this.selectedTower;
    if (!tower || !tower.canUpgrade()) return false;
    const cost = tower.upgradeCost();
    if (this.petals < cost) {
      this.showBanner('Not enough petals to upgrade', 1.5);
      return false;
    }
    this.petals -= cost;
    tower.upgrade();
    this.particles.ring(tower.x, tower.y, tower.def.glow, 60);
    this.sfx.upgrade();
    return true;
  }

  // Uproot the selected tower for most of what it cost.
  sellSelected() {
    const tower = this.selectedTower;
    if (!tower) return false;
    this.petals += tower.sellValue();
    this.towers.delete(`${tower.col},${tower.row}`);
    this.selectedTower = null;
    this.sfx.sell();
    return true;
  }

  showBanner(text, seconds = 2.5) {
    this.banner = text;
    this.bannerUntil = this.time + seconds;
  }

  // One simulation step. dt is real seconds; the loop folds speed into it.
  update(dt) {
    this.particles.update(dt);
    if (this.state !== 'playing' || this.paused) return;
    this.time += dt;
    if (this.banner && this.time > this.bannerUntil) this.banner = null;

    // The day/night cycle: day, then night, then dawn pays petals.
    const wasNight = this.isNight;
    this.cycle += dt;
    const cycleLen = DAY_SECONDS + NIGHT_SECONDS;
    if (this.cycle >= cycleLen) this.cycle -= cycleLen;
    this.isNight = this.cycle >= DAY_SECONDS;
    if (wasNight && !this.isNight) {
      this.petals += DAWN_PETALS;
      this.showBanner(`Dawn breaks — +${DAWN_PETALS} petals`, 2);
    }

    if (this.spawner) this.spawner.update(dt, this.enemies);

    for (const enemy of this.enemies) enemy.update(dt, this.time, this.isNight);

    const rangeBonus = this.rangeBonus();
    for (const tower of this.towers.values()) {
      const shot = tower.update(dt, this.enemies, this.projectiles, rangeBonus);
      if (shot) this.sfx.shoot(tower.type);
    }

    for (const p of this.projectiles) {
      const result = p.update(dt);
      if (result) this.applyHit(p, result.hit);
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);

    // Leaks cost lives; deaths pay petals.
    for (const enemy of this.enemies) {
      if (!enemy.alive && enemy.leaked) this.onEnemyLeaked(enemy);
    }
    this.enemies = this.enemies.filter((e) => e.alive);

    if (this.waveActive && this.spawner && this.spawner.done && this.enemies.length === 0) {
      this.onWaveCleared();
    }
  }

  // A projectile arrives: damage its target, splash its neighbours, chill it.
  applyHit(projectile, enemy) {
    const died = enemy.takeDamage(projectile.damage);
    if (projectile.slow > 0) {
      enemy.applySlow(projectile.slow, projectile.slowTime, this.time);
      this.particles.ring(enemy.x, enemy.y, '#7be7ff', 26);
    }
    if (projectile.splash > 0) {
      this.particles.burst(enemy.x, enemy.y, projectile.color, 8, 110);
      for (const other of this.enemies) {
        if (other === enemy || !other.alive) continue;
        const d = Math.hypot(other.x - enemy.x, other.y - enemy.y);
        if (d <= projectile.splash) {
          if (other.takeDamage(Math.round(projectile.damage * 0.5))) this.onEnemyKilled(other, projectile.tower);
        }
      }
    } else {
      this.particles.burst(enemy.x, enemy.y, projectile.color, 4, 80);
    }
    if (died) this.onEnemyKilled(enemy, projectile.tower);
  }

  onEnemyKilled(enemy, tower) {
    this.kills++;
    this.petals += enemy.def.reward;
    this.score += 10 + enemy.def.reward;
    if (tower) tower.kills++;
    this.particles.burst(enemy.x, enemy.y, enemy.def.color, enemy.def.boss ? 30 : 12, 150);
    this.particles.floatText(enemy.x, enemy.y - 18, `+${enemy.def.reward}`);
    this.sfx.pop();
  }

  onEnemyLeaked(enemy) {
    this.leaks++;
    this.lives -= enemy.def.lives;
    this.particles.burst(HEARTLIGHT.x, HEARTLIGHT.y, '#ff5d73', 16, 160);
    this.sfx.leak();
    if (this.lives <= 0) {
      this.lives = 0;
      this.loseGame();
    } else if (this.lives <= 5) {
      this.showBanner(`The Heartlight flickers — ${this.lives} lives left!`, 2);
    }
  }

  onWaveCleared() {
    this.waveActive = false;
    const bonus = waveClearBonus(this.wave);
    this.petals += bonus;
    this.score += 50 + this.wave * 10;
    if (this.wave >= TOTAL_WAVES) {
      this.winGame();
      return;
    }
    this.showBanner(`Wave ${this.wave} cleared! +${bonus} petals — press SPACE for Wave ${this.wave + 1}`, 3);
  }

  winGame() {
    this.state = 'won';
    this.score += this.lives * 100 + this.petals;
    this.sfx.win();
  }

  loseGame() {
    this.state = 'lost';
    this.sfx.lose();
  }

  togglePause() {
    if (this.state !== 'playing') return;
    this.paused = !this.paused;
    this.sfx.click();
  }

  toggleSpeed() {
    this.speed = this.speed === 1 ? 2 : 1;
    this.sfx.click();
  }

  toggleMute() {
    this.sfx.muted = !this.sfx.muted;
  }

  // A mouse click at canvas coordinates.
  handleClick(x, y) {
    this.sfx.ensure();
    if (this.state === 'title') {
      if (pointInRect(x, y, startButtonRect())) {
        this.sfx.click();
        this.startGame();
      }
      return;
    }
    if (this.state === 'won' || this.state === 'lost') {
      if (pointInRect(x, y, restartButtonRect())) {
        this.sfx.click();
        this.startGame();
      }
      return;
    }
    if (pointInRect(x, y, startWaveButtonRect())) {
      this.startWave();
      return;
    }
    if (pointInRect(x, y, speedButtonRect())) {
      this.toggleSpeed();
      return;
    }
    if (pointInRect(x, y, pauseButtonRect())) {
      this.togglePause();
      return;
    }
    if (pointInRect(x, y, muteButtonRect())) {
      this.toggleMute();
      this.sfx.click();
      return;
    }
    if (this.selectedTower) {
      if (pointInRect(x, y, upgradeButtonRect())) {
        this.upgradeSelected();
        return;
      }
      if (pointInRect(x, y, sellButtonRect())) {
        this.sellSelected();
        return;
      }
    }
    for (let i = 0; i < TOWER_ORDER.length; i++) {
      if (pointInRect(x, y, buildCardRect(i))) {
        const type = TOWER_ORDER[i];
        this.selectedBuild = this.selectedBuild === type ? null : type;
        this.selectedTower = null;
        this.sfx.click();
        return;
      }
    }
    const tile = tileAt(x, y);
    if (!tile) return;
    const key = `${tile.col},${tile.row}`;
    if (this.selectedBuild) {
      if (this.placeTower(this.selectedBuild, tile.col, tile.row)) {
        if (this.petals < TOWERS[this.selectedBuild].cost) this.selectedBuild = null;
      } else {
        this.showBanner(
          isPathTile(tile.col, tile.row)
            ? 'The path must stay clear'
            : this.towers.has(key)
              ? 'A plant already grows here'
              : 'Not enough petals',
          1.5,
        );
      }
      return;
    }
    this.selectedTower = this.towers.get(key) || null;
    if (this.selectedTower) this.sfx.click();
  }

  // A key press.
  handleKey(key) {
    this.sfx.ensure();
    if (this.state === 'title') {
      if (key === ' ' || key === 'Enter') this.startGame();
      return;
    }
    if (this.state === 'won' || this.state === 'lost') {
      if (key === 'r' || key === 'R') this.startGame();
      return;
    }
    if (key >= '1' && key <= '4') {
      const type = TOWER_ORDER[Number(key) - 1];
      this.selectedBuild = this.selectedBuild === type ? null : type;
      this.selectedTower = null;
      this.sfx.click();
      return;
    }
    if (key === 'Escape') {
      this.selectedBuild = null;
      this.selectedTower = null;
      return;
    }
    if (key === ' ') {
      this.startWave();
      return;
    }
    if (key === 'f' || key === 'F') this.toggleSpeed();
    else if (key === 'p' || key === 'P') this.togglePause();
    else if (key === 'm' || key === 'M') this.toggleMute();
    else if ((key === 'u' || key === 'U') && this.selectedTower) this.upgradeSelected();
    else if ((key === 'x' || key === 'X') && this.selectedTower) this.sellSelected();
  }
}
