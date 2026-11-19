"use client";

import { usePathname } from "next/navigation";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { gsap, useGSAP } from "./gsap";
import { SPLIT_CLASSES } from "./split";
import { useMotion } from "./useMotion";

gsap.registerPlugin(ScrollTrigger, SplitText);

/**
 * Effect 7 — section heading masks (`[data-heading-mask]`).
 *
 * Each line is wrapped in an overflow-clipping mask and rises into it:
 * yPercent 110 → 0, 0.8s power4.out, line stagger 0.1, trigger "top 85%", once.
 *
 * Site-wide (re-run per route). autoSplit re-measures the lines when fonts
 * load or the width changes; a heading that has already been revealed is then
 * left in place instead of being animated again.
 */
export function HeadingMasks() {
  const { enabled } = useMotion();
  const pathname = usePathname();

  useGSAP(
    () => {
      if (!enabled) return;

      gsap.utils.toArray<HTMLElement>("[data-heading-mask]").forEach((heading) => {
        let revealed = false;
        SplitText.create(heading, {
          type: "lines",
          mask: "lines",
          ...SPLIT_CLASSES,
          autoSplit: true,
          onSplit(self) {
            if (revealed) return;
            return gsap.from(self.lines, {
              yPercent: 110,
              duration: 0.8,
              ease: "power4.out",
              stagger: 0.1,
              scrollTrigger: { trigger: heading, start: "top 85%", once: true },
              onComplete: () => {
                revealed = true;
              },
            });
          },
        });
      });
    },
    { dependencies: [enabled, pathname], revertOnUpdate: true },
  );

  return null;
}
