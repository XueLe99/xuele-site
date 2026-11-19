"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap, useGSAP } from "./gsap";
import { useMotion } from "./useMotion";

gsap.registerPlugin(ScrollTrigger);

/**
 * Effect 8 — projects horizontal gallery (`[data-projects-gallery]`).
 *
 * Desktop: the section's column is pinned and the card track
 * (`[data-gallery-track]`) moves sideways with the scroll, scrub 1. Cards are
 * 420px wide with a 32px gap (`.is-gallery` in motion.css); the card the scroll
 * has reached is active — scale 1.04 and a #6EE7F2 border — the others sit at
 * opacity 0.5.
 *
 * Mobile, reduced motion, effects off, or no JS: the plain list from the
 * server markup. The section only exists when SHOW_PROJECTS is on and at
 * least one project is published. Homepage only.
 */
export function ProjectsGallery() {
  const { enabled, desktop } = useMotion();

  useGSAP(
    () => {
      const section = document.querySelector<HTMLElement>("[data-projects-gallery]");
      const track = section?.querySelector<HTMLElement>("[data-gallery-track]");
      const pinned = section?.querySelector<HTMLElement>(":scope > .container-site");
      if (!enabled || !desktop || !section || !track || !pinned) return;

      const cards = gsap.utils.toArray<HTMLElement>(":scope > li", track);
      if (!cards.length) return;

      section.classList.add("is-gallery");
      const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
      const header = () =>
        document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;

      let active = -1;
      const focus = () => {
        // The track's own (scrubbed) progress picks the card: first card at
        // the start, last card at the end, evenly in between.
        const travelled = -Number(gsap.getProperty(track, "x")) / (distance() || 1);
        const nearest = Math.round(
          gsap.utils.clamp(0, 1, travelled) * (cards.length - 1),
        );
        if (nearest === active) return;
        active = nearest;
        cards.forEach((card, i) => {
          const on = i === nearest;
          card.toggleAttribute("data-active", on);
          gsap.to(card, {
            scale: on ? 1.04 : 1,
            opacity: on ? 1 : 0.5,
            duration: 0.3,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
      };

      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: pinned,
          pin: true,
          start: () => `center ${(window.innerHeight + header()) / 2}px`,
          end: () => `+=${distance()}`,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1,
          // Refreshed with the other pins, before the triggers below it.
          refreshPriority: 2,
          onUpdate: focus,
          onRefresh: focus,
        },
      });
      focus();

      return () => {
        section.classList.remove("is-gallery");
        cards.forEach((card) => card.removeAttribute("data-active"));
      };
    },
    { dependencies: [enabled, desktop], revertOnUpdate: true },
  );

  return null;
}
