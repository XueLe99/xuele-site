"use client";

import { usePathname } from "next/navigation";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap, useGSAP } from "./gsap";
import { useMotion } from "./useMotion";

gsap.registerPlugin(ScrollTrigger);

/**
 * Effect 3a — numbers (`[data-count]`, text content = the final value).
 *
 * Counts 0 → value in 1.2s power1.out (0.6s on mobile), trigger "top 80%",
 * once, rounded; zero padding of the source text ("03") is kept. The markup
 * always holds the final value: a number that is already on screen when the
 * effect starts is left alone, and reverting restores the original text.
 */
export function Counters() {
  const { enabled, desktop } = useMotion();
  const pathname = usePathname();

  useGSAP(
    () => {
      if (!enabled) return;
      const round = gsap.utils.snap(1);
      const restore: (() => void)[] = [];

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const text = (el.textContent ?? "").trim();
        const value = Number(text);
        if (!text || !Number.isFinite(value)) return;
        if (el.getBoundingClientRect().top < window.innerHeight * 0.8) return;

        const show = (n: number) => {
          el.textContent = String(round(n)).padStart(text.length, "0");
        };
        const counter = { n: 0 };
        show(0);
        restore.push(() => {
          el.textContent = text;
        });
        gsap.to(counter, {
          n: value,
          duration: desktop ? 1.2 : 0.6,
          ease: "power1.out",
          onUpdate: () => show(counter.n),
          scrollTrigger: { trigger: el, start: "top 80%", once: true },
        });
      });

      return () => restore.forEach((fn) => fn());
    },
    { dependencies: [enabled, desktop, pathname], revertOnUpdate: true },
  );

  return null;
}
