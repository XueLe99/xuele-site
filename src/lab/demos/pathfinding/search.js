// Grid pathfinding: eight searches over the same grid (see grid.js).
// Every search takes (grid, start, goal, options) and returns
//   { visited: cells in the order they were expanded,
//     path: cells (or any-angle waypoints) from start to goal, [] if none }.
// findPath() at the bottom dispatches by name and adds { ms, cost }.
// options = { heuristic: "manhattan" | "octile" | "euclidean", diagonal: bool }

import { MinHeap, distance, isFree, lineOfSight, neighbours, pathCost, tracePath } from "./grid.js";
import { DStarLite } from "./dstar.js";

export { randomMaze, pathCost } from "./grid.js";

/**
 * A*, Dijkstra and Greedy Best-First share one loop; only the priority differs:
 *   Dijkstra  f = g          (cost so far: optimal, explores in rings)
 *   A*        f = g + h      (optimal while h never over-estimates)
 *   Greedy    f = h          (rushes at the goal; fast but not optimal)
 * Ties on f are broken towards the smaller h (closer to the goal).
 */
function bestFirst(grid, start, goal, { heuristic, diagonal }, mode) {
  const n = grid.cols * grid.rows;
  const dist = distance(heuristic, grid.cols);
  const h = mode === "dijkstra" ? () => 0 : (cell) => dist(cell, goal);
  const g = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const visited = [];
  const open = new MinHeap();

  g[start] = 0;
  open.push([h(start), h(start), start]);
  while (open.size > 0) {
    const cell = open.pop()[2];
    if (closed[cell]) continue; // stale heap entry
    closed[cell] = 1;
    visited.push(cell);
    if (cell === goal) break;
    for (const [next, step] of neighbours(grid, cell, diagonal)) {
      if (closed[next]) continue;
      const cost = g[cell] + step;
      // Greedy keeps the first parent it finds: it does not care about cost.
      if (mode === "greedy" ? g[next] === Infinity : cost < g[next]) {
        g[next] = cost;
        parent[next] = cell;
        const hn = h(next);
        open.push([mode === "greedy" ? hn : cost + hn, hn, next]);
      }
    }
  }
  return { visited, path: closed[goal] ? tracePath(parent, goal) : [] };
}

export const astar = (grid, s, t, o) => bestFirst(grid, s, t, o, "astar");
export const dijkstra = (grid, s, t, o) => bestFirst(grid, s, t, o, "dijkstra");
export const greedy = (grid, s, t, o) => bestFirst(grid, s, t, o, "greedy");

/** Breadth-first search: fewest steps (ignores the √2 cost of diagonals). */
export function bfs(grid, start, goal, { diagonal }) {
  const n = grid.cols * grid.rows;
  const parent = new Int32Array(n).fill(-1);
  const seen = new Uint8Array(n);
  const queue = [start];
  const visited = [];
  seen[start] = 1;
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    visited.push(cell);
    if (cell === goal) return { visited, path: tracePath(parent, goal) };
    for (const [next] of neighbours(grid, cell, diagonal)) {
      if (seen[next]) continue;
      seen[next] = 1;
      parent[next] = cell;
      queue.push(next);
    }
  }
  return { visited, path: [] };
}

/**
 * Bidirectional A*: one A* from the start towards the goal, one from the goal
 * towards the start, always growing the smaller frontier. `best` is the
 * cheapest start→goal route seen where the two searches touch. Each frontier's
 * smallest f is a lower bound on any route still undiscovered on that side,
 * so once either bound reaches `best`, `best` is optimal and we stop.
 */
