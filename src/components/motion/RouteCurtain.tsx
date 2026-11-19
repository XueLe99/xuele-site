"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, useGSAP } from "./gsap";
import { useMotion } from "./useMotion";

const MAX_WAIT_MS = 300;

/** Same-origin page link that a plain left click would follow in this tab. */
export function internalDestination(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href]");
  if (!link || link.hasAttribute("download")) return null;
  if (link.target && link.target !== "_self") return null;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  // Same page (hash or query only): nothing to cover.
  if (url.pathname === window.location.pathname) return null;
  return url.pathname + url.search + url.hash;
}

/**
 * Effect 5 — route curtain (desktop only).
 *
 * A #070A12 curtain with a 1px #E8C56B line on its left edge (8px glow,
 * opacity 0.4). Leaving: scaleX 0 → 1 from the left, 0.45s power4.inOut; the
 * navigation happens once the page is covered. Entering: as soon as the new
 * route has rendered — or after 300ms at the latest — scaleX 1 → 0 toward the
 * right, 0.45s power4.inOut.
 *
 * Internal link clicks are intercepted in the capture phase; anything that is
 * not a plain same-origin navigation (new tab, download, hash link, a click
 * another effect has already claimed) is left to the browser / Next.
 */
export function RouteCurtain() {
  const { enabled, desktop } = useMotion();
  const active = enabled && desktop;
  const router = useRouter();
  const pathname = usePathname();
  const curtain = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  const phase = useRef<"idle" | "covering" | "covered" | "revealing">("idle");
  const reveal = useRef<() => void>(() => {});

  useGSAP(
    (_, contextSafe) => {
      const el = curtain.current;
      const line = edge.current;
      if (!active || !el || !line || !contextSafe) return;
      let timer = 0;

      // The curtain is scaled; the line on its edge must stay 1px wide.
      const keepLine = () => {
        const scale = Math.max(Number(gsap.getProperty(el, "scaleX")), 0.001);
        gsap.set(line, { scaleX: 1 / scale });
      };

      reveal.current = contextSafe(() => {
        if (phase.current !== "covered") return;
        window.clearTimeout(timer);
        phase.current = "revealing";
        gsap.fromTo(
          el,
          { scaleX: 1, transformOrigin: "right center" },
          {
            scaleX: 0,
            duration: 0.45,
            ease: "power4.inOut",
            onUpdate: keepLine,
            onComplete: () => {
              phase.current = "idle";
              gsap.set(el, { autoAlpha: 0 });
            },
          },
        );
      });

      const onClick = contextSafe((e: MouseEvent) => {
        if (phase.current !== "idle") return;
        const destination = internalDestination(e);
        if (!destination) return;

        e.preventDefault();
        phase.current = "covering";
        router.prefetch(destination);
        gsap.fromTo(
          el,
          { autoAlpha: 1, scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 0.45,
            ease: "power4.inOut",
            onUpdate: keepLine,
            onComplete: () => {
              phase.current = "covered";
              router.push(destination);
              timer = window.setTimeout(() => reveal.current(), MAX_WAIT_MS);
            },
          },
        );
      });

      document.addEventListener("click", onClick, true);
      return () => {
        document.removeEventListener("click", onClick, true);
        window.clearTimeout(timer);
        phase.current = "idle";
      };
    },
    { dependencies: [active, router], revertOnUpdate: true },
  );

  // The new route has rendered: open the curtain without waiting for the timer.
  useEffect(() => {
    reveal.current();
  }, [pathname]);

  if (!active) return null;

  return (
    <div ref={curtain} className="route-curtain" aria-hidden="true">
      <div ref={edge} className="route-curtain-edge" />
    </div>
  );
}
