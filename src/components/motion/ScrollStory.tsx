"use client";

import { useEffect, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap, useGSAP } from "./gsap";
import { useMotion } from "./useMotion";

gsap.registerPlugin(ScrollTrigger);

/** Acts that take part, in page order. */
const ACTS = ["who", "skills", "experience"] as const;

const headerHeight = () =>
  document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 0;

const storyActs = () =>
  ACTS.map((name) =>
    document.querySelector<HTMLElement>(`[data-act-name="${name}"]`),
  ).filter((act): act is HTMLElement => !!act);

/** The act's content column: this is what gets pinned (never the <section>). */
const column = (act: HTMLElement) => act.querySelector<HTMLElement>(":scope > .container-site");

/** A column can only be pinned if all of it fits below the header. */
const fits = (el: HTMLElement) =>
  el.offsetHeight <= window.innerHeight - headerHeight() - 32;

const fitSignature = () =>
  storyActs()
    .map((act) => {
      const el = column(act);
      return el && fits(el) ? "1" : "0";
    })
    .join("");

/**
 * Effect 2 — scroll story for who-I-am / skills / experience.
 *
 * Desktop: each act's content column is pinned for 100vh (centred under the
 * header), scrub 0.8. Its `[data-story-block]` children cross-fade in one after
 * the other (y 24 → 0, opacity 0 → 1), each over 20% of the segment's progress.
 * The segment runs from the act entering the viewport to the end of its pin,
 * so the act is never an empty box on the way in. An act that is taller than
 * the viewport is not pinned (pinning would cut it off); it keeps the scrubbed
 * cross-fade.
 *
 * Experience timeline: `[data-timeline-stroke]` (SVG, pathLength 1) draws with
 * the same scroll, stroke-dashoffset 100% → 0, and each `[data-timeline-node]`
 * pops scale 0 → 1, back.out(2), 0.4s when the stroke arrives.
 *
 * Mobile: no pin; blocks below the fold fade in once.
 *
 * Renders nothing. Homepage only.
 */
export function ScrollStory() {
  const { enabled, desktop } = useMotion();
  // Rebuilt when a resize changes which acts fit the viewport.
  const [layout, setLayout] = useState("");

  useEffect(() => {
    if (!enabled || !desktop) return;
    let timer = 0;
    const measure = () => setLayout(fitSignature());
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [enabled, desktop]);

  useGSAP(
    () => {
      if (!enabled) return;

      storyActs().forEach((act) => {
        const el = column(act);
        const blocks = gsap.utils.toArray<HTMLElement>("[data-story-block]", act);
        if (!el || !blocks.length) return;

        if (!desktop) {
          const below = blocks.filter(
            (block) => block.getBoundingClientRect().top > window.innerHeight * 0.85,
          );
          below.forEach((block) => {
            gsap.from(block, {
              y: 24,
              opacity: 0,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: { trigger: block, start: "top 85%", once: true },
            });
          });
          drawTimeline(act, { trigger: act, start: "top 70%", end: "bottom 80%" });
          return;
        }

        // Pins refresh before everything else (higher refreshPriority first),
        // so every later trigger on the page is measured with their spacers.
        const pin = fits(el)
          ? ScrollTrigger.create({
              trigger: el,
              pin: true,
              start: () => `center ${(window.innerHeight + headerHeight()) / 2}px`,
              end: "+=100%",
              anticipatePin: 1,
              refreshPriority: 2,
            })
          : undefined;
        const segment = {
          trigger: act,
          start: "top 75%",
          end: () => (pin ? pin.end : "top 15%"),
        };

        // Timeline of length 1 = the whole segment; each block takes 0.2 of it.
        const step = blocks.length > 1 ? Math.min(0.2, 0.7 / (blocks.length - 1)) : 0;
        const story = gsap.timeline({
          defaults: { ease: "none", duration: 0.2 },
          scrollTrigger: { ...segment, scrub: 0.8, refreshPriority: 1 },
        });
        blocks.forEach((block, i) => {
          story.fromTo(block, { y: 24, opacity: 0 }, { y: 0, opacity: 1 }, i * step);
        });
        story.set({}, {}, 1);

        drawTimeline(act, segment);
      });
    },
    { dependencies: [enabled, desktop, layout], revertOnUpdate: true },
  );

  return null;
}

/** Stroke draws with the scroll; nodes pop when the stroke reaches them. */
function drawTimeline(
  act: HTMLElement,
  range: Pick<ScrollTrigger.Vars, "trigger" | "start" | "end">,
) {
  const stroke = act.querySelector<SVGGeometryElement>("[data-timeline-stroke]");
  if (!stroke) return;

  const line = stroke.getBoundingClientRect();
  const nodes = gsap.utils.toArray<HTMLElement>("[data-timeline-node]", act).map((node) => {
    const box = node.getBoundingClientRect();
    return {
      at: (box.top + box.height / 2 - line.top) / (line.height || 1),
      pop: gsap.fromTo(
        node,
        { scale: 0 },
        { scale: 1, duration: 0.4, ease: "back.out(2)", paused: true },
      ),
    };
  });

  gsap.fromTo(
    stroke,
    { strokeDasharray: 1, strokeDashoffset: 1 },
    {
      strokeDashoffset: 0,
      // pathLength is 1: the offset must not be rounded to whole pixels.
      autoRound: false,
      ease: "none",
      scrollTrigger: { ...range, scrub: 0.8, refreshPriority: 1 },
      onUpdate() {
        // Finish a little early so the last node is reached before the end.
        const drawn = this.progress() * 1.1;
        nodes.forEach(({ at, pop }) => {
          if (drawn >= at) pop.play();
          else pop.reverse();
        });
      },
    },
  );
}
