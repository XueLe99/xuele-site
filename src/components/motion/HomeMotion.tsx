"use client";

import dynamic from "next/dynamic";

// Client-only chunks: GSAP and its plugins stay out of the first-load JS.
const OpeningIntro = dynamic(() => import("./OpeningIntro").then((m) => m.OpeningIntro), { ssr: false });
const TitleIntro = dynamic(() => import("./TitleIntro").then((m) => m.TitleIntro), { ssr: false });
const RoleDecode = dynamic(() => import("./RoleDecode").then((m) => m.RoleDecode), { ssr: false });
const ScrollStory = dynamic(() => import("./ScrollStory").then((m) => m.ScrollStory), { ssr: false });
const SkillTags = dynamic(() => import("./SkillTags").then((m) => m.SkillTags), { ssr: false });
const ProjectsGallery = dynamic(() => import("./ProjectsGallery").then((m) => m.ProjectsGallery), { ssr: false });
const ParallaxHero = dynamic(() => import("./ParallaxHero").then((m) => m.ParallaxHero), { ssr: false });
const SectionBackdrop = dynamic(() => import("./SectionBackdrop").then((m) => m.SectionBackdrop), { ssr: false });

/**
 * Homepage-only GSAP effects. One line per effect: delete the line (and the
 * file) to remove it. Site-wide effects are in MotionLayer.tsx.
 */
export function HomeMotion() {
  return (
    <>
      <OpeningIntro />
      <TitleIntro />
      <RoleDecode />
      <ScrollStory />
      <SkillTags />
      <ProjectsGallery />
      <ParallaxHero />
      <SectionBackdrop />
    </>
  );
}
