import type { Metadata } from "next";
import { SITE_URL } from "@/config";
import { routing, type Locale } from "@/i18n/routing";

const OG_LOCALE: Record<Locale, string> = { zh: "zh_CN", en: "en_US" };

/** Absolute URL of `path` ("" for home, "/about" …) in `locale`. */
export function localeUrl(locale: Locale, path = ""): string {
  return `${SITE_URL}/${locale}${path === "/" ? "" : path}`;
}

/** hreflang map: zh, en and x-default (= zh). */
export function languageAlternates(path = ""): Record<string, string> {
  return {
    ...Object.fromEntries(routing.locales.map((l) => [l, localeUrl(l, path)])),
    "x-default": localeUrl(routing.defaultLocale, path),
  };
}

export function pageMetadata({
  locale,
  path = "",
  title,
  description,
  absoluteTitle = false,
}: {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  absoluteTitle?: boolean;
}): Metadata {
  const url = localeUrl(locale, path);
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: routing.locales
        .filter((l) => l !== locale)
        .map((l) => OG_LOCALE[l]),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
