import { useTranslations } from "next-intl";
import { EMAIL, NAV_ITEMS } from "@/config";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations();

  return (
    <footer className="mt-24 border-t border-border bg-[color-mix(in_srgb,var(--bg)_72%,transparent)]">
      <div className="container-site flex flex-col gap-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="t-small text-muted">
          <p className="text-text">{t("footer.copyright")}</p>
          <p>{t("footer.location")}</p>
        </div>
        <nav aria-label={t("nav.main")}>
          <ul className="-mx-3 flex flex-wrap items-center">
            {NAV_ITEMS.map(({ key, href }) => (
              <li key={key}>
                <Link
                  href={href}
                  className="t-small flex h-11 items-center px-3 text-muted hover:text-text"
                >
                  {t(`nav.${key}`)}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${EMAIL}`}
                className="t-small flex h-11 items-center px-3 font-mono text-muted hover:text-primary"
              >
                {EMAIL}
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
