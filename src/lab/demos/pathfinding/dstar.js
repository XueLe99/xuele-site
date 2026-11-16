// D* Lite (Koenig & Likhachev, 2002), incremental replanning on a grid.
//
// It searches backwards from the goal: g(s) is the known cost from s to the
// goal, rhs(s) the one-step lookahead min over neighbours (c(s, s') + g(s')).
// A cell is "consistent" when g = rhs; the priority queue holds only the
// inconsistent ones. When walls change, only the cells next to the change
// become inconsistent, and ComputeShortestPath repairs just the part of the
// search tree that depended on them — instead of searching from scratch.
//
//   const planner = new DStarLite(grid, start, goal, options);
//   planner.plan();                 // → { visited, path }
//   grid.walls[cell] = 1;           // the world changes…
//   planner.update([cell]);         // → { visited: only the cells re-expanded, path }

import { MinHeap, distance, neighbours } from "./grid.js";

export class DStarLite {
  constructor(grid, start, goal, { heuristic = "manhattan", diagonal = false } = {}) {
    const n = grid.cols * grid.rows;
    this.grid = grid;
    this.start = start;
    this.goal = goal;
    this.diagonal = diagonal;
    this.h = distance(heuristic, grid.cols);
    this.km = 0; // key modifier; stays 0 here because the start never moves
    this.g = new Float64Array(n).fill(Infinity);
    this.rhs = new Float64Array(n).fill(Infinity);
    this.version = new Int32Array(n); // lazy deletion: heap entries carry a version
    this.queued = new Uint8Array(n);
    this.open = new MinHeap();
    this.rhs[goal] = 0;
    this.insert(goal);
  }

  key(s) {
    const m = Math.min(this.g[s], this.rhs[s]);
    return [m + this.h(this.start, s) + this.km, m];
  }

  insert(s) {
    const [k1, k2] = this.key(s);
    this.queued[s] = 1;
    this.open.push([k1, k2, s, ++this.version[s]]);
  }

  remove(s) {
    this.queued[s] = 0;
    this.version[s]++;
  }

  top() {
    while (this.open.size > 0) {
      const item = this.open.peek();
      if (this.queued[item[2]] && item[3] === this.version[item[2]]) return item;
      this.open.pop();
    }
    return null;
  }

  updateVertex(u) {
    if (u !== this.goal) {
      let best = Infinity;
      if (!this.grid.walls[u]) {
        for (const [v, c] of neighbours(this.grid, u, this.diagonal)) best = Math.min(best, c + this.g[v]);
      }
      this.rhs[u] = best;
    }
    if (this.queued[u]) this.remove(u);
    if (this.g[u] !== this.rhs[u]) this.insert(u);
  }

  computeShortestPath() {
    const expanded = [];
    // Keys are sums of √2 steps and heuristics, so compare with a tolerance:
    // a rounding-level difference must not end the search early.
    const EPS = 1e-9;
    const less = (a, b) => a[0] < b[0] - EPS || (a[0] <= b[0] + EPS && a[1] < b[1] - EPS);
    const { g, rhs, start } = this;
    for (;;) {
      const top = this.top();
      if (!top) break;
      if (!less(top, this.key(start)) && rhs[start] === g[start]) break;
      const u = top[2];
      const fresh = this.key(u);
      if (less(top, fresh)) {
        this.remove(u); // key went stale (km changed): requeue with the new key
        this.insert(u);
      } else if (g[u] > rhs[u]) {
        // Over-consistent: a cheaper route was found; settle it.
        this.remove(u);
        g[u] = rhs[u];
        expanded.push(u);
        for (const [v] of neighbours(this.grid, u, this.diagonal)) this.updateVertex(v);
      } else {
        // Under-consistent: the route through u got worse (e.g. a new wall).
        g[u] = Infinity;
        expanded.push(u);
        this.updateVertex(u);
        for (const [v] of neighbours(this.grid, u, this.diagonal)) this.updateVertex(v);
      }
    }
    return expanded;
  }

  /** Walk downhill on g from the start. */
  extractPath() {
    if (this.g[this.start] === Infinity) return [];
    const path = [this.start];
    const limit = this.g.length;
    for (let s = this.start; s !== this.goal; ) {
      let next = -1;
      let best = Infinity;
      for (const [v, c] of neighbours(this.grid, s, this.diagonal)) {
        if (c + this.g[v] < best) {
          best = c + this.g[v];
          next = v;
        }
      }
      if (next === -1 || path.length > limit) return [];
      path.push(next);
      s = next;
    }
    return path;
  }

  plan() {
    const visited = this.computeShortestPath();
    return { visited, path: this.extractPath() };
  }

  /**
   * Call after flipping walls in grid.walls. A changed cell alters its own
   * edges and the diagonal edges that pass its corners, so the cell and its
   * eight neighbours get their rhs recomputed.
   */
  update(changed) {
    const { cols, rows } = this.grid;
    for (const cell of changed) {
      const x = cell % cols;
      const y = (cell - x) / cols;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) this.updateVertex(ny * cols + nx);
        }
      }
    }
    return this.plan();
  }
}
