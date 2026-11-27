"use client";

import { useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, useGSAP } from "./gsap";
import { introStart, nameIntroDuration, releaseHold } from "./hero-clock";
import { SPLIT_CLASSES, charLefts } from "./split";
import { useMotion } from "./useMotion";

gsap.registerPlugin(SplitText);

/**
 * Effect 1 — hero title.
 *
 * - `[data-title-name]`: by character, y 40 → 0, opacity 0 → 1, blur 8 → 0,
 *   0.9s expo.out, stagger 0.04, starting 0.6s after first paint.
 *   Mobile: no blur, stagger 0.03.
 * - `[data-title-tagline]`: by line, 0.7s power3.out, stagger 0.12, starting
 *   0.2s after the name ends.
 * - Sweep: a #6EE7F2 band (30% wide, opacity 0.6) crosses the name once,
 *   background-position -100% → 200%, 1.2s power2.inOut.
 *
 * Renders nothing. Both splits are reverted when their animation ends, so the
 * resting DOM is the server-rendered markup again.
 */
export function TitleIntro() {
  const { enabled, desktop } = useMotion();
  const startAt = useRef<number | null | undefined>(undefined);
  const played = useRef(false);

  useGSAP(
    (_, contextSafe) => {
      const name = document.querySelector<HTMLElement>("[data-title-name]");
      const tagline = document.querySelector<HTMLElement>("[data-title-tagline]");
      if (!enabled || !name || !contextSafe) return;

      if (startAt.current === undefined) startAt.current = introStart(name);
      const start = startAt.current;
      releaseHold(name, tagline);
      if (start === null || played.current) return;

      const fromNow = (at: number) => Math.max(0, (at - performance.now()) / 1000);
      let band: HTMLElement | undefined;

      const sweep = contextSafe(() => {
        band = document.createElement("span");
        band.className = "title-sweep";
        band.setAttribute("aria-hidden", "true");
        // Same structure as the name (it may hold several lines / spans).
        band.append(...Array.from(name.childNodes, (n) => n.cloneNode(true)));
        name.append(band);
        gsap.fromTo(
          band,
          { backgroundPosition: "-100% 0" },
          {
            backgroundPosition: "200% 0",
            duration: 1.2,
            ease: "power2.inOut",
            onComplete: () => band?.remove(),
          },
        );
      });

      // Measure, split, measure again: `x` puts every glyph back where the
      // kerned, unsplit text had it (reads before writes).
      const kerned = charLefts(name);
      const split = SplitText.create(name, { type: "words,chars", ...SPLIT_CLASSES });
      const shift = split.chars.map(
        (el, i) => (kerned[i] ?? 0) - el.getBoundingClientRect().left,
      );
      const exact = kerned.length === split.chars.length;
      const blur = desktop;
      gsap.fromTo(
        split.chars,
        { y: 40, opacity: 0, ...(blur && { filter: "blur(8px)" }) },
        {
          x: (i) => (exact ? shift[i] : 0),
          y: 0,
          opacity: 1,
          ...(blur && { filter: "blur(0px)" }),
          duration: 0.9,
          ease: "expo.out",
          stagger: desktop ? 0.04 : 0.03,
          delay: fromNow(start),
          onComplete: () => {
            played.current = true;
            split.revert();
            sweep();
          },
        },
      );

      if (tagline) {
        const taglineAt =
          start + (nameIntroDuration(split.chars.length, desktop) + 0.2) * 1000;
        // autoSplit: lines are re-measured when the web fonts arrive.
        SplitText.create(tagline, {
          type: "lines",
          ...SPLIT_CLASSES,
          autoSplit: true,
          onSplit(self) {
            return gsap.from(self.lines, {
              y: 20,
              opacity: 0,
              duration: 0.7,
              ease: "power3.out",
              stagger: 0.12,
              delay: fromNow(taglineAt),
              onComplete: () => self.revert(),
            });
          },
        });
      }

      return () => band?.remove();
    },
    { dependencies: [enabled, desktop], revertOnUpdate: true },
  );

  return null;
}
