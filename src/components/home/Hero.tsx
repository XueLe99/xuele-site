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
 * The entrance of the supporting lines is pure CSS (`@keyframes hero-line` /
 * `hero-chip`). The name and tagline (`data-title-*`) are animated by
 * <TitleIntro />; `data-intro-hold` keeps them back until it starts (motion.css).
 * <HeroFx /> adds the particle layer behind it on the client, after load.
 */
export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "hero" });
  const c = await getTranslations({ locale, namespace: "common" });
  const chips = t.raw("chips") as string[];
  const en = locale === "en";

  return (
    <Act
      name="hero"
      labelledBy="hero-name"
      backdrop={<HeroFx />}
      className="flex min-h-[calc(100svh-var(--header-h))] flex-col justify-center py-16"
    >
      <div className="max-w-4xl">
        <h1
          id="hero-name"
          data-hero-line
          data-title-name
          data-intro-hold
          style={order(0)}
          className={`t-display ${en ? "font-display" : ""}`}
        >
          {t("name")}
        </h1>
        <p
          data-hero-line
          style={order(1)}
          lang={en ? "zh-CN" : "en"}
          className={
            en
              ? "mt-3 text-2xl font-medium tracking-[0.08em] text-muted"
              : "mt-2 font-display text-2xl font-semibold text-muted lg:text-[28px]"
          }
        >
          {t("altName")}
        </p>

        <p data-hero-line style={order(2)} className="t-h3 mt-8 text-primary md:t-h2">
          {t("headline")}
        </p>
        {/* Role line: decoded by <RoleDecode />, settles on the body text colour. */}
        <p
          data-hero-line
          data-role-decode
          data-intro-hold
          style={order(3)}
          className="mt-2 font-mono text-sm text-text"
        >
          {t("identity")}
        </p>
        <p
          data-hero-line
          data-title-tagline
          data-intro-hold
          style={order(4)}
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

      <a
        href="#act-1"
        data-scroll-hint
        className="mt-16 inline-flex h-11 items-center gap-2 font-mono text-xs tracking-widest text-muted uppercase hover:text-primary"
      >
        <ArrowDownIcon />
        {t("scrollHint")}
      </a>
    </Act>
  );
}
