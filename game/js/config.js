// Every tunable number of Glowgarden lives here: the board, the towers, the
// enemies and the twelve waves. Balance changes are one-line edits.

// The play surface, in pixels.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 64;
export const BAR_H = 96;
export const TILE = 80;
export const COLS = 16;
export const ROWS = 7;
export const FIELD_TOP = HUD_H;
export const FIELD_H = ROWS * TILE;

// The run's starting resources and length.
export const START_PETALS = 150;
export const START_LIVES = 20;
export const TOTAL_WAVES = 12;
export const DAY_SECONDS = 25;
export const NIGHT_SECONDS = 25;
export const DAWN_PETALS = 15;
export const SELL_RATE = 0.7;
export const NIGHT_SPEED_BOOST = 1.2;
export const NIGHT_RANGE_BOOST = 1.15;

// The garden's palette: deep indigo night, neon blooms.
export const PALETTE = {
  skyDayTop: '#1b2a5e',
  skyDayBottom: '#0e1533',
  skyNightTop: '#070a1e',
  skyNightBottom: '#0b1030',
  soilA: '#141c40',
  soilB: '#101735',
  path: '#3a2b5e',
  pathEdge: '#6b57a8',
  heartlight: '#ffe66d',
  hud: '#0a0e26',
  hudLine: '#2a3566',
  card: '#131b3d',
  cardLine: '#2f3d75',
  text: '#eef2ff',
  dim: '#9aa5d6',
  gold: '#ffd166',
  danger: '#ff5d73',
};

// Four plant-towers, in build-bar order. Each has two upgrades; an upgrade row
// overrides only the fields it names.
export const TOWER_ORDER = ['sunbloom', 'thornvine', 'frostbell', 'starspike'];

export const TOWERS = {
  sunbloom: {
    name: 'Sunbloom',
    key: '1',
    cost: 50,
    range: 135,
    damage: 8,
    fireRate: 3.0,
    color: '#ffd166',
    glow: '#ffedb0',
    desc: 'Rapid fire.',
    upgrades: [
      { cost: 45, damage: 13, fireRate: 3.5 },
      { cost: 80, damage: 20, fireRate: 4.2 },
    ],
  },
  thornvine: {
    name: 'Thornvine',
    key: '2',
    cost: 100,
    range: 118,
    damage: 26,
    fireRate: 0.8,
    splash: 58,
    color: '#ff5da2',
    glow: '#ffb3d4',
    desc: 'Splash damage.',
    upgrades: [
      { cost: 90, damage: 42, splash: 68 },
      { cost: 150, damage: 64, splash: 82 },
    ],
  },
  frostbell: {
    name: 'Frostbell',
    key: '3',
    cost: 75,
    range: 128,
    damage: 4,
    fireRate: 1.5,
    slow: 0.4,
    slowTime: 1.6,
    color: '#7be7ff',
    glow: '#d2f7ff',
    desc: 'Slows the swarm.',
    upgrades: [
      { cost: 70, slow: 0.55, slowTime: 1.8 },
      { cost: 120, slow: 0.65, slowTime: 2.0, damage: 9 },
    ],
  },
  starspike: {
    name: 'Starspike',
    key: '4',
    cost: 140,
    range: 235,
    damage: 55,
    fireRate: 0.55,
    color: '#b79cff',
    glow: '#e3d7ff',
    desc: 'Long-range sniper.',
    upgrades: [
      { cost: 120, damage: 88 },
      { cost: 200, damage: 135, fireRate: 0.65 },
    ],
  },
};

// The shadow creatures that march on the Heartlight.
export const ENEMIES = {
  moth: {
    name: 'Dusk Moth',
    hp: 30,
    speed: 56,
    reward: 8,
    lives: 1,
    radius: 13,
    color: '#8a5cff',
    wing: '#c9a8ff',
    eye: '#ffe66d',
  },
  beetle: {
    name: 'Gloom Beetle',
    hp: 130,
    speed: 30,
    reward: 14,
    lives: 2,
    radius: 16,
    color: '#e0575f',
    wing: '#7a2a35',
    eye: '#ffd166',
  },
  wraith: {
    name: 'Night Wraith',
    hp: 62,
    speed: 72,
    reward: 12,
    lives: 1,
    radius: 14,
    color: '#6fe3d8',
    wing: '#b8fff6',
    eye: '#ffffff',
  },
  queen: {
    name: 'Moth Queen',
    hp: 2400,
    speed: 22,
    reward: 300,
    lives: 10,
    radius: 30,
    color: '#ff5da2',
    wing: '#ffd166',
    eye: '#ffffff',
    boss: true,
  },
};

// Twelve waves. Each wave is a list of spawn groups; groups run one after the
// other, each enemy `gap` seconds after the last.
export const WAVES = [
  [{ type: 'moth', count: 8, gap: 0.9 }],
  [{ type: 'moth', count: 12, gap: 0.8 }],
  [
    { type: 'moth', count: 6, gap: 0.7 },
    { type: 'beetle', count: 4, gap: 1.2 },
  ],
  [
    { type: 'moth', count: 10, gap: 0.6 },
    { type: 'beetle', count: 6, gap: 1.0 },
  ],
  [
    { type: 'moth', count: 8, gap: 0.55 },
    { type: 'beetle', count: 6, gap: 0.9 },
    { type: 'wraith', count: 4, gap: 0.8 },
  ],
  [
    { type: 'moth', count: 14, gap: 0.5 },
    { type: 'beetle', count: 8, gap: 0.85 },
  ],
  [
    { type: 'beetle', count: 6, gap: 0.9 },
    { type: 'wraith', count: 8, gap: 0.7 },
    { type: 'moth', count: 6, gap: 0.5 },
  ],
  [
    { type: 'moth', count: 18, gap: 0.45 },
    { type: 'beetle', count: 8, gap: 0.8 },
    { type: 'wraith', count: 6, gap: 0.65 },
  ],
  [
    { type: 'beetle', count: 12, gap: 0.75 },
    { type: 'wraith', count: 10, gap: 0.6 },
  ],
  [
    { type: 'moth', count: 20, gap: 0.4 },
    { type: 'beetle', count: 10, gap: 0.7 },
    { type: 'wraith', count: 10, gap: 0.55 },
  ],
  [
    { type: 'beetle', count: 14, gap: 0.65 },
    { type: 'wraith', count: 14, gap: 0.5 },
    { type: 'moth', count: 10, gap: 0.4 },
  ],
  [
    { type: 'queen', count: 1, gap: 1.0 },
    { type: 'moth', count: 8, gap: 0.6 },
    { type: 'wraith', count: 6, gap: 0.7 },
  ],
];

// Enemy health grows 16% a wave, speed 2% a wave.
export function waveHpScale(wave) {
  return 1 + 0.16 * (wave - 1);
}

export function waveSpeedScale(wave) {
  return 1 + 0.02 * (wave - 1);
}

// Petals paid when a wave is cleared.
export function waveClearBonus(wave) {
  return 25 + wave * 5;
}
