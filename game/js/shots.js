// Deterministic staged states for screenshots: ?shot=start|play|night|win
// (and lose) builds a fixed scene from a seed, runs the simulation a fixed
// number of steps, and freezes it — so the screenshots are real renders of
// the game, taken the same way every time.

import { Enemy } from './enemies.js';
import { WaveSpawner } from './waves.js';
import { tileCenter } from './layout.js';

// Plant a tower for a staged scene, growing it to a level, free of charge.
function stageTower(game, type, col, row, level = 0) {
  if (!game.placeTower(type, col, row, true)) return;
  const tower = game.towers.get(`${col},${row}`);
  for (let i = 0; i < level; i++) tower.upgrade();
}

// Drop an enemy onto the path, already some distance along it.
function stageEnemy(game, type, wave, distance) {
  const enemy = new Enemy(type, wave);
  enemy.advanceAlongPath(distance);
  game.enemies.push(enemy);
}

// Run the simulation a fixed number of 60fps steps, then clear any banner.
function runTicks(game, ticks) {
  for (let i = 0; i < ticks; i++) game.update(1 / 60);
  game.banner = null;
}

// Build one staged scene into the game.
export function stageShot(game, name, seed = 1) {
  game.shotMode = true;
  game.reset();

  if (name === 'start') {
    game.state = 'title';
    game.time = 3;
    return;
  }

  if (name === 'win') {
    game.state = 'won';
    game.wave = 12;
    game.score = 8420;
    game.kills = 231;
    game.leaks = 3;
    game.petals = 410;
    game.lives = 14;
    return;
  }

  if (name === 'lose') {
    game.state = 'lost';
    game.wave = 9;
    game.score = 3120;
    game.kills = 148;
    game.leaks = 21;
    game.petals = 60;
    game.lives = 0;
    return;
  }

  if (name === 'play') {
    game.state = 'playing';
    game.wave = 5;
    game.waveActive = true;
    game.spawner = new WaveSpawner(5, game.rng);
    game.petals = 215;
    game.score = 1240;
    game.kills = 87;
    game.lives = 18;
    game.cycle = 8; // mid-day
    stageTower(game, 'sunbloom', 2, 0);
    stageTower(game, 'sunbloom', 6, 0);
    stageTower(game, 'sunbloom', 10, 0);
    stageTower(game, 'sunbloom', 1, 4);
    stageTower(game, 'thornvine', 9, 2);
    stageTower(game, 'thornvine', 5, 4);
    stageTower(game, 'frostbell', 7, 2);
    stageTower(game, 'starspike', 13, 2, 1);
    stageEnemy(game, 'moth', 5, 150);
    stageEnemy(game, 'wraith', 5, 200);
    stageEnemy(game, 'moth', 5, 280);
    stageEnemy(game, 'beetle', 5, 350);
    stageEnemy(game, 'moth', 5, 420);
    stageEnemy(game, 'wraith', 5, 480);
    stageEnemy(game, 'moth', 5, 560);
    stageEnemy(game, 'beetle', 5, 700);
    stageEnemy(game, 'moth', 5, 880);
    stageEnemy(game, 'moth', 5, 1050);
    runTicks(game, 240);
    return;
  }

  if (name === 'night') {
    game.state = 'playing';
    game.wave = 11;
    game.waveActive = true;
    game.spawner = new WaveSpawner(11, game.rng);
    game.petals = 320;
    game.score = 4860;
    game.kills = 214;
    game.lives = 12;
    game.cycle = 32; // deep night
    game.isNight = true;
    stageTower(game, 'sunbloom', 2, 0);
    stageTower(game, 'sunbloom', 6, 0);
    stageTower(game, 'sunbloom', 10, 0);
    stageTower(game, 'sunbloom', 14, 0);
    stageTower(game, 'sunbloom', 1, 4);
    stageTower(game, 'sunbloom', 8, 4);
    stageTower(game, 'thornvine', 9, 2, 2);
    stageTower(game, 'thornvine', 5, 4, 1);
    stageTower(game, 'frostbell', 7, 2, 1);
    stageTower(game, 'starspike', 13, 2, 2);
    stageEnemy(game, 'moth', 11, 100);
    stageEnemy(game, 'wraith', 11, 150);
    stageEnemy(game, 'beetle', 11, 250);
    stageEnemy(game, 'wraith', 11, 300);
    stageEnemy(game, 'moth', 11, 350);
    stageEnemy(game, 'queen', 11, 400);
    stageEnemy(game, 'beetle', 11, 500);
    stageEnemy(game, 'wraith', 11, 550);
    stageEnemy(game, 'moth', 11, 600);
    stageEnemy(game, 'beetle', 11, 650);
    stageEnemy(game, 'wraith', 11, 750);
    stageEnemy(game, 'moth', 11, 900);
    runTicks(game, 200);
    return;
  }

  // Unknown shot name: fall back to the title screen.
  game.state = 'title';
  game.time = 3;
}
