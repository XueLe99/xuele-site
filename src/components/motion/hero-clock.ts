/**
 * Shared clock for the hero intro (TitleIntro, RoleDecode).
 *
 * Elements marked `data-intro-hold` are kept invisible by a time-limited CSS
 * animation (`intro-hold`, see motion.css) that starts with first paint. Its
 * currentTime is therefore "time since first paint" — on a hard load and after
 * a client-side navigation alike — without any coupling between the effects.
 */
import { introGate, introReleasedAt } from "@/lib/opening-intro";

const HOLD = "intro-hold";

/** Delay between first paint and the first character of the name. */
const NAME_DELAY_MS = 600;

/**
 * performance.now() timestamp at which the name intro starts, or null when the
 * hold is already over (the text is visible; do not animate it away again).
 * "wait" while the opening intro overlay is still pending (lib/opening-intro):
 * the name must not play hidden under it. Once released, its timestamp wins.
 */
export function introStart(el: Element): number | null | "wait" {
  const gate = introGate();
  if (gate === "pending") return "wait";
  if (gate === "open") return introReleasedAt();
  const hold = el
    .getAnimations()
    .find((a) => a instanceof CSSAnimation && a.animationName === HOLD);
  if (!hold) return null;
  return performance.now() - (Number(hold.currentTime) || 0) + NAME_DELAY_MS;
}

/** JS has taken over: end the CSS hold for good (it must never restart). */
export function releaseHold(...els: (Element | null | undefined)[]) {
  els.forEach((el) => el?.setAttribute("data-intro-live", ""));
}

/** Length of the name intro in seconds: 0.9s per character plus the stagger. */
export function nameIntroDuration(chars: number, desktop: boolean): number {
  return 0.9 + Math.max(0, chars - 1) * (desktop ? 0.04 : 0.03);
}

/** Characters SplitText animates: everything except whitespace. */
export function countChars(el: Element | null): number {
  return Array.from(el?.textContent ?? "").filter((c) => c.trim()).length;
}
