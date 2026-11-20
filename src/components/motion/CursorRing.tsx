"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";
import { usePointerFx } from "./usePointerFx";

const CLICKABLE = "a[href], button, summary, label, select, [role='button']";

/**
 * Effect 4c — cursor ring.
 *
 * Desktop only. A 24px ring (1px #6EE7F2, opacity 0.25) follows the pointer
 * and grows to 48px over clickable elements in 0.3s. The ring is an SVG circle
 * with a non-scaling stroke, so growing is a pure transform and the border
 * stays 1px. Rendered only while the effect is active.
 */
export function CursorRing() {
  const ready = usePointerFx();
  const ring = useRef<HTMLDivElement>(null);
  const circle = useRef<SVGCircleElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const el = ring.current;
      const dot = circle.current;
      if (!ready || !el || !dot || !contextSafe) return;

      const xTo = gsap.quickTo(el, "x", { duration: 0.2, ease: "power3.out" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.2, ease: "power3.out" });
      let shown = false;
      let over: Element | null = null;

      const show = (visible: boolean) => {
        shown = visible;
        gsap.to(el, { opacity: visible ? 0.25 : 0, duration: 0.2, overwrite: "auto" });
      };
      const onMove = contextSafe((e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        if (!shown) {
          // First sighting: jump there instead of flying in from the corner.
          gsap.set(el, { x: e.clientX, y: e.clientY });
          show(true);
        }
        xTo(e.clientX);
        yTo(e.clientY);
      });
      const onOver = contextSafe((e: PointerEvent) => {
        const hit = (e.target as Element | null)?.closest?.(CLICKABLE) ?? null;
        if (hit === over) return;
        over = hit;
        gsap.to(dot, {
          scale: hit ? 2 : 1,
          svgOrigin: "0 0",
          duration: 0.3,
          ease: "power2.out",
          overwrite: "auto",
        });
      });
      const onLeave = contextSafe(() => show(false));

      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerover", onOver, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      return () => {
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerover", onOver);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      };
    },
    { dependencies: [ready], revertOnUpdate: true },
  );

  if (!ready) return null;

  return (
    <div ref={ring} className="cursor-ring" aria-hidden="true">
      <svg viewBox="-24 -24 48 48" width="48" height="48">
        <circle ref={circle} r="11.5" />
      </svg>
    </div>
  );
}
