// Pathfinding demo. Searches live in search.js. D* Lite keeps the planner
// from dstar.js so a wall drawn after (or during) a run replans incrementally.

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DStarLite } from "./dstar.js";
import { COMPACT } from "./env.js";
import { LOCALE } from "./locale.js";
import { findPath, pathCost, randomMaze } from "./search.js";

const TEXT = {
  en: {
    algos: {
      astar: "A*",
      dijkstra: "Dijkstra",
      jps: "JPS",
      bidirectional_astar: "Bidirectional A*",
      theta_star: "Theta*",
      dstar_lite: "D* Lite",
      greedy: "Greedy",
      bfs: "BFS",
    },
    titles: { jps: "Jump point search", greedy: "Greedy best-first" },
    compare: "Compare",
    compareHint: "Pick 2–4 algorithms. They search the same map; a gold border marks the fewest cells visited.",
    heuristic: "Heuristic",
    heuristics: { manhattan: "Manhattan", octile: "Octile", euclidean: "Euclidean" },
    diagonal: "Diagonals",
    jpsNote: "JPS only steps up, down, left and right, so the diagonal switch does not apply.",
    speed: "Speed",
    run: "Run",
    maze: "Random maze",
    clearWalls: "Clear walls",
    clearPath: "Clear path",
    algorithm: "Algorithm",
    optimal: "Optimal",
    yes: "Yes",
    no: "No",
    optimalYes: "Shortest path is guaranteed with these settings.",
    optimalNo: "Shortest path is not guaranteed with these settings.",
    visited: "Visited",
    length: "Path length",
    lengthTitle: "Euclidean length. A diagonal step costs √2.",
    time: "Time (ms)",
    none: "no path",
    manhattanNote: "Manhattan distance overestimates when diagonal steps are allowed, so A*, bidirectional A* and D* Lite may not be optimal.",
    hint: "Drag to draw or erase walls. Drag the cyan start or the gold goal to move it. Path length is Euclidean (a diagonal step costs √2). With D* Lite, adding a wall replans incrementally and the new cell flashes red.",
    legend: { start: "Start", goal: "Goal", wall: "Wall", visited: "Visited", path: "Path" },
  },
  zh: {
    algos: {
      astar: "A*",
      dijkstra: "Dijkstra",
      jps: "JPS",
      bidirectional_astar: "双向 A*",
      theta_star: "Theta*",
      dstar_lite: "D* Lite",
      greedy: "贪心",
      bfs: "广度优先",
    },
    titles: { jps: "跳点搜索", greedy: "贪心最佳优先搜索" },
    compare: "对比",
    compareHint: "选择 2–4 个算法，在同一张地图上搜索；金色边框表示访问格子最少。",
    heuristic: "启发函数",
    heuristics: { manhattan: "曼哈顿", octile: "八方向", euclidean: "欧几里得" },
    diagonal: "允许对角",
    jpsNote: "JPS 只沿上下左右跳转，对角开关对它不起作用。",
    speed: "速度",
    run: "运行",
    maze: "随机迷宫",
    clearWalls: "清除墙体",
    clearPath: "清除路径",
    algorithm: "算法",
    optimal: "最优",
    yes: "是",
    no: "否",
    optimalYes: "在当前设置下保证最短路径。",
    optimalNo: "在当前设置下不保证最短路径。",
    visited: "访问格数",
    length: "路径长度",
    lengthTitle: "欧几里得长度，对角一步的代价为 √2。",
    time: "耗时（毫秒）",
    none: "无路径",
    manhattanNote: "允许对角时，曼哈顿距离会高估实际代价，因此 A*、双向 A* 和 D* Lite 不一定得到最短路径。",
    hint: "在网格上拖动可画墙或擦除，拖动青色起点或金色终点可移动它们。路径长度按欧几里得距离计算（对角一步的代价为 √2）。使用 D* Lite 时，新增墙体会闪红并增量重规划。",
    legend: { start: "起点", goal: "终点", wall: "墙", visited: "已访问", path: "路径" },
  },
};
const t = TEXT[LOCALE] || TEXT.en;

