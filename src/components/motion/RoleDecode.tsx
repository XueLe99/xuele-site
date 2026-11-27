"use client";

import { useRef } from "react";
import { SplitText } from "gsap/SplitText";
import { gsap, useGSAP } from "./gsap";
import { countChars, introStart, nameIntroDuration, releaseHold } from "./hero-clock";
import { SPLIT_CLASSES } from "./split";
import { useMotion } from "./useMotion";
import { useIntroGate } from "@/lib/opening-intro";

gsap.registerPlugin(SplitText);

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*".split("");
const SCRAMBLE_COLOR = "#9AA0B4";
const FLIP = 0.03;
const STAGGER = 0.025;

/**
 * Effect 6 — role line decode (`[data-role-decode]`, Geist Mono).
 *
 * Starts when the name intro ends. Left to right (stagger 0.025s) every
 * character flips through 6 random glyphs (3 on mobile) at 30ms each in
 * #9AA0B4, then settles on the real character in the line's own text colour.
 *
 * Renders nothing; the split is reverted when the last character has settled.
 */
export function RoleDecode() {
  const { enabled, desktop } = useMotion();
  const startAt = useRef<number | null | undefined>(undefined);
  const played = useRef(false);
  const gate = useIntroGate();

  useGSAP(
    () => {
      const role = document.querySelector<HTMLElement>("[data-role-decode]");
      if (!enabled || !role) return;

      if (startAt.current === undefined) {
        const at = introStart(role);
        if (at === "wait") return; // opening intro still up: keep the hold
        startAt.current = at;
      }
      const start = startAt.current;
      releaseHold(role);
      if (start === null || played.current) return;

      // Same clock as TitleIntro, derived from the name's length — no coupling.
      const nameChars = countChars(document.querySelector("[data-title-name]"));
      const beginAt = start + nameIntroDuration(nameChars, desktop) * 1000;

      const split = SplitText.create(role, { type: "words,chars", ...SPLIT_CLASSES });
      const chars = split.chars as HTMLElement[];
      // Fix each cell's width first (read, then write) so a narrower scramble
      // glyph cannot reflow the line, e.g. over a CJK character.
      const widths = chars.map((el) => el.getBoundingClientRect().width);
      gsap.set(chars, { width: (i) => widths[i], textAlign: "center", opacity: 0 });

      const flips = desktop ? 6 : 3;
      const glyph = gsap.utils.random(CHARSET, true);
      const tl = gsap.timeline({
        delay: Math.max(0, (beginAt - performance.now()) / 1000),
        onComplete: () => {
          played.current = true;
          split.revert();
        },
      });

      chars.forEach((el, i) => {
        const original = el.textContent;
        const counter = { n: 0 };
        let shown = -1;
        tl.to(
          counter,
          {
            n: flips,
            duration: flips * FLIP,
            ease: "none",
            onStart: () => {
              el.style.opacity = "1";
              el.style.color = SCRAMBLE_COLOR;
            },
            onUpdate: () => {
              const step = Math.floor(counter.n);
              if (step === shown || step >= flips) return;
              shown = step;
              el.textContent = glyph();
            },
            onComplete: () => {
              el.textContent = original;
              el.style.color = "";
            },
          },
          i * STAGGER,
        );
      });
    },
    { dependencies: [enabled, desktop, gate], revertOnUpdate: true },
  );

  return null;
}
