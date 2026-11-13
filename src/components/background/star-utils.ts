/** Shared by the WebGL and Canvas-2D starfields. */

/** 70% white, 20% cool, 10% warm. */
export const STAR_COLORS = ["#FFFFFF", "#CFE8FF", "#FFE9C4"] as const;

export function pickColorIndex(r: number): 0 | 1 | 2 {
  return r < 0.7 ? 0 : r < 0.9 ? 1 : 2;
}

/** Small seeded PRNG so the sky looks the same on every visit. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const FRAME_MS = 1000 / 30;

/**
 * requestAnimationFrame loop capped at ~30fps that stops while the tab is
 * hidden. `frame` receives the time since the previous frame in seconds.
 */
export function startThrottledLoop(frame: (dt: number) => void): () => void {
  let raf = 0;
  let last = 0;

  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    const elapsed = now - last;
    // 2ms tolerance so a 60Hz display lands on every second frame.
    if (elapsed < FRAME_MS - 2) return;
    last = now;
    frame(Math.min(elapsed, 100) / 1000);
  };
  const start = () => {
    if (!raf && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onVisibility = () => (document.hidden ? stop() : start());

  document.addEventListener("visibilitychange", onVisibility);
  start();
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    stop();
  };
}
