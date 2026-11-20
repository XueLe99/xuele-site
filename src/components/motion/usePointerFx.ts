"use client";

import { useEffect, useState } from "react";
import { afterLoadIdle } from "@/lib/after-load";
import { useHeroIntroRunning } from "@/lib/hero-intro";
import { useMotion } from "./useMotion";

/**
 * Gate for the pointer effects (effect 4: magnetic buttons, card tilt, cursor
 * ring). True only on desktop (≥768px, pointer: fine) with motion enabled,
 * after window load + idle, and never while the hero particle intro is
 * playing — no pointer listener is attached before that.
 */
export function usePointerFx(): boolean {
  const { enabled, desktop } = useMotion();
  const introRunning = useHeroIntroRunning();
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    let timer = 0;
    // The short pause lets HeroFx (which waits for the same idle slot) report
    // its intro first, whatever order the two callbacks run in.
    const cancel = afterLoadIdle(() => {
      timer = window.setTimeout(() => setIdle(true), 300);
    });
    return () => {
      cancel();
      window.clearTimeout(timer);
    };
  }, []);

  return enabled && desktop && idle && !introRunning;
}
