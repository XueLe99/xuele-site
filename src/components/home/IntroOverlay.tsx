import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

const TAGLINE = "Build · Research · Discover";

/**
 * Markup for the opening intro (animated by motion/OpeningIntro.tsx).
 *
 * Server-rendered so it covers the hero from the first frame; the hero renders
 * underneath, so LCP is not blocked. Without JavaScript a CSS animation hides
 * it after 3s; with `<html data-intro="skip">` (inline gate script: seen this
 * session, effects off, reduced motion) it is never painted. See motion.css.
 */
export async function IntroOverlay({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "intro" });

  return (
    <div className="intro-overlay" data-opening-intro>
      <div className="intro-veil" data-intro-veil aria-hidden="true">
        {/* "XL" monoline signature: drawn stroke by stroke with DrawSVG. */}
        <svg className="intro-mark" data-intro-mark viewBox="0 0 240 140" width="240" height="140">
          <path d="M18 34C26 22 38 24 48 36C64 56 82 86 100 112" />
          <path d="M104 30C86 52 64 84 44 110C38 118 44 122 54 116C80 100 132 40 150 22C156 16 162 20 158 30C146 62 132 96 128 112C126 120 132 122 142 118C170 108 196 104 222 110" />
        </svg>
      </div>
      <div className="intro-panel" data-intro-panel aria-hidden="true">
        <p className="intro-tagline" data-intro-tagline>
          {TAGLINE}
        </p>
      </div>
      <button type="button" className="intro-skip" data-intro-skip>
        {t("skip")}
      </button>
    </div>
  );
}
