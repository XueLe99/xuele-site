"use client";

import { useFx } from "@/components/fx/FxProvider";
import { useDesktopPointer, useReducedMotion } from "@/lib/capability";

/**
 * Shared gate for the GSAP motion layer (src/components/motion).
 *
 * `enabled` is false on the server, with prefers-reduced-motion and with the
 * site's "Effects off" toggle. Every effect then leaves the page alone: the
 * server-rendered markup + CSS is already the final state, so "set the final
 * state, no animation" means reverting the GSAP context and doing nothing.
 *
 * `desktop` is ≥768px with a fine pointer; everything else gets the "mobile"
 * variant of an effect.
 */
export function useMotion(): { enabled: boolean; desktop: boolean } {
  const { fxOff } = useFx();
  const reduced = useReducedMotion();
  const desktop = useDesktopPointer();
  return { enabled: !fxOff && !reduced, desktop };
}
