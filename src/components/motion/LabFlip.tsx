"use client";

import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Flip } from "gsap/Flip";
import { gsap, useGSAP } from "./gsap";
import { internalDestination } from "./RouteCurtain";
import { useMotion } from "./useMotion";

gsap.registerPlugin(Flip);

interface Flight {
  id: string;
  ghost: HTMLElement;
  veil: HTMLElement;
  timer: number;
}

/**
 * Effect 9 — Lab card Flip (home Lab preview card → Lab demo area).
 *
 * A real shared-element Flip cannot span two App Router routes: the card
 * unmounts with the homepage before the demo exists. The equivalent used here:
 *
 * 1. Click on a `[data-lab-card]` link: a fixed clone of the card ("ghost") is
 *    placed exactly over it, outside the React tree, and a veil in the page
 *    background colour fades in over the homepage.
 * 2. The router navigates to /lab#<demo>.
 * 3. When the demo slot (`[data-demo-slot]`) exists, Flip.fit() carries the
 *    ghost onto it — 0.6s power2.inOut, transforms only — while the ghost
 *    fades out, the real demo fades in, and the veil fades away to reveal the
 *    Lab page with its Grid Scan backdrop coming up behind it.
 *
 * Desktop only. Must be mounted before <RouteCurtain />: both listen for link
 * clicks in the capture phase and the first one to claim a click wins.
 */
export function LabFlip() {
  const { enabled, desktop } = useMotion();
  const active = enabled && desktop;
  const router = useRouter();
  const pathname = usePathname();
  const flight = useRef<Flight | null>(null);
  const land = useRef<() => void>(() => {});

  useGSAP(
    (_, contextSafe) => {
      if (!active || !contextSafe) return;
      let frame = 0;

      const finish = () => {
        const current = flight.current;
        if (!current) return;
        flight.current = null;
        window.clearTimeout(current.timer);
        current.ghost.remove();
        current.veil.remove();
      };

      const fly = contextSafe((current: Flight, target: HTMLElement) => {
        window.clearTimeout(current.timer);
        gsap
          .timeline({ defaults: { duration: 0.6 }, onComplete: finish })
          .add(
            Flip.fit(current.ghost, target, {
              scale: true,
              duration: 0.6,
              ease: "power2.inOut",
            }) as gsap.core.Tween,
            0,
          )
          .to(current.ghost, { opacity: 0, ease: "power2.in" }, 0)
          .fromTo(
            target,
            { opacity: 0 },
            { opacity: 1, ease: "power2.out", clearProps: "opacity" },
            0,
          )
          .to(current.veil, { opacity: 0, ease: "power2.inOut" }, 0);
      });

      // Called on every route change: wait for the slot, then for one more
      // frame so the #hash scroll has settled before anything is measured.
      land.current = () => {
        const current = flight.current;
        if (!current) return;
        let tries = 0;
        const seek = () => {
          const target = document.querySelector<HTMLElement>(
            `[data-demo-slot="${current.id}"]`,
          );
          if (target) {
            frame = requestAnimationFrame(() => fly(current, target));
          } else if (++tries < 120) {
            frame = requestAnimationFrame(seek);
          }
        };
        cancelAnimationFrame(frame);
        seek();
      };

      const onClick = contextSafe((e: MouseEvent) => {
        const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>(
          "[data-lab-card] a[href]",
        );
        const id = link?.closest<HTMLElement>("[data-lab-card]")?.dataset.labCard;
        if (!link || !id || flight.current) return;
        const destination = internalDestination(e);
        if (!destination) return;
        e.preventDefault();

        const rect = link.getBoundingClientRect();
        const ghost = link.cloneNode(true) as HTMLElement;
        ghost.removeAttribute("href");
        ghost.setAttribute("aria-hidden", "true");
        ghost.classList.add("lab-flip-ghost");
        // Not part of the card: the tilt effect's pointer highlight.
        ghost.querySelector(".tilt-shell")?.remove();
        Object.assign(ghost.style, {
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        });
        const veil = document.createElement("div");
        veil.className = "lab-flip-veil";
        veil.setAttribute("aria-hidden", "true");
        document.body.append(veil, ghost);

        // Whatever happens to the navigation, the overlay never outlives 3s.
        flight.current = { id, ghost, veil, timer: window.setTimeout(finish, 3000) };
        router.prefetch(destination);
        gsap.to(veil, {
          opacity: 1,
          duration: 0.25,
          ease: "power2.out",
          onComplete: () => router.push(destination),
        });
      });

      document.addEventListener("click", onClick, true);
      return () => {
        document.removeEventListener("click", onClick, true);
        cancelAnimationFrame(frame);
        finish();
      };
    },
    { dependencies: [active, router], revertOnUpdate: true },
  );

  useGSAP(() => land.current(), { dependencies: [pathname] });

  return null;
}
