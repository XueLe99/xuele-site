"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { sky } from "@/lib/sky-store";
import { gsap, useGSAP } from "./gsap";
import { useMotion } from "./useMotion";

gsap.registerPlugin(ScrollTrigger);

const WIDE = "(min-width: 768px)";
const NARROW = "(max-width: 767.98px)";

/**
 * Effect 10 — Firewatch-style parallax hero (`[data-hero-scene]`).
 *
 * Natural scroll, no pin. Every `[data-parallax]` layer of the scene has a
 * speed s = on-screen movement ÷ scroll distance; the scene itself scrolls at
 * 1, so a layer counter-translates by y = scroll × (1 − s), scrubbed from
 * "top top" to "bottom top". The foreground (s = 1) climbs over the slower
 * name and the scene sinks into the page.
 *
 *   ≥768px   particles 0.2, skyline 0.25, hills 0.45, name 0.6, foreground 1;
 *            mid star layer 0.1 (WebGL sky via `sky.heroScroll`), far stars 0
 *   <768px   `data-parallax-mobile`: skyline 0.125, name 0.3, foreground 1
 *
 * Transforms only (`y`). Reduced motion / effects off: nothing runs and every
 * layer stays at its resting position.
 */
export function ParallaxHero() {
  const { enabled } = useMotion();

  useGSAP(
    () => {
      const scene = document.querySelector<HTMLElement>("[data-hero-scene]");
      if (!enabled || !scene) return;
      const layers = gsap.utils.toArray<HTMLElement>("[data-parallax]", scene);
      const mm = gsap.matchMedia();

      mm.add({ wide: WIDE, narrow: NARROW }, (context) => {
        const wide = Boolean(context.conditions?.wide);
        const tl = gsap.timeline({
          defaults: { ease: "none", duration: 1 },
          scrollTrigger: {
            trigger: scene,
            start: "top top",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: wide
              ? (self) => {
                  sky.heroScroll = self.progress * scene.offsetHeight;
                }
              : undefined,
          },
        });

        layers.forEach((layer) => {
          const speed = Number(wide ? layer.dataset.parallax : layer.dataset.parallaxMobile);
          if (!Number.isFinite(speed) || speed >= 1) return;
          layer.style.willChange = "transform";
          tl.to(layer, { y: () => scene.offsetHeight * (1 - speed) }, 0);
        });

        return () => {
          sky.heroScroll = 0;
          layers.forEach((layer) => layer.style.removeProperty("will-change"));
        };
      });

      return () => mm.revert();
    },
    { dependencies: [enabled], revertOnUpdate: true },
  );

  return null;
}