export function bidirectionalAstar(grid, start, goal, { heuristic, diagonal }) {
  // The reverse search is rooted on the goal, so a walled goal would otherwise
  // look reachable. Every other search simply cannot step onto a wall.
  if (start !== goal && (grid.walls[start] || grid.walls[goal])) return { visited: [], path: [] };
  const n = grid.cols * grid.rows;
  const dist = distance(heuristic, grid.cols);
  const side = (from, to) => ({
    h: (cell) => dist(cell, to),
    g: new Float64Array(n).fill(Infinity),
    parent: new Int32Array(n).fill(-1),
    closed: new Uint8Array(n),
    open: new MinHeap(),
    from,
  });
  const fwd = side(start, goal);
  const bwd = side(goal, start);
  for (const s of [fwd, bwd]) {
    s.g[s.from] = 0;
    s.open.push([s.h(s.from), s.h(s.from), s.from, 0]);
  }
  // Drop stale entries (cell closed, or a cheaper entry pushed since).
  const top = (s) => {
    while (s.open.size > 0) {
      const [, , cell, g] = s.open.peek();
      if (!s.closed[cell] && g === s.g[cell]) return s.open.peek()[0];
      s.open.pop();
    }
    return Infinity;
  };

  const visited = [];
  let best = start === goal ? 0 : Infinity;
  let meet = start === goal ? start : -1;
  for (;;) {
    const f1 = top(fwd);
    const f2 = top(bwd);
    if (f1 === Infinity || f2 === Infinity || Math.max(f1, f2) >= best) break;
    const [s, other] = fwd.open.size <= bwd.open.size ? [fwd, bwd] : [bwd, fwd];
    const cell = s.open.pop()[2];
    s.closed[cell] = 1;
    visited.push(cell);
    for (const [next, step] of neighbours(grid, cell, diagonal)) {
      if (s.closed[next]) continue;
      const cost = s.g[cell] + step;
      if (cost < s.g[next]) {
        s.g[next] = cost;
        s.parent[next] = cell;
        s.open.push([cost + s.h(next), s.h(next), next, cost]);
        if (cost + other.g[next] < best) {
          best = cost + other.g[next];
          meet = next;
        }
      }
    }
  }
  if (meet === -1) return { visited, path: [] };
  const path = tracePath(fwd.parent, meet);
  for (let cell = bwd.parent[meet]; cell !== -1; cell = bwd.parent[cell]) path.push(cell);
  return { visited, path };
}

/**
 * Jump Point Search on a 4-connected grid with uniform cost.
 * Instead of pushing every neighbour, JPS "jumps" in a straight line until it
 * reaches a cell where an optimal path could turn: the goal, or a cell with a
 * forced neighbour (an opening that appears right after a wall). Only those
 * jump points enter the open list, so far fewer cells are expanded than in A*.
 * A vertical jump also scans sideways at every step, which is what keeps the
 * 4-connected version optimal. JPS always moves orthogonally (the diagonal
 * switch does not apply); `visited` lists the expanded jump points.
 */
