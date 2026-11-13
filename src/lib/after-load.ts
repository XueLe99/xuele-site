/**
 * Runs `cb` once the window has loaded and the browser is idle, so optional
 * code (three, gsap, lenis, motion) never competes with first paint / LCP.
 * Returns a cancel function.
 */
export function afterLoadIdle(cb: () => void): () => void {
  let idle = 0;
  let timer = 0;
  const hasIdle = typeof window.requestIdleCallback === "function";

  const schedule = () => {
    if (hasIdle) idle = window.requestIdleCallback(cb, { timeout: 2000 });
    else timer = window.setTimeout(cb, 200);
  };

  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });

  return () => {
    window.removeEventListener("load", schedule);
    if (idle) window.cancelIdleCallback(idle);
    if (timer) window.clearTimeout(timer);
  };
}