const COLS = 31;
const ROWS = 21;
const CELL = 16;
const VISIT_MS = 8;
const PATH_MS = 300;
const FLASH_MS = 200;
const HEURISTICS = ["manhattan", "octile", "euclidean"];
const SPEEDS = [0.5, 1, 2];

// Id order matches ALGORITHMS in search.js. Colors are the visited/path ink.
const ALGOS = [
  { id: "astar", color: "#6EE7F2" },
  { id: "dijkstra", color: "#9AA0B4" },
  { id: "jps", color: "#E8C56B" },
  { id: "bidirectional_astar", color: "#B48CFF" },
  { id: "theta_star", color: "#7CF2A4" },
  { id: "dstar_lite", color: "#FF8A6B" },
  { id: "greedy", color: "#5E6A82" },
  { id: "bfs", color: "#8FB3FF" },
];
const COLOR = Object.fromEntries(ALGOS.map((a) => [a.id, a.color]));

const INK = {
  bg: "#0B0F1A",
  line: "#1E2433",
  wall: "#59617A",
  flash: "#FF6B6B",
  start: "#6EE7F2",
  goal: "#E8C56B",
};

/** Shortest-path guarantee under the current movement model and heuristic. */
function isOptimal(id, heuristic, diagonal) {
  if (id === "greedy" || id === "theta_star") return false;
  // BFS ignores step cost; JPS never takes a diagonal.
  if (id === "bfs" || id === "jps") return !diagonal;
  if (id === "dijkstra") return true;
  // A*, bidirectional A*, D* Lite: Manhattan overestimates once diagonals cost √2.
  return !(diagonal && heuristic === "manhattan");
}

