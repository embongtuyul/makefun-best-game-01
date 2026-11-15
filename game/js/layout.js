// Every clickable region of the game, in one place: the renderer draws them
// and the input handler tests them from the same rectangles.

import { VIEW_W, VIEW_H, HUD_H, BAR_H, TILE, COLS, ROWS, FIELD_TOP } from './config.js';

// The pixel rectangle of one field tile.
export function tileRect(col, row) {
  return { x: col * TILE, y: FIELD_TOP + row * TILE, w: TILE, h: TILE };
}

// The pixel centre of one field tile.
export function tileCenter(col, row) {
  return { x: col * TILE + TILE / 2, y: FIELD_TOP + row * TILE + TILE / 2 };
}

// The tile under a canvas point, or null when the point is outside the field.
export function tileAt(x, y) {
  if (y < FIELD_TOP || y >= FIELD_TOP + ROWS * TILE || x < 0 || x >= COLS * TILE) return null;
  return { col: Math.floor(x / TILE), row: Math.floor((y - FIELD_TOP) / TILE) };
}

// True when a point lies inside a rectangle.
export function pointInRect(x, y, rect) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

// The four HUD buttons, top right.
export function startWaveButtonRect() {
  return { x: 700, y: 10, w: 160, h: 44 };
}

export function speedButtonRect() {
  return { x: 870, y: 10, w: 80, h: 44 };
}

export function pauseButtonRect() {
  return { x: 960, y: 10, w: 80, h: 44 };
}

export function muteButtonRect() {
  return { x: 1050, y: 10, w: 80, h: 44 };
}

// One of the four tower cards in the build bar.
export function buildCardRect(index) {
  return { x: 16 + index * 190, y: VIEW_H - BAR_H + 10, w: 178, h: 76 };
}

// The selected-tower panel, right of the build cards.
export function towerPanelRect() {
  return { x: 792, y: VIEW_H - BAR_H + 10, w: 472, h: 76 };
}

export function upgradeButtonRect() {
  return { x: 1024, y: VIEW_H - BAR_H + 18, w: 120, h: 52 };
}

export function sellButtonRect() {
  return { x: 1152, y: VIEW_H - BAR_H + 18, w: 96, h: 52 };
}

// The big START button on the title screen.
export function startButtonRect() {
  return { x: (VIEW_W - 260) / 2, y: 470, w: 260, h: 64 };
}

// The RESTART button on the win and loss screens.
export function restartButtonRect() {
  return { x: (VIEW_W - 260) / 2, y: 500, w: 260, h: 56 };
}
