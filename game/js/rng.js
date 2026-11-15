// Seeded random numbers (mulberry32), so staged screenshots and replays are
// reproducible: the same seed always grows the same garden.

// A tiny deterministic PRNG stream.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Convenience wrapper around one mulberry32 stream.
export class Rng {
  constructor(seed = 1) {
    this.next = mulberry32(seed);
  }

  // A float in [0, 1).
  float() {
    return this.next();
  }

  // A float in [min, max).
  range(min, max) {
    return min + this.next() * (max - min);
  }

  // An integer in [min, max].
  int(min, max) {
    return Math.floor(this.range(min, max + 1));
  }

  // One element of an array, uniformly.
  pick(list) {
    return list[Math.floor(this.next() * list.length)];
  }

  // True with probability p.
  chance(p) {
    return this.next() < p;
  }
}
