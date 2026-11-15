// Every pixel of Glowgarden: the garden, the creatures, the HUD, the menus.
// The renderer only reads game state; it never changes it.

import {
  VIEW_W,
  VIEW_H,
  HUD_H,
  BAR_H,
  TILE,
  COLS,
  ROWS,
  FIELD_TOP,
  TOTAL_WAVES,
  DAY_SECONDS,
  NIGHT_SECONDS,
  PALETTE,
  TOWER_ORDER,
  TOWERS,
} from './config.js';
import { Rng } from './rng.js';
import { PATH_TILES, HEARTLIGHT } from './path.js';
import {
  tileCenter,
  startWaveButtonRect,
  speedButtonRect,
  pauseButtonRect,
  muteButtonRect,
  buildCardRect,
  towerPanelRect,
  upgradeButtonRect,
  sellButtonRect,
  startButtonRect,
  restartButtonRect,
} from './layout.js';

// Fixed decoration, seeded once so the garden looks the same every run.
const decorRng = new Rng(20261115);
const STARS = Array.from({ length: 80 }, () => ({
  x: decorRng.range(0, VIEW_W),
  y: decorRng.range(0, VIEW_H),
  r: decorRng.range(0.5, 1.6),
  tw: decorRng.range(0, Math.PI * 2),
}));
const FIREFLIES = Array.from({ length: 26 }, () => ({
  x: decorRng.range(40, VIEW_W - 40),
  y: decorRng.range(FIELD_TOP + 20, FIELD_TOP + ROWS * TILE - 20),
  phase: decorRng.range(0, Math.PI * 2),
  speed: decorRng.range(0.3, 0.9),
  color: decorRng.chance(0.5) ? '#ffe66d' : '#7be7ff',
}));
const TUFTS = Array.from({ length: 46 }, () => {
  const col = decorRng.int(0, COLS - 1);
  const row = decorRng.int(0, ROWS - 1);
  if (PATH_TILES.has(`${col},${row}`)) return null;
  return {
    x: col * TILE + decorRng.range(12, TILE - 12),
    y: FIELD_TOP + row * TILE + decorRng.range(12, TILE - 12),
    s: decorRng.range(5, 10),
  };
}).filter(Boolean);

