// A plant-tower rooted in a field tile. Each tower tracks the enemy furthest
// along the path within its range, turns to face it, and fires on its own
// rhythm. Two upgrades deepen it; selling returns most of what it cost.

import { TOWERS, SELL_RATE } from './config.js';
import { Projectile } from './projectiles.js';

export class Tower {
  constructor(type, col, row, x, y) {
    this.type = type;
    this.def = TOWERS[type];
    this.level = 0;
    this.col = col;
    this.row = row;
    this.x = x;
    this.y = y;
    this.cooldown = 0;
    this.angle = -Math.PI / 2;
    this.kills = 0;
    this.spent = this.def.cost;
    this.muzzle = 0;
  }

  // The tower's current numbers: its base stats with each upgrade applied.
  stats() {
    const d = this.def;
    const s = {
      damage: d.damage,
      fireRate: d.fireRate,
      range: d.range,
      splash: d.splash || 0,
      slow: d.slow || 0,
      slowTime: d.slowTime || 0,
    };
    for (let i = 0; i < this.level; i++) Object.assign(s, d.upgrades[i]);
    return s;
  }

  // The price of the next upgrade, or null when fully grown.
  upgradeCost() {
    return this.canUpgrade() ? this.def.upgrades[this.level].cost : null;
  }

  canUpgrade() {
    return this.level < this.def.upgrades.length;
  }

  // What selling this tower pays back.
  sellValue() {
    return Math.floor(this.spent * SELL_RATE);
  }

  // The enemy furthest along the path within range, or null.
  acquireTarget(enemies, rangeBonus) {
    const range = this.stats().range * rangeBonus;
    let best = null;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d <= range && (!best || e.dist > best.dist)) best = e;
    }
    return best;
  }

  // Aim, and fire when the cooldown allows. Returns the shot, or null.
  update(dt, enemies, projectiles, rangeBonus) {
    this.cooldown -= dt;
    if (this.muzzle > 0) this.muzzle -= dt;
    const target = this.acquireTarget(enemies, rangeBonus);
    if (!target) return null;
    this.angle = Math.atan2(target.y - this.y, target.x - this.x);
    if (this.cooldown > 0) return null;
    const s = this.stats();
    this.cooldown = 1 / s.fireRate;
    this.muzzle = 0.08;
    const shot = new Projectile(this.x, this.y, target, {
      tower: this,
      damage: s.damage,
      splash: s.splash,
      slow: s.slow,
      slowTime: s.slowTime,
      color: this.def.color,
      speed: this.type === 'starspike' ? 720 : 430,
      radius: this.type === 'thornvine' ? 7 : 5,
    });
    projectiles.push(shot);
    return shot;
  }

  // Grow one level. Returns false when already fully grown.
  upgrade() {
    if (!this.canUpgrade()) return false;
    this.spent += this.upgradeCost();
    this.level++;
    return true;
  }
}
