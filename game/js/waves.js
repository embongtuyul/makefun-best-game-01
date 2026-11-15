// A wave's spawn schedule: the wave's groups, one after another, each enemy
// a short gap after the last, with a little seeded jitter so no two marches
// look identical.

import { WAVES } from './config.js';
import { Enemy } from './enemies.js';

export class WaveSpawner {
  constructor(wave, rng) {
    this.wave = wave;
    this.queue = [];
    let t = 0.5;
    for (const group of WAVES[wave - 1]) {
      for (let i = 0; i < group.count; i++) {
        this.queue.push({ type: group.type, at: t });
        t += group.gap * rng.range(0.85, 1.15);
      }
      t += 0.8;
    }
    this.elapsed = 0;
    this.done = this.queue.length === 0;
  }

  // Release every enemy whose time has come into the game's enemy list.
  update(dt, enemies) {
    if (this.done) return;
    this.elapsed += dt;
    while (this.queue.length > 0 && this.queue[0].at <= this.elapsed) {
      const spawn = this.queue.shift();
      enemies.push(new Enemy(spawn.type, this.wave));
    }
    if (this.queue.length === 0) this.done = true;
  }
}
