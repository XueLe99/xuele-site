import { LOCALE_COOKIE, type Locale } from "./routing";

/** Remembers the visitor's explicit language choice (中/EN switch) for one year. */
export function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}
