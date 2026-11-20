"use client";

import { useSyncExternalStore } from "react";

/**
 * True while the hero particle intro (Antigravity, first 3s) is playing.
 * Written by HeroFx.tsx, read by the pointer effects (motion/usePointerFx.ts),
 * which do not attach their listeners until it is over.
 */
let running = false;
const listeners = new Set<() => void>();

export function setHeroIntro(next: boolean) {
  if (running === next) return;
  running = next;
  listeners.forEach((fn) => fn());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function useHeroIntroRunning(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => running,
    () => false,
  );
}
