"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useWebglFx } from "@/components/fx/useWebglFx";
import { setHeroIntro } from "@/lib/hero-intro";
import { sky } from "@/lib/sky-store";

// React Bits Antigravity (src/components/Antigravity.tsx): its own chunk,
// client-only, requested after window load + idle and only while the hero is
// on screen.
const Antigravity = dynamic(() => import("@/components/Antigravity"), { ssr: false });

const COLORS = ["#6EE7F2", "#E8C56B", "#CFE8FF"];

/**
 * Hero-only particle layer, stacked above the starfield (never replacing it).
 *
 * - Unmounted (WebGL context released) as soon as the hero scrolls out of view.
 * - While it is up the starfield drops its near layer (`sky.hero`), so at most
 *   two full-screen WebGL canvases run: mid/far stars + these particles.
 * - Not rendered at all when useWebglFx() says no; the starfield / poster stays.
 * - Listens on `window`, so the layer itself stays `pointer-events: none`.
 */
export function HeroFx() {
  const { enabled, desktop } = useWebglFx();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  // The intro plays on the first mount only, not every time the hero returns.
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting);
      setInView(visible);
      if (visible) return;
      setSeen((prev) => prev || el.childElementCount > 0);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      setInView(false);
    };
  }, [enabled]);

  const active = enabled && inView;

  useEffect(() => {
    if (!active) return;
    sky.hero = 1;
    return () => {
      sky.hero = 0;
    };
  }, [active]);

  // Pointer effects (motion/usePointerFx) stay detached while the intro plays.
  // The timeout covers a canvas that never starts (chunk error, lost context).
  const introPlaying = active && !seen;
  useEffect(() => {
    if (!introPlaying) return;
    setHeroIntro(true);
    const timer = window.setTimeout(() => setHeroIntro(false), 8000);
    return () => {
      window.clearTimeout(timer);
      setHeroIntro(false);
    };
  }, [introPlaying]);

  if (!enabled) return null;

  return (
    <div ref={ref} className="hero-fx" aria-hidden="true" data-hero-fx>
      {active && (
        <>
          <div className="hero-fx-canvas">
            <Antigravity
              colors={COLORS}
              count={desktop ? 900 : 300}
              particleSize={0.7}
              ringRadius={6}
              magnetRadius={8}
              opacity={0.7}
              maxDevicePixelRatio={1.5}
              clickBurst
              intro={!seen}
              onIntroEnd={() => setHeroIntro(false)}
              interactive={desktop}
            />
          </div>
          <div className="hero-fx-vignette" />
        </>
      )}
    </div>
  );
}
