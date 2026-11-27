import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { EMAIL, RESUME } from "@/config";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { ArrowDownIcon, DownloadIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/routing";
import { Act } from "./Act";
import { HeroFx } from "./HeroFx";

/** Stagger index for the CSS-only entrance (globals.css, "Act 0"). */
const order = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * Act 0. Fully static HTML; the name heading is the LCP element.
 *
 * A Firewatch-style layered scene: particles, skyline, hills, the name and a
 * foreground tree line whose fill is the page background, so the scene sinks
 * into the "ground" below it (headline, tagline, chips, buttons).
 *
 * The entrance of the supporting lines is pure CSS (`@keyframes hero-line` /
 * `hero-chip`). The name and tagline (`data-title-*`) are animated by
 * <TitleIntro />; `data-intro-hold` keeps them back until it starts (motion.css).
 * <HeroFx /> adds the particle layer on the client, after load.
 */
export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "hero" });
  const c = await getTranslations({ locale, namespace: "common" });
  const chips = t.raw("chips") as string[];
  const en = locale === "en";

  // Both locales show the same lock-up: English first name, Chinese name below.
  const fullName = en ? t("name") : t("altName");
  const zhName = en ? t("altName") : t("name");
  const [firstName] = fullName.split(" ");
  const restName = fullName.slice(firstName.length);

  return (
    <Act name="hero" labelledBy="hero-name" contained={false}>
      {/*
        Parallax scene (100svh, from the very top of the page, under the sticky
        header). Layers far → near; `data-parallax` = scroll speed (movement ÷
        scroll distance) on ≥768px, `data-parallax-mobile` below that (no
        attribute: the layer simply scrolls with the page). Driven by
        <ParallaxHero />; static without it. `data-intro-layer` is the inner
        element <OpeningIntro /> scales, so the two effects never share a transform.
      */}
      <div className="hero-scene" data-hero-scene>
        <div className="hero-layer hero-layer-fx" data-parallax="0.2">
          <div className="hero-layer-inner" data-intro-layer>
            <HeroFx />
          </div>
        </div>
        <div className="hero-layer hero-layer-skyline" data-parallax="0.25" data-parallax-mobile="0.125">
          {/* eslint-disable-next-line @next/next/no-img-element -- decorative SVG, no optimisation needed */}
          <img src="/parallax/skyline.svg" alt="" data-intro-layer className="hero-art" />
        </div>
        <div className="hero-layer hero-layer-hills" data-parallax="0.45">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/parallax/hills.svg" alt="" data-intro-layer className="hero-art" />
        </div>

        <div className="hero-layer hero-layer-name" data-parallax="0.6" data-parallax-mobile="0.3">
          <div className="container-site text-center">
            <h1
              id="hero-name"
              data-hero-line
              data-title-name
              data-intro-hold
              style={order(0)}
              className="hero-name"
            >
              <span lang="en" className="hero-name-en">
                {firstName}
              </span>
              {restName && <span className="sr-only">{restName}</span>}
              <span lang="zh-CN" className="hero-name-zh">
                {zhName}
              </span>
            </h1>
            {/* Role line: decoded by <RoleDecode />, settles on the body text colour. */}
            <p
              data-hero-line
              data-role-decode
              data-intro-hold
              style={order(1)}
              className="mt-4 font-mono text-sm text-text"
            >
              {t("identity")}
            </p>
          </div>
        </div>

        <div className="hero-layer hero-layer-fg" data-parallax="1" data-parallax-mobile="1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/parallax/foreground.svg" alt="" data-intro-layer className="hero-art" />
          <a
            href="#act-1"
            data-scroll-hint
            className="hero-scroll-hint inline-flex h-11 items-center gap-2 font-mono text-xs tracking-widest text-muted uppercase hover:text-primary"
          >
            <ArrowDownIcon />
            {t("scrollHint")}
          </a>
        </div>
      </div>

      {/* The ground the scene sinks into: same colour as the foreground, no seam. */}
      <div className="hero-ground">
        <div className="container-site pt-4 pb-8 md:pb-12">
          <p data-hero-line style={order(2)} className="t-h3 text-primary md:t-h2">
            {t("headline")}
          </p>
          <p
            data-hero-line
            data-title-tagline
            data-intro-hold
            style={order(3)}
            className="t-body prose-measure mt-6 text-muted"
          >
            {t("tagline")}
          </p>

          <ul aria-label={t("chipsLabel")} className="mt-8 flex flex-wrap gap-2">
            {chips.map((chip, i) => (
              <li key={chip} data-hero-chip style={order(i)} className="chip">
                {chip}
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <a href={RESUME[locale]} download data-magnetic className="btn btn-primary">
              <DownloadIcon />
              {c("downloadResume")}
            </a>
            <CopyEmailButton
              email={EMAIL}
              label={c("copyEmail")}
              copiedLabel={c("copied")}
            />
          </div>
        </div>
      </div>
    </Act>
  );
}
