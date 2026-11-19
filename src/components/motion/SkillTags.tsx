"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap, useGSAP } from "./gsap";
import { useMotion } from "./useMotion";

gsap.registerPlugin(ScrollTrigger);

/**
 * Effect 3b — skill tags (`[data-star-chip]` inside each `[data-skill-card]`).
 *
 * scale 0.8 → 1, opacity 0 → 1, 0.5s back.out(1.7), stagger 0.03 from the
 * centre, once per card when it reaches "top 80%". Mobile: half the duration.
 *
 * If something else is still fading the card in (the pinned scroll story), the
 * tags wait until the card is actually visible, so the pop is never spent on
 * an invisible card. Homepage only.
 */
export function SkillTags() {
  const { enabled, desktop } = useMotion();

  useGSAP(
    () => {
      if (!enabled) return;
      const waiting = new Set<() => void>();

      gsap.utils.toArray<HTMLElement>("[data-skill-card]").forEach((card) => {
        const chips = card.querySelectorAll("[data-star-chip]");
        if (!chips.length) return;
        // Cards already on screen keep their tags: no flash on load.
        if (card.getBoundingClientRect().top < window.innerHeight * 0.8) return;

        const pop = gsap.from(chips, {
          scale: 0.8,
          opacity: 0,
          duration: desktop ? 0.5 : 0.25,
          ease: "back.out(1.7)",
          stagger: { each: 0.03, from: "center" },
          paused: true,
        });
        const whenVisible = () => {
          if (Number(getComputedStyle(card).opacity) < 0.4) return;
          gsap.ticker.remove(whenVisible);
          waiting.delete(whenVisible);
          pop.play();
        };
        ScrollTrigger.create({
          trigger: card,
          start: "top 80%",
          once: true,
          onEnter: () => {
            waiting.add(whenVisible);
            gsap.ticker.add(whenVisible);
          },
        });
      });

      return () => waiting.forEach((fn) => gsap.ticker.remove(fn));
    },
    { dependencies: [enabled, desktop], revertOnUpdate: true },
  );

  return null;
}
