"use client";

import { useEffect } from "react";
import { useFx } from "@/components/fx/FxProvider";
import { afterLoadIdle } from "@/lib/after-load";
import { useDesktopPointer, useReducedMotion } from "@/lib/capability";
import { resetSky, sky } from "@/lib/sky-store";

/**
 * Scroll choreography for the homepage. Renders nothing: it enhances the
 * server-rendered acts through their data-* hooks (see README).
 *
 * - Progressive enhancement: the SSR HTML is the final state. Nothing is hidden
 *   until the libraries have loaded, and only content that is still below the
 *   viewport gets an "un-drawn" start state.
 * - Reduced motion or effects off: nothing runs; everything stays in its final state.
 * - gsap, ScrollTrigger, lenis and motion are dynamic imports, requested after
 *   window load + idle, so none of them is needed for first paint.
 *
 * The hero entrance (act 0) is CSS-only, see globals.css.
 */
export function HomeFx() {
  const { fxOff } = useFx();
  const reduced = useReducedMotion();
  const desktop = useDesktopPointer();
  const enabled = !fxOff && !reduced;

  // Act 2: chip ↔ star highlight, both directions. Not an animation, so it
  // also works with effects off.
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>("[data-skill-card]");
    const cleanups: (() => void)[] = [];

    cards.forEach((card) => {
      const indexOf = (target: EventTarget | null) => {
        const el = (target as Element | null)?.closest?.(
          "[data-star], [data-star-chip]",
        ) as HTMLElement | SVGElement | null;
        return el ? (el.dataset.star ?? el.dataset.starChip) : undefined;
      };
      const set = (index: string | undefined) => {
        card
          .querySelectorAll("[data-star][data-active], [data-star-chip][data-active]")
          .forEach((el) => el.removeAttribute("data-active"));
        if (index === undefined) return;
        card
          .querySelectorAll(`[data-star="${index}"], [data-star-chip="${index}"]`)
          .forEach((el) => el.setAttribute("data-active", ""));
      };
      const over = (e: Event) => set(indexOf(e.target));
      const leave = () => set(undefined);

      card.addEventListener("pointerover", over);
      card.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        card.removeEventListener("pointerover", over);
        card.removeEventListener("pointerleave", leave);
        set(undefined);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const cleanups: (() => void)[] = [];

    const cancelIdle = afterLoadIdle(async () => {
      const [{ gsap }, { ScrollTrigger }, lenisMod, motion] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        desktop ? import("lenis") : null,
        desktop ? import("motion") : null,
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      /* -------- Lenis smooth scroll (desktop), driven by the GSAP ticker ------- */
      if (lenisMod) {
        // Lenis honours `scroll-padding-top` (sticky header) for #anchor links.
        const lenis = new lenisMod.default({ autoRaf: false, anchors: true });
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        cleanups.push(() => {
          gsap.ticker.remove(raf);
          gsap.ticker.lagSmoothing(500, 33);
          lenis.destroy();
        });
      }

      /* ------------------------ ScrollTrigger scenes ------------------------ */
      const ctx = gsap.context(() => {
        // Act 1: phrases light up muted → text (CSS reads --lit), camera pushes in.
        const phrases = gsap.utils.toArray<HTMLElement>("[data-phrase]");
        if (phrases.length) {
          gsap.fromTo(
            phrases,
            { "--lit": 0 },
            {
              "--lit": 1,
              ease: "none",
              duration: 1,
              stagger: 0.8,
              scrollTrigger: {
                trigger: "[data-phrases]",
                start: "top 82%",
                end: "bottom 48%",
                scrub: 0.8,
              },
            },
          );
        }
        gsap.fromTo(
          sky,
          { push: 0 },
          {
            push: 1,
            ease: "none",
            scrollTrigger: {
              trigger: "#act-1",
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          },
        );

        // Act 3: the star trail draws with scroll; nodes light when it reaches them.
        const timeline = document.querySelector<HTMLElement>("[data-timeline]");
        const line = timeline?.querySelector<HTMLElement>("[data-timeline-line]");
        if (timeline && line) {
          const items = Array.from(
            timeline.querySelectorAll<HTMLElement>("[data-timeline-item]"),
          );
          const reached = (progress: number) => {
            const length = line.offsetHeight || 1;
            items.forEach((item) => {
              const node = item.querySelector<HTMLElement>("[data-timeline-node]");
              if (!node) return;
              const at =
                item.offsetTop + node.offsetTop + node.offsetHeight / 2 - line.offsetTop;
              const lit = progress * length >= at - 1;
              node.toggleAttribute("data-lit", lit);
              // Items rise in once and then stay.
              if (lit) item.setAttribute("data-shown", "");
            });
          };
          // Entries already scrolled past stay visible (no flash on reload mid-page).
          items.forEach((item) => {
            if (item.getBoundingClientRect().top < window.innerHeight * 0.85) {
              item.setAttribute("data-shown", "");
            }
          });
          timeline.classList.add("is-fx");
          gsap.fromTo(
            line,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                // The trail is fully drawn (last node lit) by the time the
                // whole act is in view, not only after it has half left.
                trigger: timeline,
                start: "top 85%",
                endTrigger: timeline.closest("[data-act]") ?? timeline,
                end: "bottom bottom",
                scrub: 0.8,
              },
              onUpdate() {
                reached(this.progress());
              },
            },
          );
          cleanups.push(() => {
            timeline.classList.remove("is-fx");
            items.forEach((item) => {
              item.removeAttribute("data-shown");
              item
                .querySelector("[data-timeline-node]")
                ?.removeAttribute("data-lit");
            });
          });
        }

        // Act 4: stars dim to 40%, nebula and meteors pause.
        ScrollTrigger.create({
          trigger: "#act-4",
          start: "top 60%",
          end: "bottom 40%",
          onToggle: (self) => {
            sky.dim = self.isActive ? 1 : 0;
          },
        });

        // Act 5: stars gather toward the contact button.
        gsap.fromTo(
          sky,
          { gather: 0 },
          {
            gather: 1,
            ease: "none",
            scrollTrigger: {
              trigger: "#act-5",
              start: "top 85%",
              end: "clamp(top 30%)",
              scrub: 0.8,
            },
          },
        );
      });
      cleanups.push(() => {
        ctx.revert();
        resetSky();
      });

      /* ---- Act 2: constellations draw when the card enters (desktop only) ---- */
      if (motion) {
        const { animate, inView, stagger } = motion;
        const ease = [0.22, 1, 0.36, 1] as const;

        document.querySelectorAll<HTMLElement>("[data-skill-card]").forEach((card) => {
          const path = card.querySelector<SVGPathElement>("[data-constellation-line]");
          const stars = Array.from(card.querySelectorAll<SVGElement>("[data-star]"));
          // Cards already on screen (or above) keep their drawn state: no flash.
          if (!path || card.getBoundingClientRect().top < window.innerHeight * 0.9) return;

          path.style.strokeDasharray = "1";
          path.style.strokeDashoffset = "1";
          stars.forEach((star) => star.style.setProperty("--lit", "0"));

          const controls: { stop: () => void }[] = [];
          const stopObserving = inView(
            card,
            () => {
              stopObserving();
              controls.push(
                animate(path, { strokeDashoffset: [1, 0] }, { duration: 0.6, ease }),
                animate(
                  stars,
                  { "--lit": [0, 1] },
                  {
                    duration: 0.3,
                    ease: "easeOut",
                    delay: stagger(0.6 / Math.max(stars.length, 1), { startDelay: 0.1 }),
                  },
                ),
              );
            },
            { amount: 0.4 },
          );

          cleanups.push(() => {
            stopObserving();
            controls.forEach((c) => c.stop());
            path.style.removeProperty("stroke-dasharray");
            path.style.removeProperty("stroke-dashoffset");
            stars.forEach((star) => star.style.removeProperty("--lit"));
          });
        });
      }

      /* ------------- Act 5: magnetic primary button (≤6px, desktop) ------------ */
      if (desktop) {
        const MAX = 6;
        document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
          const move = (e: PointerEvent) => {
            const rect = el.getBoundingClientRect();
            const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
            const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
            const clamp = (n: number) => Math.max(-1, Math.min(1, n)) * MAX;
            // `translate` composes with the hover transform; CSS eases it.
            el.style.translate = `${clamp(dx).toFixed(2)}px ${clamp(dy).toFixed(2)}px`;
          };
          const leave = () => el.style.removeProperty("translate");
          el.addEventListener("pointermove", move);
          el.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            el.removeEventListener("pointermove", move);
            el.removeEventListener("pointerleave", leave);
            leave();
          });
        });
      }

      // Fonts / late layout can move the acts: measure once more.
      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      cancelIdle();
      cleanups.reverse().forEach((fn) => fn());
    };
  }, [enabled, desktop]);

  return null;
}
