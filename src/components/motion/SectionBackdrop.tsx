"use client";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap, useGSAP } from "./gsap";
import { useMotion } from "./useMotion";

gsap.registerPlugin(ScrollTrigger);

/** Values the fixed `[data-section-bg]` layer reads (globals.css, "Section backdrop"). */
interface Look {
  "--sb-opacity": number;
  "--bg": string;
  "--glow-color": string;
  "--glow-a": string;
  "--glow-x": string;
  "--glow-y": string;
}

const look = (bg: string, color: string, x: string, y: string, alpha = "12%"): Look => ({
  "--sb-opacity": 1,
  "--bg": bg,
  "--glow-color": color,
  "--glow-a": alpha,
  "--glow-x": x,
  "--glow-y": y,
});

/** Section id → look. Matches the page's order; missing sections (projects off) are skipped. */
const LOOKS: Record<string, Look> = {
  "act-1": look("#070A12", "#6EE7F2", "18%", "18%"), // WhoIAm: same as the hero foreground
  "act-2": look("#0A1020", "#7C8CFF", "85%", "45%"), // Skills
  "act-3": look("#0D1226", "#6EE7F2", "15%", "50%"), // Experience
  projects: look("#0B1A1F", "#34D399", "85%", "50%"), // Projects
  "act-4": look("#050608", "#34D399", "85%", "50%", "0%"), // Lab: no glow
  "act-5": look("#0F0B1E", "#A78BFA", "50%", "92%"), // Contact
};

/** Hero: the layer is invisible so the starry sky behind the silhouettes shows. */
const HERO: Look = { ...LOOKS["act-1"], "--sb-opacity": 0, "--glow-a": "0%" };

/** Glow drift inside a section, ± this much, alternating direction per section. */
const DRIFT = 6;

/**
 * Effect 12 — scroll-driven section backgrounds.
 *
 * One fixed layer behind all content (`[data-section-bg]`, server-rendered in
 * the home page, invisible until this runs). Per section, a scrubbed tween
 * moves its CSS vars from the previous section's look to this one's between
 * "top 60%" and "top 20%"; scrolling back reverses it. A second scrubbed
 * tween drifts the glow position across the whole section.
 *
 * Reduced motion / effects off: no tweens — the look switches instantly when
 * a section's top crosses 40% of the viewport. Dark theme only (CSS hides the
 * layer in light mode, like the hero silhouettes).
 */
export function SectionBackdrop() {
  const { enabled } = useMotion();

  useGSAP(
    () => {
      const layer = document.querySelector<HTMLElement>("[data-section-bg]");
      if (!layer) return;
      const sections = gsap.utils
        .toArray<HTMLElement>("#act-1, #act-2, #act-3, #projects, #act-4, #act-5")
        .filter((el) => LOOKS[el.id]);

      gsap.set(layer, { ...HERO, "--glow-dx": "0%", "--glow-dy": "0%" });

      if (!enabled) {
        sections.forEach((section, i) => {
          const from = i === 0 ? HERO : LOOKS[sections[i - 1].id];
          ScrollTrigger.create({
            trigger: section,
            start: "top 40%",
            onEnter: () => gsap.set(layer, LOOKS[section.id]),
            onLeaveBack: () => gsap.set(layer, from),
          });
        });
        return;
      }

      // Each section scrubs its own progress; one apply() derives the layer
      // from them. Windows never overlap (a section is taller than 40vh), so
      // the look is "last section that has started, blended from the one
      // before" — correct whichever order the tweens render in (reloads too).
      const fade = sections.map(() => ({ t: 0 }));
      const drift = sections.map(() => ({ t: 0 }));
      const blends = sections.map((section, i) =>
        gsap.utils.interpolate(i === 0 ? HERO : LOOKS[sections[i - 1].id], LOOKS[section.id]),
      );
      const offset = (i: number) => {
        if (i < 0) return 0;
        const dir = i % 2 ? -1 : 1;
        return (drift[i].t * 2 - 1) * DRIFT * dir;
      };

      const apply = () => {
        let k = sections.length - 1;
        while (k >= 0 && fade[k].t <= 0) k--;
        if (k < 0) {
          gsap.set(layer, { ...HERO, "--glow-dx": "0%", "--glow-dy": "0%" });
          return;
        }
        const t = fade[k].t;
        const dx = gsap.utils.interpolate(offset(k - 1), offset(k), t);
        const dy = gsap.utils.interpolate(k ? (drift[k - 1].t - 0.5) * DRIFT : 0, (drift[k].t - 0.5) * DRIFT, t);
        gsap.set(layer, { ...blends[k](t), "--glow-dx": `${dx}%`, "--glow-dy": `${dy}%` });
      };

      sections.forEach((section, i) => {
        gsap.to(fade[i], {
          t: 1,
          ease: "none",
          onUpdate: apply,
          scrollTrigger: { trigger: section, start: "top 60%", end: "top 20%", scrub: 1 },
        });
        gsap.to(drift[i], {
          t: 1,
          ease: "none",
          onUpdate: apply,
          scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 1 },
        });
      });

      // Restore whichever look matches the current scroll position (reload mid-page).
      ScrollTrigger.refresh();
    },
    { dependencies: [enabled], revertOnUpdate: true },
  );

  return null;
}