function tint(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function formatLength(cost) {
  if (!Number.isFinite(cost)) return t.none;
  const rounded = Math.round(cost * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function center(cell) {
  const x = cell % COLS;
  const y = (cell - x) / COLS;
  return { x: x * CELL + CELL / 2, y: y * CELL + CELL / 2 };
}

function clipPolyline(pts, amount) {
  if (amount >= 1) return pts;
  let total = 0;
  const seg = [];
  for (let i = 1; i < pts.length; i++) {
    const len = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    seg.push(len);
    total += len;
  }
  if (total === 0) return [pts[0]];
  let remain = total * amount;
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const len = seg[i - 1];
    if (remain >= len || len === 0) {
      out.push(pts[i]);
      remain -= len;
    } else {
      const k = remain / len;
      out.push({
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k,
      });
      break;
    }
  }
  return out;
}

function fillCell(ctx, cell, color, inset = 0) {
  const x = cell % COLS;
  const y = (cell - x) / COLS;
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL + inset, y * CELL + inset, CELL - inset * 2, CELL - inset * 2);
}

function strokePath(ctx, path, amount, color) {
  if (amount <= 0 || path.length < 2) return;
  const pts = clipPolyline(path.map(center), amount);
  if (pts.length < 2) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  // 4px glow at 25%, then a solid 2px stroke in the algorithm color.
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 4;
  ctx.shadowColor = color;
  ctx.shadowBlur = 4;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function paint(canvas, id, m, now) {
  const ctx = canvas.getContext("2d");
  const color = COLOR[id];
  const view = m.view[id] || { visited: [], path: [], pathT: 0 };
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = INK.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = tint(color, 0.35);
  for (const cell of view.visited) fillCell(ctx, cell, tint(color, 0.35));
  for (let cell = 0; cell < m.walls.length; cell++) {
    if (!m.walls[cell]) continue;
    const until = m.flashes.get(cell);
    fillCell(ctx, cell, until && until > now ? INK.flash : INK.wall);
  }
  ctx.strokeStyle = INK.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= COLS; x++) {
    ctx.moveTo(x * CELL + 0.5, 0);
    ctx.lineTo(x * CELL + 0.5, ROWS * CELL);
  }
  for (let y = 0; y <= ROWS; y++) {
    ctx.moveTo(0, y * CELL + 0.5);
    ctx.lineTo(COLS * CELL, y * CELL + 0.5);
  }
  ctx.stroke();
  strokePath(ctx, view.path, view.pathT, color);
  fillCell(ctx, m.start, INK.start, 2);
  fillCell(ctx, m.goal, INK.goal, 2);
}

function toStat(id, result, heuristic, diagonal) {
  return {
    visited: result.visited.length,
    length: result.path.length ? result.cost : Infinity,
    ms: result.ms,
    optimal: isOptimal(id, heuristic, diagonal),
    found: result.path.length > 0,
  };
}

export default function App() {
  const model = useRef({
    walls: new Uint8Array(COLS * ROWS),
    start: 10 * COLS + 4,
    goal: 10 * COLS + 26,
    view: {},
    shown: ["astar"],
    dstarMode: false,
    drag: null,
    stroke: [],
    flashes: new Map(),
    planner: null,
    anim: null,
    raf: 0,
  });
  const canvases = useRef({});
  const binders = useRef({});
  const speedRef = useRef(1);
  const reduceRef = useRef(false);
  const statsRef = useRef(null);
  const drawRef = useRef(() => {});

  const [picked, setPicked] = useState(["astar"]);
  const [race, setRace] = useState(false);
  const [heuristic, setHeuristic] = useState("manhattan");
  const [diagonal, setDiagonal] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(null);

  const multi = race && !COMPACT;
  const shown = ALGOS.filter((a) => (multi ? picked.includes(a.id) : a.id === picked[0])).map((a) => a.id);
  const jpsOnly = shown.length === 1 && shown[0] === "jps";
  // JPS never moves diagonally; keep the toggle's saved value for when another algorithm is selected.
  const diagonalOn = diagonal && !jpsOnly;
  speedRef.current = speed;
  statsRef.current = stats;
  model.current.shown = shown;
  model.current.dstarMode = shown.length === 1 && shown[0] === "dstar_lite";

  function draw() {
    const m = model.current;
    const now = performance.now();
    for (const id of m.shown) {
      const canvas = canvases.current[id];
      if (canvas) paint(canvas, id, m, now);
    }
  }
  drawRef.current = draw;

  function stopLoop() {
    cancelAnimationFrame(model.current.raf);
    model.current.raf = 0;
  }

  // One frame pump for the visit/path animation and the 200ms wall flash.
  function step(now) {
    const m = model.current;
    let keep = false;
    const anim = m.anim;
    if (anim) {
      anim.acc += (now - anim.last) * speedRef.current;
      anim.last = now;
      let done = true;
      for (const run of anim.runs) {
        const n = run.visited.length;
        const shownN = Math.min(n, Math.floor(anim.acc / VISIT_MS));
        const visitDone = shownN >= n;
        let pathT = 0;
        if (!visitDone) done = false;
        else if (run.path.length < 2) pathT = 1;
        else {
          pathT = Math.min(1, (anim.acc - n * VISIT_MS) / PATH_MS);
          if (pathT < 1) done = false;
        }
        m.view[run.id] = { visited: run.visited.slice(0, shownN), path: run.path, pathT };
      }
      if (done) m.anim = null;
      else keep = true;
    }
    for (const [cell, until] of m.flashes) {
      if (until <= now) m.flashes.delete(cell);
      else keep = true;
    }
    return keep;
  }

  function kick() {
    const m = model.current;
    if (m.raf) return;
    m.raf = requestAnimationFrame(function frame(now) {
      m.raf = 0;
      const hadAnim = Boolean(model.current.anim);
      const keep = step(now);
      drawRef.current();
      if (hadAnim && !model.current.anim) setRunning(false);
      if (keep) kick();
      else setRunning(false);
    });
  }

  function wipeResult() {
    const m = model.current;
    stopLoop();
    m.anim = null;
    m.planner = null;
    m.view = {};
    statsRef.current = null;
    setStats(null);
    setRunning(false);
  }

  function clearPath() {
    model.current.flashes.clear();
    wipeResult();
    draw();
  }

  function beginAnimation(runs) {
    const m = model.current;
    stopLoop();
    if (reduceRef.current) {
      m.anim = null;
      m.view = {};
      for (const run of runs) m.view[run.id] = { visited: run.visited, path: run.path, pathT: 1 };
      setRunning(false);
      draw();
      return;
    }
    m.view = {};
    for (const run of runs) m.view[run.id] = { visited: [], path: run.path, pathT: 0 };
    const now = performance.now();
    m.anim = { acc: 0, last: now, runs };
    setRunning(true);
    draw();
    kick();
  }

  function replan(changed) {
    const m = model.current;
    const planner = m.planner;
    if (!planner || changed.length === 0) return;
    const t0 = performance.now();
    const result = planner.update(changed);
    result.ms = performance.now() - t0;
    result.cost = result.path.length ? pathCost(result.path, COLS) : Infinity;
    const row = toStat("dstar_lite", result, heuristic, diagonalOn);
    statsRef.current = { dstar_lite: row };
    setStats({ dstar_lite: row });
    beginAnimation([{ id: "dstar_lite", visited: result.visited, path: result.path }]);
  }

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reduceRef.current = mq.matches;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => {
      mq.removeEventListener("change", sync);
      cancelAnimationFrame(model.current.raf);
    };
  }, []);

  useLayoutEffect(() => {
    drawRef.current();
  }, [shown.join(",")]);

  function run() {
    const m = model.current;
    stopLoop();
    m.anim = null;
    m.planner = null;
    const grid = { walls: m.walls, cols: COLS, rows: ROWS };
    const opts = { heuristic, diagonal: diagonalOn };
    const runs = [];
    const next = {};
    for (const id of shown) {
      let result;
      if (id === "dstar_lite" && shown.length === 1) {
        // Keep the instance: later wall edits call planner.update, not a fresh search.
        const planner = new DStarLite(grid, m.start, m.goal, opts);
        m.planner = planner;
        const t0 = performance.now();
        result = planner.plan();
        result.ms = performance.now() - t0;
        result.cost = result.path.length ? pathCost(result.path, COLS) : Infinity;
      } else {
        result = findPath(id, grid, m.start, m.goal, opts);
      }
      runs.push({ id, visited: result.visited, path: result.path });
      next[id] = toStat(id, result, heuristic, diagonalOn);
    }
    statsRef.current = next;
    setStats(next);
    beginAnimation(runs);
  }

  function canvasRef(id) {
    if (!binders.current[id]) {
      binders.current[id] = (node) => {
        if (node) canvases.current[id] = node;
        else delete canvases.current[id];
      };
    }
    return binders.current[id];
  }

  function cellAt(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * COLS);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * ROWS);
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return -1;
    return y * COLS + x;
  }

  function paintCell(cell) {
    const m = model.current;
    if (cell < 0 || cell === m.start || cell === m.goal) return;
    const adding = m.drag === "draw";
    if (Boolean(m.walls[cell]) === adding) return;
    m.walls[cell] = adding ? 1 : 0;
    m.stroke.push(cell);
    if (adding && !reduceRef.current) m.flashes.set(cell, performance.now() + FLASH_MS);
    if (m.planner && m.dstarMode) {
      stopLoop();
      m.anim = null;
      m.view = {};
      setRunning(false);
    } else if (m.planner || m.anim || statsRef.current || Object.keys(m.view).length) {
      wipeResult();
    }
    draw();
    if (m.flashes.size) kick();
  }

  function onPointerDown(event) {
    const cell = cellAt(event);
    if (cell < 0) return;
    const m = model.current;
    // A synthetic pointer (and a pointer that was already released) has no
    // active id; capturing should never block the edit itself.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* keep drawing */
    }
    if (cell === m.start || cell === m.goal) {
      m.drag = cell === m.start ? "start" : "goal";
      m.stroke = [];
      if (m.anim || m.planner || statsRef.current) clearPath();
      return;
    }
    m.drag = m.walls[cell] ? "erase" : "draw";
    m.stroke = [];
    paintCell(cell);
  }

  function onPointerMove(event) {
    const m = model.current;
    if (!m.drag) return;
    const cell = cellAt(event);
    if (cell < 0) return;
    if (m.drag === "start" || m.drag === "goal") {
      const other = m.drag === "start" ? m.goal : m.start;
      if (cell !== other && !m.walls[cell]) m[m.drag] = cell;
      draw();
      return;
    }
    paintCell(cell);
  }

  function onPointerUp() {
    const m = model.current;
    const stroke = m.stroke;
    const drag = m.drag;
    m.drag = null;
    m.stroke = [];
    if ((drag === "draw" || drag === "erase") && stroke.length && m.planner && m.dstarMode) replan(stroke);
  }

  function maze() {
    const m = model.current;
    stopLoop();
    m.anim = null;
    m.planner = null;
    m.view = {};
    m.flashes.clear();
    m.walls = randomMaze(COLS, ROWS);
    m.start = COLS + 1;
    m.goal = (ROWS - 2) * COLS + (COLS - 2);
    statsRef.current = null;
    setStats(null);
    setRunning(false);
    draw();
  }

  function clearWalls() {
    const m = model.current;
    stopLoop();
    m.anim = null;
    m.planner = null;
    m.view = {};
    m.flashes.clear();
    m.walls.fill(0);
    statsRef.current = null;
    setStats(null);
    setRunning(false);
    draw();
  }

  function onPick(id) {
    if (!multi) {
      if (picked.length === 1 && picked[0] === id) return;
      setPicked([id]);
      clearPath();
      return;
    }
    if (picked.includes(id)) {
      if (picked.length <= 2) return;
      setPicked(picked.filter((x) => x !== id));
    } else if (picked.length >= 4) return;
    else setPicked([...picked, id]);
    clearPath();
  }

  function toggleRace() {
    if (COMPACT) return;
    if (!race) {
      if (picked.length < 2) {
        const extra = ALGOS.find((a) => !picked.includes(a.id));
        setPicked([...picked, extra.id]);
      } else if (picked.length > 4) setPicked(picked.slice(0, 4));
      setRace(true);
    } else {
      setPicked([picked[0] || "astar"]);
      setRace(false);
    }
    clearPath();
  }

  function chooseHeuristic(next) {
    if (next === heuristic) return;
    setHeuristic(next);
    clearPath();
  }

  function onSegmentKey(event, values, current, choose) {
    const i = values.indexOf(current);
    let next = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") next = values[(i + 1) % values.length];
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = values[(i - 1 + values.length) % values.length];
    if (next == null || next === current) return;
    event.preventDefault();
    choose(next);
    event.currentTarget.querySelector(`[data-value="${next}"]`)?.focus();
  }

  const fewest = multi && stats ? Math.min(...shown.map((id) => stats[id]?.visited ?? Infinity)) : Infinity;
  const rows = shown.map((id) => ({ id, ...(stats ? stats[id] : {}) }));
  const bestVisited = new Set();
  const bestLength = new Set();
  const bestTime = new Set();
  if (multi && stats) {
    const mark = (set, valueOf) => {
      let best = Infinity;
      const values = rows.map((row) => valueOf(row));
      for (const value of values) if (Number.isFinite(value) && value < best) best = value;
      if (!Number.isFinite(best)) return;
      rows.forEach((row, i) => {
        if (values[i] === best) set.add(row.id);
      });
    };
    mark(bestVisited, (row) => row.visited);
    mark(bestLength, (row) => (row.found ? Math.round(row.length * 100) / 100 : Infinity));
    mark(bestTime, (row) => Math.round(row.ms * 10) / 10);
  }

  const legendInk = {
    start: INK.start,
    goal: INK.goal,
    wall: INK.wall,
    visited: tint(COLOR[shown[0]], 0.35),
    path: COLOR[shown[0]],
  };

  return (
    <main>
      <div className="tabs" role={multi ? "group" : "tablist"} aria-label={t.algorithm}>
        {ALGOS.map((a) => {
          const on = shown.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              role={multi ? undefined : "tab"}
              aria-selected={multi ? undefined : on}
              aria-pressed={multi ? on : undefined}
              className={on ? "on" : undefined}
              title={t.titles[a.id]}
              style={{ "--swatch": a.color, "--ring": a.color, "--fill": tint(a.color, 0.12) }}
              onClick={() => onPick(a.id)}
            >
              <i />
              {t.algos[a.id]}
            </button>
          );
        })}
      </div>

      {!COMPACT && (
        <div className="row">
          <button type="button" aria-pressed={race} onClick={toggleRace}>
            {t.compare}
          </button>
          {multi && <span className="note inline">{t.compareHint}</span>}
        </div>
      )}

      <div className="row">
        <div
          className="seg"
          role="radiogroup"
          aria-label={t.heuristic}
          onKeyDown={(event) => onSegmentKey(event, HEURISTICS, heuristic, chooseHeuristic)}
        >
          {HEURISTICS.map((name) => (
            <button
              key={name}
              type="button"
              role="radio"
              data-value={name}
              aria-checked={heuristic === name}
              tabIndex={heuristic === name ? 0 : -1}
              className={heuristic === name ? "on" : undefined}
              onClick={() => chooseHeuristic(name)}
            >
              {t.heuristics[name]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={!jpsOnly && diagonal ? "choice on" : "choice"}
          aria-pressed={jpsOnly ? false : diagonal}
          disabled={jpsOnly}
          onClick={() => {
            setDiagonal((value) => !value);
            clearPath();
          }}
        >
          {t.diagonal}
        </button>
      </div>
      {jpsOnly && <p className="note">{t.jpsNote}</p>}

      <div className="row">
        <button type="button" className="go" onClick={run} disabled={running}>
          ▶ {t.run}
        </button>
        <button type="button" onClick={maze}>
          {t.maze}
        </button>
        <button type="button" onClick={clearWalls}>
          {t.clearWalls}
        </button>
        <button type="button" onClick={clearPath}>
          {t.clearPath}
        </button>
        <div
          className="seg"
          role="radiogroup"
          aria-label={t.speed}
          onKeyDown={(event) => onSegmentKey(event, SPEEDS, speed, setSpeed)}
        >
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              data-value={value}
              aria-checked={speed === value}
              tabIndex={speed === value ? 0 : -1}
              className={speed === value ? "on" : undefined}
              onClick={() => setSpeed(value)}
            >
              {value}×
            </button>
          ))}
        </div>
      </div>

      <div className={multi ? "panes race" : "panes"}>
        {shown.map((id) => (
          <figure key={id} className={multi && stats && stats[id] && stats[id].visited === fewest ? "win" : undefined}>
            {multi && (
              <figcaption>
                <i style={{ background: COLOR[id] }} />
                {t.algos[id]}
              </figcaption>
            )}
            <canvas
              ref={canvasRef(id)}
              className="grid"
              width={COLS * CELL + 1}
              height={ROWS * CELL + 1}
              aria-label={t.algos[id]}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            />
          </figure>
        ))}
      </div>

      <div className="legend">
        {Object.keys(t.legend).map((key) => (
          <span key={key}>
            <i style={{ background: legendInk[key] }} />
            {t.legend[key]}
          </span>
        ))}
      </div>

      <div className="scroll">
        <table>
          <thead>
            <tr>
              <th>{t.algorithm}</th>
              <th>{t.optimal}</th>
              <th>{t.visited}</th>
              <th title={t.lengthTitle}>{t.length}</th>
              <th>{t.time}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((id) => {
              const row = stats && stats[id];
              const optimal = isOptimal(id, heuristic, diagonalOn);
              return (
                <tr key={id}>
                  <td>
                    <i className="swatch" style={{ background: COLOR[id] }} />
                    {t.algos[id]}
                  </td>
                  <td className={optimal ? undefined : "muted"} title={optimal ? t.optimalYes : t.optimalNo}>
                    {optimal ? t.yes : t.no}
                  </td>
                  <td className={bestVisited.has(id) ? "best" : undefined}>{row ? row.visited : "–"}</td>
                  <td className={bestLength.has(id) ? "best" : undefined}>{row ? formatLength(row.length) : "–"}</td>
                  <td className={bestTime.has(id) ? "best" : undefined}>{row ? row.ms.toFixed(1) : "–"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {diagonalOn && heuristic === "manhattan" && <p className="note">{t.manhattanNote}</p>}
      <p id="hint" className="note">
        {t.hint}
      </p>
    </main>
  );
}
