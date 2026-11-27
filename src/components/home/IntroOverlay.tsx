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
          <path id="xl" d="M22,34 C40,52 70,92 96,118 M96,30 C78,54 52,86 30,116 C46,104 70,96 96,112 C112,120 126,108 132,90 L150,26 C146,62 140,94 138,116 C160,112 190,110 218,114" />
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
