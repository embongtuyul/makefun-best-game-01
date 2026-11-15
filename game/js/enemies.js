// The shadow creatures marching on the Heartlight. An enemy follows the path
// waypoint by waypoint; its health and speed scale with the wave that spawned
// it, night makes it faster, and frost slows it (the Moth Queen resists).

import { ENEMIES, waveHpScale, waveSpeedScale, NIGHT_SPEED_BOOST } from './config.js';
import { WAYPOINTS } from './path.js';

let nextId = 1;

export class Enemy {
  constructor(type, wave) {
    const def = ENEMIES[type];
    this.id = nextId++;
    this.type = type;
    this.def = def;
    this.maxHp = Math.round(def.hp * waveHpScale(wave));
    this.hp = this.maxHp;
    this.baseSpeed = def.speed * waveSpeedScale(wave);
    this.x = WAYPOINTS[0].x;
    this.y = WAYPOINTS[0].y;
    this.wp = 1;
    this.dist = 0;
    this.radius = def.radius;
    this.alive = true;
    this.leaked = false;
    this.slowUntil = 0;
    this.slowFactor = 0;
    this.wobble = Math.random() * Math.PI * 2;
    this.flash = 0;
  }

  // Chill this enemy: the strongest slow wins, and a fresh chill refreshes it.
  applySlow(factor, seconds, now) {
    if (this.def.boss) factor *= 0.35;
    if (factor > this.slowFactor) {
      this.slowFactor = factor;
      this.slowUntil = now + seconds;
    } else if (this.slowUntil < now + seconds) {
      this.slowUntil = now + seconds;
    }
  }

  // Deal damage. Returns true when the hit kills this enemy.
  takeDamage(amount) {
    this.hp -= amount;
    this.flash = 0.08;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    return false;
  }

  // Walk the path for dt seconds. Night speeds the swarm up.
  update(dt, now, isNight) {
    if (!this.alive) return;
    if (this.flash > 0) this.flash -= dt;
    let speed = this.baseSpeed * (isNight ? NIGHT_SPEED_BOOST : 1);
    if (now < this.slowUntil) speed *= 1 - this.slowFactor;
    let remaining = speed * dt;
    while (remaining > 0 && this.wp < WAYPOINTS.length) {
      const target = WAYPOINTS[this.wp];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d <= remaining) {
        this.x = target.x;
        this.y = target.y;
        this.dist += d;
        remaining -= d;
        this.wp++;
      } else {
        this.x += (dx / d) * remaining;
        this.y += (dy / d) * remaining;
        this.dist += remaining;
        remaining = 0;
      }
    }
    if (this.wp >= WAYPOINTS.length) {
      this.alive = false;
      this.leaked = true;
    }
  }

  // Jump this enemy forward along the path by a distance, used to stage
  // mid-wave screenshots without waiting for the march.
  advanceAlongPath(distance) {
    let remaining = distance;
    while (remaining > 0 && this.wp < WAYPOINTS.length) {
      const target = WAYPOINTS[this.wp];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d <= remaining) {
        this.x = target.x;
        this.y = target.y;
        this.dist += d;
        remaining -= d;
        this.wp++;
      } else {
        this.x += (dx / d) * remaining;
        this.y += (dy / d) * remaining;
        this.dist += remaining;
        remaining = 0;
      }
    }
  }
}
