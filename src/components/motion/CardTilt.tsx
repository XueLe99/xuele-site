"use client";

import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "./gsap";
import { usePointerFx } from "./usePointerFx";

const MAX_TILT = 6;

/**
 * Effect 4b — card tilt (`[data-tilt]`).
 *
 * Desktop only. The card tilts toward the pointer by at most 6° with an 800px
 * perspective, and a soft highlight (opacity 0.12) follows the pointer. The
 * highlight is an element this effect adds and removes itself; it is moved
 * with transforms only.
 *
 * `data-tilt` must sit on an element no other effect transforms (scroll story
 * blocks, gallery cards): two GSAP contexts reverting the same element's
 * transform would restore each other's intermediate state.
 */
export function CardTilt() {
  const ready = usePointerFx();
  const pathname = usePathname();

  useGSAP(
    (_, contextSafe) => {
      if (!ready || !contextSafe) return;
      const cleanups: (() => void)[] = [];

      gsap.utils.toArray<HTMLElement>("[data-tilt]").forEach((card) => {
        const shell = document.createElement("span");
        shell.className = "tilt-shell";
        shell.setAttribute("aria-hidden", "true");
        const glow = document.createElement("span");
        glow.className = "tilt-glow";
        shell.append(glow);
        card.append(shell);

        gsap.set(card, { transformPerspective: 800 });
        const quick = (target: HTMLElement, prop: string) =>
          gsap.quickTo(target, prop, { duration: 0.4, ease: "power3.out" });
        const rotateX = quick(card, "rotationX");
        const rotateY = quick(card, "rotationY");
        const glowX = quick(glow, "x");
        const glowY = quick(glow, "y");

        let rect = card.getBoundingClientRect();
        const onEnter = contextSafe(() => {
          rect = card.getBoundingClientRect();
          gsap.to(glow, { opacity: 0.12, duration: 0.3, overwrite: "auto" });
        });
        const onMove = contextSafe((e: PointerEvent) => {
          const px = gsap.utils.clamp(0, 1, (e.clientX - rect.left) / rect.width);
          const py = gsap.utils.clamp(0, 1, (e.clientY - rect.top) / rect.height);
          rotateY((px - 0.5) * 2 * MAX_TILT);
          rotateX((0.5 - py) * 2 * MAX_TILT);
          glowX(px * rect.width);
          glowY(py * rect.height);
        });
        const onLeave = contextSafe(() => {
          rotateX(0);
          rotateY(0);
          gsap.to(glow, { opacity: 0, duration: 0.3, overwrite: "auto" });
        });

        card.addEventListener("pointerenter", onEnter);
        card.addEventListener("pointermove", onMove);
        card.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          card.removeEventListener("pointerenter", onEnter);
          card.removeEventListener("pointermove", onMove);
          card.removeEventListener("pointerleave", onLeave);
          shell.remove();
        });
      });

      return () => cleanups.forEach((fn) => fn());
    },
    { dependencies: [ready, pathname], revertOnUpdate: true },
  );

  return null;
}
