"use client";

import { useRef, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { NAV_ITEMS } from "@/config";
import { useFx } from "@/components/fx/FxProvider";
import {
  MenuIcon,
  MoonIcon,
  SparklesIcon,
  SparklesOffIcon,
  SunIcon,
} from "@/components/ui/icons";
import { Link, usePathname } from "@/i18n/navigation";
import { rememberLocale } from "@/i18n/locale-cookie";
import type { Locale } from "@/i18n/routing";
import { setTheme, useTheme } from "@/lib/prefs";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavLinks({
  orientation = "horizontal",
  onNavigate,
}: {
  orientation?: "horizontal" | "vertical";
  onNavigate?: () => void;
}) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const vertical = orientation === "vertical";

  return (
    <ul className={vertical ? "flex flex-col" : "flex items-center gap-1"}>
      {NAV_ITEMS.map(({ key, href }) => {
        const active = isActive(pathname, href);
        return (
          <li key={key}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={[
                "flex h-11 items-center rounded-full px-3 text-[15px] whitespace-nowrap",
                vertical ? "px-4" : "",
                active
                  ? "font-medium text-text"
                  : "text-muted hover:text-text",
              ].join(" ")}
            >
              {t(key)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** 中 / EN. Plain links (crawlable); the click also stores NEXT_LOCALE. */
export function LocaleSwitch() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  const options: { locale: Locale; text: string; label: string; lang: string }[] = [
    { locale: "zh", text: "中", label: t("switchToZh"), lang: "zh-CN" },
    { locale: "en", text: "EN", label: t("switchToEn"), lang: "en" },
  ];

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="flex items-center font-mono text-sm"
    >
      {options.map((o, i) => (
        <span key={o.locale} className="flex items-center">
          {i > 0 && (
            <span aria-hidden="true" className="text-border">
              /
            </span>
          )}
          <Link
            href={pathname}
            locale={o.locale}
            lang={o.lang}
            hrefLang={o.lang}
            aria-label={o.label}
            aria-current={locale === o.locale ? "true" : undefined}
            onClick={() => rememberLocale(o.locale)}
            className={[
              "flex h-11 min-w-9 items-center justify-center px-1.5",
              locale === o.locale
                ? "font-medium text-text"
                : "text-muted hover:text-primary",
            ].join(" ")}
          >
            {o.text}
          </Link>
        </span>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const t = useTranslations("nav");
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? t("themeToLight") : t("themeToDark");

  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      title={label}
      onClick={() => setTheme(next)}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/** "Effects off" toggle. Pressed = effects disabled (persisted as localStorage "fx-off"). */
export function FxToggle({ showLabel = false }: { showLabel?: boolean }) {
  const t = useTranslations("nav");
  const { fxOff, toggleFx } = useFx();

  return (
    <button
      type="button"
      className={`icon-btn ${showLabel ? "px-3" : ""}`}
      aria-pressed={fxOff}
      aria-label={showLabel ? undefined : t("fxOff")}
      title={t("fxOffHint")}
      onClick={toggleFx}
    >
      {fxOff ? <SparklesOffIcon /> : <SparklesIcon />}
      {showLabel && <span className="text-sm whitespace-nowrap">{t("fxOff")}</span>}
    </button>
  );
}

/** Compact menu for small screens. <details> keeps it usable before hydration. */
export function MobileMenu({ children }: { children?: ReactNode }) {
  const t = useTranslations("nav");
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <details
      ref={ref}
      className="group lg:hidden"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
      }}
    >
      <summary className="icon-btn" aria-label={t("menu")}>
        <MenuIcon />
      </summary>
      <div className="absolute inset-x-0 top-full hidden border-b border-border bg-surface-solid shadow-lg group-open:block">
        <nav aria-label={t("main")} className="container-site py-3">
          <NavLinks orientation="vertical" onNavigate={close} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
            <FxToggle showLabel />
            <span onClick={close}>{children}</span>
          </div>
        </nav>
      </div>
    </details>
  );
}
