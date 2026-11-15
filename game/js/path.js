// The winding path the shadow creatures march along, and the Heartlight
// crystal they are trying to reach. The path snakes through the field so a
// tower in the middle covers two stretches at once.

import { TILE, FIELD_TOP } from './config.js';

// Waypoints in pixels, from the left edge to the Heartlight. Row centres are
// FIELD_TOP + row * TILE + TILE / 2: row 1 is 184, row 3 is 344, row 5 is 504.
export const WAYPOINTS = [
  { x: -40, y: 184 },
  { x: 920, y: 184 },
  { x: 920, y: 344 },
  { x: 360, y: 344 },
  { x: 360, y: 504 },
  { x: 1252, y: 504 },
];

// The Heartlight crystal, standing at the path's end on the right edge.
export const HEARTLIGHT = { x: 1252, y: 504 };

// The set of tiles the path covers, as "col,row" strings.
function buildPathTiles() {
  const set = new Set();
  const add = (col, row) => set.add(`${col},${row}`);
  for (let c = 0; c <= 11; c++) add(c, 1);
  for (let r = 1; r <= 3; r++) add(11, r);
  for (let c = 4; c <= 11; c++) add(c, 3);
  for (let r = 3; r <= 5; r++) add(4, r);
  for (let c = 4; c <= 15; c++) add(c, 5);
  return set;
}

export const PATH_TILES = buildPathTiles();

// True when a tile is part of the path (and so cannot hold a tower).
export function isPathTile(col, row) {
  return PATH_TILES.has(`${col},${row}`);
}

// The pixel position of a point on the tile grid.
export function gridPoint(col, row) {
  return { x: col * TILE, y: FIELD_TOP + row * TILE };
}