// The towers that decorate the title screen's garden.
const DEMO_TOWERS = [
  { type: 'sunbloom', col: 2, row: 0 },
  { type: 'sunbloom', col: 6, row: 0 },
  { type: 'thornvine', col: 9, row: 2 },
  { type: 'frostbell', col: 7, row: 2 },
  { type: 'starspike', col: 13, row: 2 },
  { type: 'sunbloom', col: 1, row: 4 },
  { type: 'thornvine', col: 5, row: 4 },
  { type: 'frostbell', col: 12, row: 4 },
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Draw the whole game, one frame.
export function drawGame(ctx, game) {
  drawField(ctx, game);
  if (game.state === 'title') {
    for (const demo of DEMO_TOWERS) {
      const at = tileCenter(demo.col, demo.row);
      drawTowerIcon(ctx, demo.type, at.x, at.y, 26, -Math.PI / 2, 0, game.time);
    }
    drawFireflies(ctx, game.time);
    drawTitleScreen(ctx, game);
    return;
  }
  for (const tower of game.towers.values()) drawTower(ctx, tower, game);
  drawHeartlight(ctx, game);
  for (const enemy of game.enemies) drawEnemy(ctx, enemy, game.time);
  for (const p of game.projectiles) p.draw(ctx);
  game.particles.draw(ctx);
  drawFireflies(ctx, game.time);
  drawPlacementPreview(ctx, game);
  drawHUD(ctx, game);
  if (game.selectedTower) drawTowerPanel(ctx, game);
  else drawBuildBar(ctx, game);
  if (game.banner) drawBanner(ctx, game);
  if (game.paused) drawPauseOverlay(ctx);
  if (game.state === 'won' || game.state === 'lost') drawEndScreen(ctx, game);
}

// The night garden: sky, soil tiles, the winding path.
function drawField(ctx, game) {
  const night = game.isNight || game.state === 'title';
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, night ? PALETTE.skyNightTop : PALETTE.skyDayTop);
  grad.addColorStop(1, night ? PALETTE.skyNightBottom : PALETTE.skyDayBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = '#ffffff';
  for (const s of STARS) {
    ctx.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(game.time * 0.7 + s.tw));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Soil tiles, checkerboard.
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = (c + r) % 2 === 0 ? PALETTE.soilA : PALETTE.soilB;
      ctx.fillRect(c * TILE, FIELD_TOP + r * TILE, TILE, TILE);
    }
  }

  // Grass tufts on empty soil.
  ctx.strokeStyle = '#1e7a5e';
  ctx.lineWidth = 2;
  for (const t of TUFTS) {
    ctx.beginPath();
    ctx.moveTo(t.x - t.s, t.y + t.s);
    ctx.lineTo(t.x - t.s / 2, t.y - t.s);
    ctx.moveTo(t.x, t.y + t.s);
    ctx.lineTo(t.x, t.y - t.s - 2);
    ctx.moveTo(t.x + t.s, t.y + t.s);
    ctx.lineTo(t.x + t.s / 2, t.y - t.s);
    ctx.stroke();
  }

  // The path: dirt tiles with a glowing edge.
  for (const key of PATH_TILES) {
    const [c, r] = key.split(',').map(Number);
    ctx.fillStyle = PALETTE.path;
    ctx.fillRect(c * TILE + 2, FIELD_TOP + r * TILE + 2, TILE - 4, TILE - 4);
  }
  ctx.strokeStyle = PALETTE.pathEdge;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;
  for (const key of PATH_TILES) {
    const [c, r] = key.split(',').map(Number);
    ctx.strokeRect(c * TILE + 2, FIELD_TOP + r * TILE + 2, TILE - 4, TILE - 4);
  }
  ctx.globalAlpha = 1;
}

