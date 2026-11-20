"use client";

import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "./gsap";
import { usePointerFx } from "./usePointerFx";

const RADIUS = 80;
const MAX = 8;
const clamp = gsap.utils.clamp(-MAX, MAX);

/**
 * Effect 4a — magnetic buttons (`[data-magnetic]`: résumé, e-mail, View source).
 *
 * Desktop only. Within 80px of a button it leans toward the pointer by at
 * most 8px (gsap.quickTo, 0.4s power3.out); on leaving it springs back in
 * 0.6s elastic.out(1, 0.4). One pointermove listener on window for all buttons.
 */
export function MagneticButtons() {
  const ready = usePointerFx();
  const pathname = usePathname();

  useGSAP(
    (_, contextSafe) => {
      if (!ready || !contextSafe) return;

      const follow = (el: HTMLElement, prop: "x" | "y") =>
        gsap.quickTo(el, prop, { duration: 0.4, ease: "power3.out" });

      const items = gsap.utils.toArray<HTMLElement>("[data-magnetic]").map((el) => {
        // CSS would otherwise ease every frame of the transform a second time.
        el.classList.add("is-magnetic");
        return {
          el,
          xTo: undefined as gsap.QuickToFunc | undefined,
          yTo: undefined as gsap.QuickToFunc | undefined,
          back: undefined as gsap.core.Tween | undefined,
        };
      });

      const onMove = contextSafe((e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        for (const item of items) {
          const { el } = item;
          const rect = el.getBoundingClientRect();
          if (!rect.width) continue; // display: none (e.g. the collapsed menu)

          // Resting centre: the rect minus the offset we applied ourselves.
          const cx = rect.left + rect.width / 2 - Number(gsap.getProperty(el, "x"));
          const cy = rect.top + rect.height / 2 - Number(gsap.getProperty(el, "y"));
          const dx = e.clientX - cx;
          const dy = e.clientY - cy;
          const outside = Math.hypot(
            Math.max(Math.abs(dx) - rect.width / 2, 0),
            Math.max(Math.abs(dy) - rect.height / 2, 0),
          );

          if (outside < RADIUS) {
            if (!item.xTo || !item.yTo) {
              item.back?.kill();
              item.xTo = follow(el, "x");
              item.yTo = follow(el, "y");
            }
            // Full lean at the button's edge, fading to nothing at 80px out.
            const pull = MAX * (1 - outside / RADIUS);
            item.xTo(clamp((dx / (rect.width / 2)) * pull));
            item.yTo(clamp((dy / (rect.height / 2)) * pull));
          } else if (item.xTo && item.yTo) {
            item.xTo.tween.kill();
            item.yTo.tween.kill();
            item.xTo = item.yTo = undefined;
            item.back = gsap.to(el, {
              x: 0,
              y: 0,
              duration: 0.6,
              ease: "elastic.out(1, 0.4)",
            });
          }
        }
      });

      window.addEventListener("pointermove", onMove, { passive: true });
      return () => {
        window.removeEventListener("pointermove", onMove);
        items.forEach(({ el }) => el.classList.remove("is-magnetic"));
      };
    },
    { dependencies: [ready, pathname], revertOnUpdate: true },
  );

  return null;
}
