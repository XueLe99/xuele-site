import { useLocale, useTranslations } from "next-intl";
import { RESUME } from "@/config";
import { DownloadIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import {
  FxToggle,
  LocaleSwitch,
  MobileMenu,
  NavLinks,
  ThemeToggle,
} from "./header-controls";

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();

  const resume = (
    <a href={RESUME[locale]} download className="btn btn-primary btn-sm">
      <DownloadIcon />
      {t("resume")}
    </a>
  );

  return (
    <header
      className="sticky top-0 z-40 h-(--header-h) border-b border-border bg-[color-mix(in_srgb,var(--bg)_72%,transparent)] backdrop-blur-md"
      data-site-header
    >
      <div className="container-site relative flex h-full items-center justify-between gap-2">
        <Link
          href="/"
          aria-label={t("logoLabel")}
          className={`flex h-11 items-center text-[17px] font-bold whitespace-nowrap hover:text-primary ${
            locale === "en" ? "font-display" : "tracking-[0.04em]"
          }`}
        >
          {t("logo")}
        </Link>

        <nav aria-label={t("main")} className="hidden lg:block">
          <NavLinks />
        </nav>

        <div className="flex items-center gap-1">
          <LocaleSwitch />
          <ThemeToggle />
          <div className="hidden items-center gap-2 lg:flex">
            <FxToggle showLabel />
            {resume}
          </div>
          <MobileMenu>{resume}</MobileMenu>
        </div>
      </div>
    </header>
  );
}
