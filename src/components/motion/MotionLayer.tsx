"use client";

import { CardTilt } from "./CardTilt";
import { Counters } from "./Counters";
import { CursorRing } from "./CursorRing";
import { HeadingMasks } from "./HeadingMasks";
import { LabFlip } from "./LabFlip";
import { MagneticButtons } from "./MagneticButtons";
import { RouteCurtain } from "./RouteCurtain";

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
      <MagneticButtons />
      <CardTilt />
      <CursorRing />
      {/* LabFlip before RouteCurtain: the first to claim a link click wins. */}
      <LabFlip />
      <RouteCurtain />
    </>
  );
}
