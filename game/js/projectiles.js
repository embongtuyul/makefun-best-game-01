// A glowing shot flying from a tower to its target. Projectiles home in on
// their target's current position; when they arrive, the game applies the
// damage (and any splash or slow) and the projectile is gone.

export class Projectile {
  constructor(x, y, target, opts) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.tower = opts.tower || null;
    this.speed = opts.speed || 420;
    this.damage = opts.damage;
    this.splash = opts.splash || 0;
    this.slow = opts.slow || 0;
    this.slowTime = opts.slowTime || 0;
    this.color = opts.color;
    this.radius = opts.radius || 5;
    this.dead = false;
    this.trail = [];
  }

  // Move toward the target. Returns { hit: enemy } on arrival, null otherwise.
  update(dt) {
    const t = this.target;
    if (!t || !t.alive) {
      this.dead = true;
      return null;
    }
    const dx = t.x - this.x;
    const dy = t.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step + t.radius) {
      this.dead = true;
      return { hit: t };
    }
    this.x += (dx / dist) * step;
    this.y += (dy / dist) * step;
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();
    return null;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      ctx.globalAlpha = (i / this.trail.length) * 0.5;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, this.radius * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
