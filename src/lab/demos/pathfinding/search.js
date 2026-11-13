// Grid pathfinding: A* and Dijkstra share one loop.
// The grid is a flat Uint8Array (1 = wall); a cell is the index y * cols + x.
// Moves are 4-directional and every step costs 1.

/** Binary min-heap of [priority, tieBreak, cell]. */
class MinHeap {
  constructor() {
    this.items = [];
  }
  get size() {
    return this.items.length;
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

/**
 * algorithm: "astar" | "dijkstra".
 * Dijkstra orders the frontier by g (cost so far). A* orders it by
 * f = g + h, where h is the Manhattan distance to the goal: it never
 * over-estimates on a 4-connected grid, so the path is still a shortest one,
 * but far fewer cells are expanded. Dijkstra is simply A* with h = 0.
 *
 * Returns { visited: cells in the order they were expanded,
 *           path: cells from start to goal, [] when unreachable }.
 */
export function findPath(walls, cols, rows, start, goal, algorithm = "astar") {
  const gx = goal % cols;
  const gy = Math.floor(goal / cols);
  const h =
    algorithm === "astar"
      ? (cell) => Math.abs((cell % cols) - gx) + Math.abs(Math.floor(cell / cols) - gy)
      : () => 0;

  const cost = new Float64Array(cols * rows).fill(Infinity);
  const cameFrom = new Int32Array(cols * rows).fill(-1);
  const closed = new Uint8Array(cols * rows);
  const visited = [];
  const open = new MinHeap();

  cost[start] = 0;
  open.push([h(start), h(start), start]);

  while (open.size > 0) {
    const cell = open.pop()[2];
    if (closed[cell]) continue; // stale heap entry
    closed[cell] = 1;
    visited.push(cell);
    if (cell === goal) break;

    const x = cell % cols;
    const y = Math.floor(cell / cols);
    const neighbours = [];
    if (x > 0) neighbours.push(cell - 1);
    if (x < cols - 1) neighbours.push(cell + 1);
    if (y > 0) neighbours.push(cell - cols);
    if (y < rows - 1) neighbours.push(cell + cols);

    for (const next of neighbours) {
      if (walls[next] || closed[next]) continue;
      const g = cost[cell] + 1;
      if (g < cost[next]) {
        cost[next] = g;
        cameFrom[next] = cell;
        // Ties on f are broken towards the smaller h (closer to the goal).
        open.push([g + h(next), h(next), next]);
      }
    }
  }

  const path = [];
  if (closed[goal]) {
    for (let cell = goal; cell !== -1; cell = cameFrom[cell]) path.push(cell);
    path.reverse();
  }
  return { visited, path };
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
