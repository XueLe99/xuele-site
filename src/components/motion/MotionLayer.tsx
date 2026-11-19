"use client";

import { Counters } from "./Counters";
import { HeadingMasks } from "./HeadingMasks";

/**
 * Site-wide GSAP effects, mounted once in the locale layout so they survive
 * route changes. One line per effect: delete the line (and the file) to remove
 * it. Homepage-only effects are mounted in app/[locale]/page.tsx instead.
 */
export function MotionLayer() {
  return (
    <>
      <HeadingMasks />
      <Counters />
    </>
  );
}
