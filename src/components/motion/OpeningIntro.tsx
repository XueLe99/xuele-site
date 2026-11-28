"use client";

import { useEffect } from "react";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import {
  releaseIntro,
  resetIntroGate,
  setIntroState,
} from "@/lib/opening-intro";
import { INTRO_SEEN_KEY } from "@/lib/opening-intro-script";
import { gsap, useGSAP } from "./gsap";
import { useMotion } from "./useMotion";

gsap.registerPlugin(DrawSVGPlugin);

/** The CSS fallback has been on screen this long: too late to start the show. */
const LATE_MS = 1500;
/** The name starts this long after the hero layers begin to settle. */
const NAME_AFTER_MS = 250;

/**
 * Effect 11 — opening intro (`[data-opening-intro]`, markup in
 * home/IntroOverlay.tsx), once per browser session.
 *
 * Desktop (~2.6s):
 *  1. #070A12 overlay; the `XL` monoline signature draws 0 → 100%
 *     (DrawSVG, 1px #6EE7F2, 1.0s power1.inOut, stroke by stroke).
 *  2. A #11151F panel rises over the whole screen: yPercent 100 → 0, 0.45s power3.out.
 *  3. "Build · Research · Discover" slides up to the centre of the panel:
 *     y 60 → 0, opacity 0 → 1, 0.6s expo.out.
 *  4. Hold 0.3s; panel + tagline leave upward (yPercent 0 → -100, 0.5s
 *     power4.inOut) and the overlay is gone.
 *  5. Hero layers (`[data-intro-layer]`) settle from scale 1.15 → 1, far → near,
 *     stagger 0.08, 1.2s expo.out; then the name intro (TitleIntro) plays.
 * Mobile (<768px, ~1.2s): no line drawing; panel, tagline, exit.
 *
 * Skip: the "Skip" button, a click/tap on the overlay, wheel, touch scroll,
 * scrolling or Escape jump straight to step 5. Reduced motion / effects off /
 * already seen: the inline gate script hides the overlay before first paint
 * and nothing here runs, so every layer stays at its final position.
 */
export function OpeningIntro() {
  const { enabled } = useMotion();

  // Route change: the next visit to the hero uses the normal intro clock.
  useEffect(() => () => resetIntroGate(), []);

  useGSAP(
    (_, contextSafe) => {
      const root = document.documentElement;
      const overlay = document.querySelector<HTMLElement>("[data-opening-intro]");
      if (!overlay || !contextSafe) return;
      const state = root.dataset.intro;
      if (state === "skip" || state === "reveal" || state === "done") return;

      let seen = false;
      try {
        seen = Boolean(sessionStorage.getItem(INTRO_SEEN_KEY));
      } catch {
        seen = true;
      }
      const fallback = overlay
        .getAnimations()
        .find((a) => a instanceof CSSAnimation && a.animationName === "intro-fallback");
      const late = Number(fallback?.currentTime ?? 0) > LATE_MS;

      if (!enabled || seen || late) {
        setIntroState("done");
        releaseIntro();
        return;
      }

      const mobile = window.matchMedia("(max-width: 767.98px)").matches;
      const q = gsap.utils.selector(overlay);
      const veil = q("[data-intro-veil]");
      const panel = q("[data-intro-panel]");
      const tagline = q("[data-intro-tagline]");
      const skip = q("[data-intro-skip]");
      const strokes = q<SVGPathElement>("[data-intro-mark] path");
      const layers = gsap.utils.toArray<HTMLElement>("[data-intro-layer]");

      setIntroState("play");
      // Waiting under the overlay, at the start of their settle.
      gsap.set(layers, { scale: 1.15 });

      let revealed = false;
      const reveal = contextSafe(() => {
        if (revealed) return;
        revealed = true;
        tl.kill();
        detach();
        try {
          sessionStorage.setItem(INTRO_SEEN_KEY, "1");
        } catch {
          // Storage disabled: the gate script already treats that as "seen".
        }
        const at = performance.now();
        setIntroState("reveal");
        releaseIntro(at + NAME_AFTER_MS);
        gsap.to(layers, {
          scale: 1,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.08,
          clearProps: "transform",
          onComplete: () => setIntroState("done"),
        });
      });

      const tl = gsap.timeline({ onComplete: reveal });

      if (!mobile && strokes.length) {
        // One stroke after the other, each for its share of the total length,
        // under a single power1.inOut over the whole signature.
        const lengths = strokes.map((path) => DrawSVGPlugin.getLength(path));
        const total = lengths.reduce((sum, n) => sum + n, 0) || 1;
        const draw = gsap.timeline({ paused: true });
        strokes.forEach((path, i) => {
          draw.fromTo(path, { drawSVG: "0%" }, { drawSVG: "100%", duration: lengths[i] / total, ease: "none" });
        });
        tl.to(draw, { progress: 1, duration: 1, ease: "power1.inOut" });
      }

      tl.fromTo(
        panel,
        { yPercent: 100, visibility: "visible" },
        { yPercent: 0, duration: mobile ? 0.3 : 0.45, ease: "power3.out" },
      )
        // The panel covers everything: drop the veil so the exit reveals the hero.
        .set(veil, { autoAlpha: 0 })
        .fromTo(
          tagline,
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: mobile ? 0.4 : 0.6, ease: "expo.out" },
          mobile ? "-=0.15" : "-=0.2",
        )
        .to(panel, { yPercent: -100, duration: mobile ? 0.4 : 0.5, ease: "power4.inOut" }, `+=${mobile ? 0.2 : 0.3}`)
        .to(skip, { autoAlpha: 0, duration: 0.2 }, "<");

      // Skip: button / click / tap, wheel, touch scroll, scroll, Escape.
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") reveal();
      };
      const opts = { passive: true } as const;
      overlay.addEventListener("click", reveal);
      window.addEventListener("wheel", reveal, opts);
      window.addEventListener("touchmove", reveal, opts);
      window.addEventListener("scroll", reveal, opts);
      window.addEventListener("keydown", onKey);
      function detach() {
        overlay?.removeEventListener("click", reveal);
        window.removeEventListener("wheel", reveal);
        window.removeEventListener("touchmove", reveal);
        window.removeEventListener("scroll", reveal);
        window.removeEventListener("keydown", onKey);
      }

      return () => {
        detach();
        // Reverted before the overlay left (effects turned off, StrictMode
        // remount): back to undecided, the next run decides again. After it
        // left, the layer settle is reverted to its end state: done.
        if (!revealed) setIntroState(null);
        else if (root.dataset.intro !== "done") setIntroState("done");
      };
    },
    { dependencies: [enabled], revertOnUpdate: true },
  );

  return null;
}