// Drifting fireflies over the garden.
function drawFireflies(ctx, time) {
  for (const f of FIREFLIES) {
    const x = f.x + Math.sin(time * f.speed + f.phase) * 14;
    const y = f.y + Math.cos(time * f.speed * 0.8 + f.phase) * 10;
    ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(time * 1.4 + f.phase));
    ctx.fillStyle = f.color;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// The Heartlight crystal at the path's end, pulsing with the garden's health.
function drawHeartlight(ctx, game) {
  const pulse = 1 + Math.sin(game.time * 2.2) * 0.08;
  const low = game.lives <= 5;
  ctx.save();
  ctx.translate(HEARTLIGHT.x, HEARTLIGHT.y);
  ctx.scale(pulse, pulse);
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
  glow.addColorStop(0, low ? 'rgba(255,93,115,0.55)' : 'rgba(255,230,109,0.5)');
  glow.addColorStop(1, 'rgba(255,230,109,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = low ? '#ff8fa0' : PALETTE.heartlight;
  ctx.beginPath();
  ctx.moveTo(0, -26);
  ctx.lineTo(16, 0);
  ctx.lineTo(0, 26);
  ctx.lineTo(-16, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fffbe0';
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(7, 0);
  ctx.lineTo(0, 14);
  ctx.lineTo(-7, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// One plant's face: petals, spikes, bell or star, by kind.
export function drawTowerIcon(ctx, type, x, y, size, angle, level, time) {
  ctx.save();
  ctx.translate(x, y);
  // Soil mound.
  ctx.fillStyle = '#241d3f';
  ctx.beginPath();
  ctx.arc(0, size * 0.42, size * 0.78, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#4a3a7a';
  ctx.lineWidth = 2;
  ctx.stroke();
  // A stem that aims at the target.
  ctx.strokeStyle = '#2f9e6e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.lineTo(Math.cos(angle) * size * 0.55, Math.sin(angle) * size * 0.55);
  ctx.stroke();

  const def = TOWERS[type];
  if (type === 'sunbloom') {
    ctx.fillStyle = def.color;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.sin(time * 0.8) * 0.06;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * size * 0.52, Math.sin(a) * size * 0.52, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ff9d2e';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.36, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'thornvine') {
    ctx.fillStyle = def.color;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * size * 0.3, Math.sin(a) * size * 0.3);
      ctx.lineTo(Math.cos(a + 0.22) * size * 0.85, Math.sin(a + 0.22) * size * 0.85);
      ctx.lineTo(Math.cos(a - 0.22) * size * 0.85, Math.sin(a - 0.22) * size * 0.85);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#5c1030';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'frostbell') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, -size * 0.1, size * 0.62, Math.PI, 0);
    ctx.lineTo(size * 0.62, size * 0.35);
    ctx.lineTo(-size * 0.62, size * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, size * 0.48, size * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? size * 0.85 : size * 0.38;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Level stars.
  if (level > 0) {
    ctx.fillStyle = PALETTE.gold;
    for (let i = 0; i < level; i++) {
      ctx.beginPath();
      ctx.arc(-8 + i * 16, size * 0.86, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawTower(ctx, tower, game) {
  if (game.selectedTower === tower) {
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, tower.stats().range * game.rangeBonus(), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  drawTowerIcon(ctx, tower.type, tower.x, tower.y, 26, tower.angle, tower.level, game.time);
  if (tower.muzzle > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = tower.muzzle / 0.08;
    ctx.fillStyle = tower.def.glow;
    ctx.beginPath();
    ctx.arc(
      tower.x + Math.cos(tower.angle) * 26,
      tower.y + Math.sin(tower.angle) * 26,
      9,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }
}

function drawEnemy(ctx, enemy, time) {
  const d = enemy.def;
  const flap = Math.sin(time * 18 + enemy.wobble) * 0.7;
  ctx.save();
  ctx.translate(enemy.x, enemy.y + Math.sin(time * 6 + enemy.wobble) * 2);
  if (enemy.type === 'moth' || enemy.type === 'queen') {
    const s = enemy.type === 'queen' ? 1.9 : 1;
    ctx.fillStyle = d.wing;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.rotate(side * flap * 0.6);
      ctx.beginPath();
      ctx.ellipse(side * 12 * s, -4, 13 * s, 8 * s, side * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7 * s, 11 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    if (enemy.type === 'queen') {
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.moveTo(-10, -14);
      ctx.lineTo(-5, -24);
      ctx.lineTo(0, -15);
      ctx.lineTo(5, -24);
      ctx.lineTo(10, -14);
      ctx.closePath();
      ctx.fill();
    }
  } else if (enemy.type === 'beetle') {
    ctx.strokeStyle = '#3d1620';
    ctx.lineWidth = 2.5;
    for (const side of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(side * 8, i * 6);
        ctx.lineTo(side * 18, i * 6 + 8);
        ctx.stroke();
      }
    }
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = d.wing;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(0, 15);
    ctx.stroke();
  } else {
    // Wraith: a pale, wavering ghost.
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(0, -4, 11, Math.PI, 0);
    ctx.lineTo(11, 8);
    ctx.lineTo(5, 14);
    ctx.lineTo(0, 8);
    ctx.lineTo(-5, 14);
    ctx.lineTo(-11, 8);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Eyes.
  ctx.fillStyle = d.eye;
  ctx.beginPath();
  ctx.arc(-4, -3, 2.4, 0, Math.PI * 2);
  ctx.arc(4, -3, 2.4, 0, Math.PI * 2);
  ctx.fill();
  // Hit flash.
  if (enemy.flash > 0) {
    ctx.globalAlpha = Math.min(0.8, enemy.flash * 8);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Frost tint while slowed.
  if (enemy.slowUntil > 0) {
    ctx.strokeStyle = 'rgba(123,231,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, enemy.radius + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  // Health bar, only when hurt.
  if (enemy.hp < enemy.maxHp) {
    const w = enemy.radius * 2;
    const x = enemy.x - w / 2;
    const y = enemy.y - enemy.radius - 12;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - 1, y - 1, w + 2, 7);
    ctx.fillStyle = enemy.def.boss ? '#ff5da2' : '#7be767';
    ctx.fillRect(x, y, w * Math.max(0, enemy.hp / enemy.maxHp), 5);
  }
}

function drawButton(ctx, rect, label, active = false, disabled = false) {
  ctx.fillStyle = disabled ? '#1a2142' : active ? '#ffd166' : '#1c2752';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
  ctx.fill();
  ctx.strokeStyle = active ? '#ffedb0' : '#3a4a8c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = disabled ? '#6a76ad' : active ? '#241a00' : PALETTE.text;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

// The top bar: wave, lives, petals, score, day/night, and the buttons.
function drawHUD(ctx, game) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.strokeStyle = PALETTE.hudLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_H - 1);
  ctx.lineTo(VIEW_W, HUD_H - 1);
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = 'bold 21px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`WAVE ${Math.max(1, game.wave)}/${TOTAL_WAVES}`, 16, 40);
  ctx.fillStyle = game.lives <= 5 ? PALETTE.danger : '#ff8fa0';
  ctx.fillText(`♥ ${game.lives}`, 168, 40);
  ctx.fillStyle = PALETTE.gold;
  ctx.fillText(`✿ ${game.petals}`, 268, 40);
  ctx.fillStyle = PALETTE.text;
  ctx.fillText(`SCORE ${game.score.toLocaleString('en-US')}`, 400, 40);

  // Day/night dial, top right.
  const cycleLen = DAY_SECONDS + NIGHT_SECONDS;
  const phase = game.isNight ? (game.cycle - DAY_SECONDS) / NIGHT_SECONDS : game.cycle / DAY_SECONDS;
  ctx.fillStyle = '#1c2752';
  roundRect(ctx, 1152, 10, 112, 44, 10);
  ctx.fill();
  ctx.strokeStyle = '#3a4a8c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = game.isNight ? '#b8c4ff' : PALETTE.gold;
  ctx.beginPath();
  ctx.arc(1174, 32, 10, 0, Math.PI * 2);
  ctx.fill();
  if (game.isNight) {
    ctx.fillStyle = '#1c2752';
    ctx.beginPath();
    ctx.arc(1178, 29, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(game.isNight ? 'NIGHT' : 'DAY', 1192, 28);
  ctx.fillStyle = '#2a3566';
  ctx.fillRect(1192, 34, 58, 6);
  ctx.fillStyle = game.isNight ? '#b8c4ff' : PALETTE.gold;
  ctx.fillRect(1192, 34, 58 * phase, 6);

  drawButton(
    ctx,
    startWaveButtonRect(),
    game.waveActive ? `WAVE ${game.wave}…` : game.wave >= TOTAL_WAVES ? 'ALL WAVES' : '▶ START WAVE',
    !game.waveActive && game.wave < TOTAL_WAVES,
    game.waveActive || game.wave >= TOTAL_WAVES,
  );
  drawButton(ctx, speedButtonRect(), `${game.speed}x`, game.speed === 2);
  drawButton(ctx, pauseButtonRect(), game.paused ? '▶ RESUME' : '❚❚ PAUSE');
  drawButton(ctx, muteButtonRect(), game.sfx.muted ? '♪ OFF' : '♪ ON');
}

// The build bar: four plant cards.
function drawBuildBar(ctx, game) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, VIEW_H - BAR_H, VIEW_W, BAR_H);
  ctx.strokeStyle = PALETTE.hudLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H - BAR_H + 1);
  ctx.lineTo(VIEW_W, VIEW_H - BAR_H + 1);
  ctx.stroke();

  TOWER_ORDER.forEach((type, i) => {
    const def = TOWERS[type];
    const r = buildCardRect(i);
    const selected = game.selectedBuild === type;
    const afford = game.petals >= def.cost;
    ctx.globalAlpha = afford ? 1 : 0.55;
    ctx.fillStyle = selected ? '#2a3566' : PALETTE.card;
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = selected ? def.color : PALETTE.cardLine;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.stroke();
    drawTowerIcon(ctx, type, r.x + 32, r.y + 38, 20, -Math.PI / 2, 0, game.time);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(def.name, r.x + 58, r.y + 28);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(`✿ ${def.cost}`, r.x + 58, r.y + 50);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(def.desc, r.x + 58, r.y + 68);
    ctx.fillStyle = '#2a3566';
    roundRect(ctx, r.x + r.w - 28, r.y + 6, 20, 20, 5);
    ctx.fill();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(def.key, r.x + r.w - 18, r.y + 21);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  });

  ctx.fillStyle = PALETTE.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Click a card (or press 1–4), then click a soil tile to plant.', 800, VIEW_H - BAR_H + 34);
  ctx.fillText('Click a planted tower to upgrade or sell it. SPACE starts the next wave.', 800, VIEW_H - BAR_H + 56);
}

// The panel for a selected tower: its stats, upgrade and sell.
function drawTowerPanel(ctx, game) {
  const tower = game.selectedTower;
  const def = tower.def;
  const s = tower.stats();
  const r = towerPanelRect();
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, VIEW_H - BAR_H, VIEW_W, BAR_H);
  ctx.strokeStyle = PALETTE.hudLine;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H - BAR_H + 1);
  ctx.lineTo(VIEW_W, VIEW_H - BAR_H + 1);
  ctx.stroke();
  drawTowerIcon(ctx, tower.type, 48, VIEW_H - BAR_H + 48, 24, tower.angle, tower.level, game.time);

  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`${def.name}  ·  Lv ${tower.level + 1}${'★'.repeat(tower.level)}`, 84, VIEW_H - BAR_H + 34);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '14px system-ui, sans-serif';
  let line = `DMG ${s.damage}  ·  ${s.fireRate}/s  ·  RNG ${Math.round(s.range)}`;
  if (s.splash) line += `  ·  splash ${s.splash}`;
  if (s.slow) line += `  ·  slows ${Math.round(s.slow * 100)}%`;
  line += `  ·  ${tower.kills} vanquished`;
  ctx.fillText(line, 84, VIEW_H - BAR_H + 58);

  const cost = tower.upgradeCost();
  drawButton(ctx, upgradeButtonRect(), cost ? `⬆ UPGRADE ✿${cost}` : 'MAX LEVEL', !!cost, !cost);
  drawButton(ctx, sellButtonRect(), `SELL ✿${tower.sellValue()}`);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('U upgrade · X sell · Esc deselect', 800, VIEW_H - 14);
}

// The ghost of the tower about to be planted, with its range.
function drawPlacementPreview(ctx, game) {
  if (!game.selectedBuild || !game.hover) return;
  const tile = game.hover.tile;
  if (!tile) return;
  const def = TOWERS[game.selectedBuild];
  const at = tileCenter(tile.col, tile.row);
  const ok = !PATH_TILES.has(`${tile.col},${tile.row}`) && !game.towers.has(`${tile.col},${tile.row}`);
  ctx.fillStyle = ok ? 'rgba(255,255,255,0.07)' : 'rgba(255,93,115,0.15)';
  ctx.strokeStyle = ok ? 'rgba(255,255,255,0.35)' : 'rgba(255,93,115,0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(at.x, at.y, def.range * game.rangeBonus(), 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 0.75;
  drawTowerIcon(ctx, game.selectedBuild, at.x, at.y, 26, -Math.PI / 2, 0, game.time);
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, game) {
  ctx.font = 'bold 22px system-ui, sans-serif';
  const w = ctx.measureText(game.banner).width + 48;
  const x = (VIEW_W - w) / 2;
  ctx.fillStyle = 'rgba(10,14,38,0.88)';
  roundRect(ctx, x, 82, w, 44, 12);
  ctx.fill();
  ctx.strokeStyle = '#3a4a8c';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.textAlign = 'center';
  ctx.fillText(game.banner, VIEW_W / 2, 111);
  ctx.textAlign = 'left';
}

function drawPauseOverlay(ctx) {
  ctx.fillStyle = 'rgba(7,10,28,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', VIEW_W / 2, VIEW_H / 2 - 8);
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.dim;
  ctx.fillText('Press P or click RESUME to keep playing', VIEW_W / 2, VIEW_H / 2 + 28);
  ctx.textAlign = 'left';
}

// The title screen: the garden, the pitch, the legend, the START button.
function drawTitleScreen(ctx, game) {
  ctx.fillStyle = 'rgba(7,10,28,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const grad = ctx.createLinearGradient(0, 90, 0, 170);
  grad.addColorStop(0, '#ffe66d');
  grad.addColorStop(1, '#7be7ff');
  ctx.fillStyle = grad;
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GLOWGARDEN', VIEW_W / 2, 158);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('S I E G E   O F   T H E   L A S T   L I G H T', VIEW_W / 2, 196);

  ctx.fillStyle = PALETTE.dim;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('Shadow creatures march on the Heartlight. Grow light-plants along their path', VIEW_W / 2, 232);
  ctx.fillText('and hold the line for 12 waves — through day, and through the faster night.', VIEW_W / 2, 256);

  // The tower legend.
  TOWER_ORDER.forEach((type, i) => {
    const def = TOWERS[type];
    const x = 250 + i * 200;
    drawTowerIcon(ctx, type, x, 316, 22, -Math.PI / 2, 0, game.time);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(def.name, x, 356);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText(`✿ ${def.cost}`, x, 376);
    ctx.fillStyle = PALETTE.dim;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(def.desc, x, 396);
  });

  ctx.fillStyle = PALETTE.dim;
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Mouse: plant & upgrade  ·  1–4: pick a plant  ·  SPACE: start wave  ·  F: speed  ·  P: pause  ·  M: sound', VIEW_W / 2, 440);

  const b = startButtonRect();
  const pulse = 1 + Math.sin(game.time * 3) * 0.03;
  ctx.save();
  ctx.translate(b.x + b.w / 2, b.y + b.h / 2);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = PALETTE.gold;
  roundRect(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 14);
  ctx.fill();
  ctx.fillStyle = '#241a00';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('▶  START THE GARDEN', 0, 8);
  ctx.restore();

  ctx.fillStyle = PALETTE.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('A complete game in one page — no downloads, no network, just you and the dark.', VIEW_W / 2, 584);
  ctx.textAlign = 'left';
}

// The win and loss screens: the result, the run's numbers, restart.
function drawEndScreen(ctx, game) {
  ctx.fillStyle = 'rgba(7,10,28,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const won = game.state === 'won';
  ctx.fillStyle = '#101736';
  roundRect(ctx, 290, 130, 700, 460, 18);
  ctx.fill();
  ctx.strokeStyle = won ? PALETTE.gold : PALETTE.danger;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = won ? PALETTE.gold : PALETTE.danger;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(won ? 'THE LIGHT ENDURES' : 'THE LIGHT FADES', VIEW_W / 2, 196);
  ctx.fillStyle = PALETTE.dim;
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText(
    won ? 'Twelve waves broke against your garden. The Heartlight burns on.' : 'The swarm reached the Heartlight. The garden falls dark — for now.',
    VIEW_W / 2,
    228,
  );

  const rows = [
    ['FINAL SCORE', game.score.toLocaleString('en-US')],
    ['WAVES CLEARED', `${won ? TOTAL_WAVES : Math.max(0, game.wave - (game.waveActive ? 1 : 0))} / ${TOTAL_WAVES}`],
    ['CREATURES VANQUISHED', `${game.kills}`],
    ['LEAKS', `${game.leaks}`],
    ['PETALS LEFT', `${game.petals}`],
    ['LIVES LEFT', `${game.lives}`],
  ];
  ctx.font = 'bold 19px system-ui, sans-serif';
  rows.forEach(([label, value], i) => {
    const y = 278 + i * 34;
    ctx.fillStyle = PALETTE.dim;
    ctx.textAlign = 'left';
    ctx.fillText(label, 380, y);
    ctx.fillStyle = PALETTE.text;
    ctx.textAlign = 'right';
    ctx.fillText(value, 900, y);
  });

  drawButton(ctx, restartButtonRect(), '↻  PLAY AGAIN  (R)', true);
  ctx.textAlign = 'left';
}
