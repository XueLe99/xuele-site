"use client";

import { useSyncExternalStore } from "react";

/**
 * Coordination between the opening intro (motion/OpeningIntro.tsx) and the
 * hero name / role line intros (TitleIntro, RoleDecode via hero-clock.ts).
 *
 * `<html data-intro>` is the source of truth for the overlay:
 *   (absent)  SSR state: the overlay shows; a CSS fallback hides it after 3s
 *   "skip"    set pre-paint by the inline gate script (seen / fx off / reduced)
 *   "play"    OpeningIntro is running
 *   "reveal"  overlay gone, hero layers settling, name intro starting
 *   "done"    finished
 *
 * The gate: while an overlay is pending the name intro waits; OpeningIntro
 * releases it with the timestamp the name should start at.
 */
export type IntroState = "play" | "reveal" | "done";
export type IntroGate = "none" | "pending" | "open";

let releasedAt: number | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function introGate(): IntroGate {
  if (releasedAt !== null) return "open";
  const state = document.documentElement.dataset.intro;
  const pending =
    (state === undefined || state === "play") &&
    document.querySelector("[data-opening-intro]") !== null;
  return pending ? "pending" : "none";
}

/** performance.now() at which the name intro starts, once released. */
export function introReleasedAt(): number | null {
  return releasedAt;
}

export function releaseIntro(at: number = performance.now()) {
  releasedAt = at;
  emit();
}

/** OpeningIntro unmounted (route change): later visits use the normal clock. */
export function resetIntroGate() {
  if (releasedAt === null) return;
  releasedAt = null;
  emit();
}

/** null: back to the undecided SSR state (an intro interrupted before it ended). */
export function setIntroState(state: IntroState | null) {
  const root = document.documentElement;
  if (state) root.dataset.intro = state;
  else delete root.dataset.intro;
  emit();
}

export function useIntroGate(): IntroGate {
  return useSyncExternalStore(subscribe, introGate, () => "none");
}
