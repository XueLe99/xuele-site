"use client";

import dynamic from "next/dynamic";

// Client-only chunks: GSAP and its plugins stay out of the first-load JS.
const HeadingMasks = dynamic(() => import("./HeadingMasks").then((m) => m.HeadingMasks), { ssr: false });
const Counters = dynamic(() => import("./Counters").then((m) => m.Counters), { ssr: false });
const MagneticButtons = dynamic(() => import("./MagneticButtons").then((m) => m.MagneticButtons), { ssr: false });
const CardTilt = dynamic(() => import("./CardTilt").then((m) => m.CardTilt), { ssr: false });
const CursorRing = dynamic(() => import("./CursorRing").then((m) => m.CursorRing), { ssr: false });
const LabFlip = dynamic(() => import("./LabFlip").then((m) => m.LabFlip), { ssr: false });
const RouteCurtain = dynamic(() => import("./RouteCurtain").then((m) => m.RouteCurtain), { ssr: false });

/**
 * Site-wide GSAP effects, mounted once in the locale layout so they survive
 * route changes. One line per effect: delete the line (and the file) to remove
 * it. Homepage-only effects are mounted in HomeMotion.tsx instead.
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
