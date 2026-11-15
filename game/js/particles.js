// Short-lived visual feedback: bursts when an enemy pops, rings when a frost
// bell fires, and floating "+8" texts when petals are earned. Particles are
// decoration only; they never change the game state.

export class Particles {
  constructor() {
    this.list = [];
    this.floats = [];
  }

  // A burst of glowing dots flying out from a point.
  burst(x, y, color, count = 10, speed = 130) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      this.list.push({
        kind: 'dot',
        x,
        y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - 30,
        life: 0.45 + Math.random() * 0.3,
        maxLife: 0.75,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  // An expanding ring, for frost hits and planting.
  ring(x, y, color, maxRadius = 46) {
    this.list.push({
      kind: 'ring',
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.35,
      maxLife: 0.35,
      size: maxRadius,
      color,
    });
  }

  // A small rising text, for petal rewards and wave bonuses.
  floatText(x, y, text, color = '#ffd166') {
    this.floats.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
  }

  update(dt) {
    for (const p of this.list) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
    }
    this.list = this.list.filter((p) => p.life > 0);
    for (const f of this.floats) {
      f.life -= dt;
      f.y -= 34 * dt;
    }
    this.floats = this.floats.filter((f) => f.life > 0);
  }

  draw(ctx) {
    for (const p of this.list) {
      const t = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = t;
      if (p.kind === 'ring') {
        const r = p.size * (1 - t) + 6;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * t + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.font = 'bold 15px system-ui, sans-serif';
    for (const f of this.floats) {
      ctx.globalAlpha = Math.min(1, (f.life / f.maxLife) * 2);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }
}
