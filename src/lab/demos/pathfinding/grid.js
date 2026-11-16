// Grid helpers shared by every search in search.js and dstar.js.
// A grid is { walls: Uint8Array (1 = wall), cols, rows }; a cell is the
// index y * cols + x. Orthogonal steps cost 1, diagonal steps cost √2, and a
// diagonal step may not cut a corner: both orthogonal cells must be open.

export const SQRT2 = Math.SQRT2;

export function isFree(grid, x, y) {
  return x >= 0 && y >= 0 && x < grid.cols && y < grid.rows && !grid.walls[y * grid.cols + x];
}

const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Open neighbours of `cell` as [next, stepCost] pairs. */
export function neighbours(grid, cell, diagonal) {
  const { cols } = grid;
  const x = cell % cols;
  const y = (cell - x) / cols;
  const out = [];
  for (const [dx, dy] of ORTHO) {
    if (isFree(grid, x + dx, y + dy)) out.push([cell + dy * cols + dx, 1]);
  }
  if (diagonal) {
    for (const [dx, dy] of DIAG) {
      if (isFree(grid, x + dx, y + dy) && isFree(grid, x + dx, y) && isFree(grid, x, y + dy)) {
        out.push([cell + dy * cols + dx, SQRT2]);
      }
    }
  }
  return out;
}

/**
 * Distance estimates on |dx|, |dy|.
 * - manhattan: exact on a 4-connected grid; over-estimates once diagonal
 *   steps are allowed, so A* may then return a slightly longer path.
 * - octile: exact on an 8-connected grid without obstacles.
 * - euclidean: straight-line distance, never over-estimates (weakest guide).
 */
export const HEURISTICS = {
  manhattan: (dx, dy) => dx + dy,
  octile: (dx, dy) => dx + dy + (SQRT2 - 2) * Math.min(dx, dy),
  euclidean: (dx, dy) => Math.sqrt(dx * dx + dy * dy),
};

/** h(a, b) between two cells for the named heuristic. */
export function distance(name, cols) {
  const f = HEURISTICS[name] || HEURISTICS.manhattan;
  return (a, b) => f(Math.abs((a % cols) - (b % cols)), Math.abs(Math.floor(a / cols) - Math.floor(b / cols)));
}

/** Euclidean length of a path given as cells (or any-angle waypoints). */
export function pathCost(path, cols) {
  const euclid = distance("euclidean", cols);
  let cost = 0;
  for (let i = 1; i < path.length; i++) cost += euclid(path[i - 1], path[i]);
  return cost;
}

/**
 * Line of sight between two cell centres (for Theta*): walks every cell the
 * segment touches (a "supercover" line). When the segment passes exactly
 * through a grid corner, both cells beside that corner must be open, so a
 * line never slips between two diagonal walls.
 */
export function lineOfSight(grid, a, b) {
  const { cols } = grid;
  let x = a % cols;
  let y = Math.floor(a / cols);
  const x1 = b % cols;
  const y1 = Math.floor(b / cols);
  const dx = Math.abs(x1 - x);
  const dy = Math.abs(y1 - y);
  const sx = Math.sign(x1 - x);
  const sy = Math.sign(y1 - y);
  for (let ix = 0, iy = 0; ix < dx || iy < dy; ) {
    const decision = (1 + 2 * ix) * dy - (1 + 2 * iy) * dx;
    if (decision === 0) {
      if (!isFree(grid, x + sx, y) || !isFree(grid, x, y + sy)) return false;
      x += sx;
      y += sy;
      ix++;
      iy++;
    } else if (decision < 0) {
      x += sx;
      ix++;
    } else {
      y += sy;
      iy++;
    }
    if (!isFree(grid, x, y)) return false;
  }
  return true;
}

/** Binary min-heap; items are arrays compared on [0], then [1]. */
export class MinHeap {
  constructor() {
    this.items = [];
  }
  get size() {
    return this.items.length;
  }
  peek() {
    return this.items[0];
  }
  less(a, b) {
    return a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
  }
  push(item) {
    const items = this.items;
    let i = items.push(item) - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (!this.less(items[i], items[parent])) break;
      [items[i], items[parent]] = [items[parent], items[i]];
      i = parent;
    }
  }
  pop() {
    const items = this.items;
    const top = items[0];
    const last = items.pop();
    if (items.length > 0) {
      items[0] = last;
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        const right = left + 1;
        let min = i;
        if (left < items.length && this.less(items[left], items[min])) min = left;
        if (right < items.length && this.less(items[right], items[min])) min = right;
        if (min === i) break;
        [items[i], items[min]] = [items[min], items[i]];
        i = min;
      }
    }
    return top;
  }
}

/** Follow parent links from `goal` back to the start. */
export function tracePath(parent, goal) {
  const path = [];
  for (let cell = goal; cell !== -1; cell = parent[cell]) path.push(cell);
  return path.reverse();
}

/**
 * Random maze: depth-first "recursive backtracker" on the odd cells, then a
 * few extra openings so that there are loops and more than one route.
 */
export function randomMaze(cols, rows, random = Math.random) {
  const walls = new Uint8Array(cols * rows).fill(1);
  const stack = [[1, 1]];
  walls[1 * cols + 1] = 0;
  while (stack.length > 0) {
    const [x, y] = stack[stack.length - 1];
    const options = [[2, 0], [-2, 0], [0, 2], [0, -2]].filter(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      return nx > 0 && ny > 0 && nx < cols && ny < rows && walls[ny * cols + nx];
    });
    if (options.length === 0) {
      stack.pop();
      continue;
    }
    const [dx, dy] = options[Math.floor(random() * options.length)];
    walls[(y + dy / 2) * cols + (x + dx / 2)] = 0;
    walls[(y + dy) * cols + (x + dx)] = 0;
    stack.push([x + dx, y + dy]);
  }
  for (let i = 0; i < walls.length; i++) {
    const x = i % cols;
    const y = Math.floor(i / cols);
    if (walls[i] && x > 0 && y > 0 && random() < 0.12) walls[i] = 0;
  }
  return walls;
}
