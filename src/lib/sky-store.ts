/**
 * Tiny shared store linking the scroll choreography (GSAP ScrollTrigger, see
 * components/home/HomeFx.tsx) to the WebGL starfield. Plain mutable object:
 * written by ScrollTrigger, read once per rendered frame — no React re-renders.
 */
export const sky = {
  /** Act 1 progress 0→1: camera z 0 → -40. */
  push: 0,
  /** Act 4: 1 while the lab preview is on screen (stars at 40%, nebula/meteors paused). */
  dim: 0,
  /** Act 5 progress 0→1: stars drift toward `[data-contact-target]`. */
  gather: 0,
  /**
   * 1 while the hero particle layer (Antigravity) is on screen: the near star
   * layer steps aside so the two layers do not compete. Owned by HeroFx.tsx.
   */
  hero: 0,
};

export function resetSky() {
  sky.push = 0;
  sky.dim = 0;
  sky.gather = 0;
}