export function jps(grid, start, goal, { heuristic }) {
  const { cols } = grid;
  const n = cols * grid.rows;
  const dist = distance(heuristic, cols);
  const g = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const visited = [];
  const open = new MinHeap();
  const free = (x, y) => isFree(grid, x, y);

  // Next jump point from (x, y) in direction (dx, dy), or -1.
  function jump(x, y, dx, dy) {
    for (;;) {
      x += dx;
      y += dy;
      if (!free(x, y)) return -1;
      const cell = y * cols + x;
      if (cell === goal) return cell;
      if (dx !== 0) {
        if ((free(x, y - 1) && !free(x - dx, y - 1)) || (free(x, y + 1) && !free(x - dx, y + 1))) return cell;
      } else {
        if ((free(x - 1, y) && !free(x - 1, y - dy)) || (free(x + 1, y) && !free(x + 1, y - dy))) return cell;
        if (jump(x, y, 1, 0) !== -1 || jump(x, y, -1, 0) !== -1) return cell;
      }
    }
  }

  g[start] = 0;
  open.push([dist(start, goal), dist(start, goal), start]);
  while (open.size > 0) {
    const cell = open.pop()[2];
    if (closed[cell]) continue;
    closed[cell] = 1;
    visited.push(cell);
    if (cell === goal) break;
    const x = cell % cols;
    const y = (cell - x) / cols;
    // Pruning: keep going straight, or turn 90°; never step back.
    let dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    if (parent[cell] !== -1) {
      const dx = Math.sign(x - (parent[cell] % cols));
      const dy = Math.sign(y - Math.floor(parent[cell] / cols));
      dirs = dx !== 0 ? [[dx, 0], [0, 1], [0, -1]] : [[0, dy], [1, 0], [-1, 0]];
    }
    for (const [dx, dy] of dirs) {
      const next = jump(x, y, dx, dy);
      if (next === -1 || closed[next]) continue;
      const cost = g[cell] + Math.abs((next % cols) - x) + Math.abs(Math.floor(next / cols) - y);
      if (cost < g[next]) {
        g[next] = cost;
        parent[next] = cell;
        open.push([cost + dist(next, goal), dist(next, goal), next]);
      }
    }
  }
  if (!closed[goal]) return { visited, path: [] };
  // Fill in the straight runs between consecutive jump points.
  const points = tracePath(parent, goal);
  const path = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const step = Math.abs(b - a) < cols ? Math.sign(b - a) : Math.sign(b - a) * cols;
    for (let cell = a + step; cell !== b + step; cell += step) path.push(cell);
  }
  return { visited, path };
}

/**
 * Basic Theta*: A* where a node may take its grandparent as parent when the
 * two can see each other. Paths are no longer tied to grid edges, so they are
 * any-angle and usually shorter than the best grid path (though not always
 * the true shortest any-angle path). `path` holds the turning points.
 */
export function thetaStar(grid, start, goal, { heuristic, diagonal }) {
  const { cols } = grid;
  const n = cols * grid.rows;
  const dist = distance(heuristic, cols);
  const euclid = distance("euclidean", cols);
  const g = new Float64Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const visited = [];
  const open = new MinHeap();

  g[start] = 0;
  parent[start] = start;
  open.push([dist(start, goal), dist(start, goal), start]);
  while (open.size > 0) {
    const cell = open.pop()[2];
    if (closed[cell]) continue;
    closed[cell] = 1;
    visited.push(cell);
    if (cell === goal) break;
    for (const [next, step] of neighbours(grid, cell, diagonal)) {
      if (closed[next]) continue;
      const up = parent[cell];
      // Path 2: skip `cell` and go straight from its parent, if visible.
      const [from, cost] = lineOfSight(grid, up, next) ? [up, g[up] + euclid(up, next)] : [cell, g[cell] + step];
      if (cost < g[next]) {
        g[next] = cost;
        parent[next] = from;
        open.push([cost + dist(next, goal), dist(next, goal), next]);
      }
    }
  }
  if (!closed[goal]) return { visited, path: [] };
  const path = [goal];
  while (path[path.length - 1] !== start) path.push(parent[path[path.length - 1]]);
  return { visited, path: path.reverse() };
}

/** D* Lite (see dstar.js); a fresh planner each call. */
export function dstarLite(grid, start, goal, options) {
  return new DStarLite(grid, start, goal, options).plan();
}

export const ALGORITHMS = {
  astar,
  dijkstra,
  bfs,
  greedy,
  bidirectional_astar: bidirectionalAstar,
  jps,
  theta_star: thetaStar,
  dstar_lite: dstarLite,
};

/**
 * findPath("astar", { walls, cols, rows }, start, goal, { heuristic, diagonal })
 * → { visited, path, ms, cost }.
 */
export function findPath(algorithm, grid, start, goal, options = {}) {
  const opts = { heuristic: "manhattan", diagonal: false, ...options };
  const t0 = performance.now();
  const result = ALGORITHMS[algorithm](grid, start, goal, opts);
  result.ms = performance.now() - t0;
  result.cost = result.path.length ? pathCost(result.path, grid.cols) : Infinity;
  return result;
}
