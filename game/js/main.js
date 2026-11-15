// Boot the game: wire the canvas, the keyboard and the mouse, and run the
// frame loop. With ?shot=<name>&seed=<n> in the URL, stage a frozen scene for
// a screenshot instead and set window.__shotReady when it is drawn.

import { Game } from './game.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';
import { tileAt } from './layout.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 1);

const game = new Game(seed);
window.__game = game;

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
}

if (shot) {
  stageShot(game, shot, seed);
  drawGame(ctx, game);
  window.__shotReady = true;
} else {
  canvas.addEventListener('click', (event) => {
    const p = canvasPoint(event);
    game.handleClick(p.x, p.y);
  });
  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPoint(event);
    game.hover = { x: p.x, y: p.y, tile: tileAt(p.x, p.y) };
  });
  canvas.addEventListener('mouseleave', () => {
    game.hover = null;
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === ' ') event.preventDefault();
    game.handleKey(event.key);
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game.update(dt * game.speed);
    drawGame(ctx, game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
