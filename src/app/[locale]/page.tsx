import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContactAct } from "@/components/home/ContactAct";
import { Experience } from "@/components/home/Experience";
import { Hero } from "@/components/home/Hero";
import { HomeFx } from "@/components/home/HomeFx";
import { LabPreview } from "@/components/home/LabPreview";
import { ProjectsSection } from "@/components/home/ProjectsSection";
import { Skills } from "@/components/home/Skills";
import { WhoIAm } from "@/components/home/WhoIAm";
import { RoleDecode } from "@/components/motion/RoleDecode";
import { SkillTags } from "@/components/motion/SkillTags";
import { TitleIntro } from "@/components/motion/TitleIntro";
import { resolveLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({
    locale,
    title: t("homeTitle"),
    description: t("description"),
    absoluteTitle: true,
  });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);

  return (
    <>
      {/* Acts 0–5: server-rendered text; <HomeFx /> layers the scroll animation on top. */}
      <Hero locale={locale} />
      <WhoIAm locale={locale} />
      <Skills locale={locale} />
      <Experience locale={locale} />
      {/* Renders nothing unless SHOW_PROJECTS is true. */}
      <ProjectsSection locale={locale} />
      <LabPreview locale={locale} />
      <ContactAct locale={locale} />
      <HomeFx />
      {/* GSAP motion layer: one component per effect, each removable on its own. */}
      <TitleIntro />
      <RoleDecode />
      <SkillTags />
    </>
  );
}
