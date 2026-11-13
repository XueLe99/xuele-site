import { useEffect, useRef, useState } from "react";
import { LOCALE } from "./locale.js";
import { findPath, randomMaze } from "./search.js";

const TEXT = {
  en: {
    astar: "A*",
    dijkstra: "Dijkstra",
    run: "Run",
    maze: "Random maze",
    clearWalls: "Clear walls",
    clearPath: "Clear path",
    algorithm: "Algorithm",
    visited: "Cells visited",
    length: "Path length",
    none: "no path",
    hint: "Drag on the grid to draw or erase walls. Drag the start (cyan) or goal (gold) to move it.",
    legend: { start: "Start", goal: "Goal", wall: "Wall", visited: "Visited", path: "Path" },
  },
  zh: {
    astar: "A*",
    dijkstra: "Dijkstra",
    run: "运行",
    maze: "随机迷宫",
    clearWalls: "清除墙体",
    clearPath: "清除路径",
    algorithm: "算法",
    visited: "访问格数",
    length: "路径长度",
    none: "无路径",
    hint: "在网格上拖动可以画墙或擦除墙体；拖动起点（青色）或终点（金色）可以移动它们。",
    legend: { start: "起点", goal: "终点", wall: "墙", visited: "已访问", path: "路径" },
  },
};
const t = TEXT[LOCALE] || TEXT.en;

const COLS = 31;
const ROWS = 21;
const CELL = 16;
const COLORS = { bg: "#0b0f19", line: "#1e2433", wall: "#59617a", visited: "#1d5a66", path: "#f3f3f6", start: "#6ee7f2", goal: "#e8c56b" };

export default function App() {
  const canvasRef = useRef(null);
  // The grid lives in a ref: it changes on every pointer move and is drawn
  // straight to the canvas, so it does not need to go through React state.
  const model = useRef({
    walls: new Uint8Array(COLS * ROWS),
    start: 10 * COLS + 4,
    goal: 10 * COLS + 26,
    visited: [], // cells revealed so far
    path: [],
    drag: null, // "start" | "goal" | "draw" | "erase"
    frame: 0,
  });
  const [algorithm, setAlgorithm] = useState("astar");
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState(null);

  function draw() {
    const m = model.current;
    const ctx = canvasRef.current.getContext("2d");
    const fill = (cell, color, inset = 0) => {
      ctx.fillStyle = color;
      ctx.fillRect((cell % COLS) * CELL + inset, Math.floor(cell / COLS) * CELL + inset, CELL - inset * 2, CELL - inset * 2);
    };
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
    for (const cell of m.visited) fill(cell, COLORS.visited);
    for (let cell = 0; cell < m.walls.length; cell++) if (m.walls[cell]) fill(cell, COLORS.wall);
    for (const cell of m.path) fill(cell, COLORS.path, 4);
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= COLS; x++) { ctx.moveTo(x * CELL + 0.5, 0); ctx.lineTo(x * CELL + 0.5, ROWS * CELL); }
    for (let y = 0; y <= ROWS; y++) { ctx.moveTo(0, y * CELL + 0.5); ctx.lineTo(COLS * CELL, y * CELL + 0.5); }
    ctx.stroke();
    fill(m.start, COLORS.start, 2);
    fill(m.goal, COLORS.goal, 2);
  }

  function stop() {
    cancelAnimationFrame(model.current.frame);
    setRunning(false);
  }

  function clearPath() {
    stop();
    model.current.visited = [];
    model.current.path = [];
    setStats(null);
    draw();
  }

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(model.current.frame);
  }, []);

  function run() {
    clearPath();
    const m = model.current;
    const results = {
      astar: findPath(m.walls, COLS, ROWS, m.start, m.goal, "astar"),
      dijkstra: findPath(m.walls, COLS, ROWS, m.start, m.goal, "dijkstra"),
    };
    setStats({
      astar: { visited: results.astar.visited.length, length: results.astar.path.length - 1 },
      dijkstra: { visited: results.dijkstra.visited.length, length: results.dijkstra.path.length - 1 },
    });

    // Animate the selected algorithm: reveal visited cells, then the path.
    const { visited, path } = results[algorithm];
    let shown = 0;
    let pathShown = 0;
    setRunning(true);
    const step = () => {
      if (shown < visited.length) {
        shown = Math.min(visited.length, shown + 4);
        m.visited = visited.slice(0, shown);
      } else if (pathShown < path.length) {
        pathShown = Math.min(path.length, pathShown + 1);
        m.path = path.slice(0, pathShown);
      } else {
        setRunning(false);
        return;
      }
      draw();
      m.frame = requestAnimationFrame(step);
    };
    m.frame = requestAnimationFrame(step);
  }

  function cellAt(event) {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * COLS);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * ROWS);
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return -1;
    return y * COLS + x;
  }

  function onPointerDown(event) {
    const cell = cellAt(event);
    if (cell < 0) return;
    const m = model.current;
    if (m.visited.length || m.path.length) clearPath();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (cell === m.start) m.drag = "start";
    else if (cell === m.goal) m.drag = "goal";
    else {
      m.drag = m.walls[cell] ? "erase" : "draw";
      m.walls[cell] = m.drag === "draw" ? 1 : 0;
    }
    draw();
  }

  function onPointerMove(event) {
    const m = model.current;
    const cell = cellAt(event);
    if (!m.drag || cell < 0) return;
    if (m.drag === "start" || m.drag === "goal") {
      const other = m.drag === "start" ? m.goal : m.start;
      if (cell !== other && !m.walls[cell]) m[m.drag] = cell;
    } else if (cell !== m.start && cell !== m.goal) {
      m.walls[cell] = m.drag === "draw" ? 1 : 0;
    }
    draw();
  }

  function onPointerUp() {
    model.current.drag = null;
  }

  function maze() {
    clearPath();
    const m = model.current;
    m.walls = randomMaze(COLS, ROWS);
    m.start = 1 * COLS + 1;
    m.goal = (ROWS - 2) * COLS + (COLS - 2);
    draw();
  }

  function clearWalls() {
    clearPath();
    model.current.walls.fill(0);
    draw();
  }

  const fewest = stats ? Math.min(stats.astar.visited, stats.dijkstra.visited) : -1;

  return (
    <main>
      <div className="row">
        {["astar", "dijkstra"].map((name) => (
          <button key={name} aria-pressed={algorithm === name} onClick={() => { setAlgorithm(name); clearPath(); }}>
            {t[name]}
          </button>
        ))}
        <button className="go" onClick={run} disabled={running}>▶ {t.run}</button>
        <button onClick={maze}>{t.maze}</button>
        <button onClick={clearWalls}>{t.clearWalls}</button>
        <button onClick={clearPath}>{t.clearPath}</button>
      </div>

      <canvas ref={canvasRef} className="grid" width={COLS * CELL + 1} height={ROWS * CELL + 1}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp} />

      <div className="legend">
        {Object.keys(t.legend).map((key) => (
          <span key={key}><i style={{ background: COLORS[key] }} />{t.legend[key]}</span>
        ))}
      </div>

      <table>
        <thead>
          <tr><th>{t.algorithm}</th><th>{t.visited}</th><th>{t.length}</th></tr>
        </thead>
        <tbody>
          {["astar", "dijkstra"].map((name) => (
            <tr key={name}>
              <td>{t[name]}</td>
              <td className={stats && stats[name].visited === fewest ? "best" : ""}>{stats ? stats[name].visited : "–"}</td>
              <td>{stats ? (stats[name].length >= 0 ? stats[name].length : t.none) : "–"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">{t.hint}</p>
    </main>
  );
}
