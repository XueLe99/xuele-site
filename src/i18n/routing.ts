import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["zh", "en"],
  defaultLocale: "zh",
  // Every URL carries its locale: `/` redirects to `/zh`.
  localePrefix: "always",
  // No Accept-Language sniffing and no cookie-based redirect: first visit is always zh.
  localeDetection: false,
  // The proxy neither reads nor writes a locale cookie. NEXT_LOCALE is written
  // by the 中/EN switch only (src/i18n/locale-cookie.ts).
  localeCookie: false,
  // hreflang is emitted through generateMetadata instead of Link headers.
  alternateLinks: false,
});

export type Locale = (typeof routing.locales)[number];

/** Value for <html lang>. */
export const HTML_LANG: Record<Locale, string> = { zh: "zh-CN", en: "en" };

/** Cookie written by the 中/EN switch to remember the explicit choice. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
