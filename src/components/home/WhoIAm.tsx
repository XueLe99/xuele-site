import { getTranslations } from "next-intl/server";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Act, ActHeading } from "./Act";

/**
 * Act 1. The paragraph is split into phrases (`data-phrase`) so a later phase
 * can light them up from muted to text colour on scroll. Static = fully lit.
 */
export async function WhoIAm({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "who" });
  const phrases = t.raw("phrases") as string[];
  const joiner = locale === "en" ? " " : "";

  return (
    <Act name="who" labelledBy="who-title" className="py-24 md:py-32">
      <ActHeading id="who-title" eyebrow={t("eyebrow")} title={t("title")} />
      <p
        data-phrases
        className="max-w-3xl text-[20px] leading-[1.8] md:text-[24px] md:leading-[1.7]"
      >
        {phrases.map((phrase, i) => (
          <span key={i} data-phrase={i}>
            {i > 0 ? joiner : ""}
            {phrase}
          </span>
        ))}
      </p>
      <Link
        href="/about"
        className="link mt-8 inline-flex h-11 items-center gap-2"
      >
        {t("more")}
        <ArrowRightIcon />
      </Link>
    </Act>
  );
}
