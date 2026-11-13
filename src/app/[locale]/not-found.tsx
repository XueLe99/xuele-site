"use client";

import { useTranslations } from "next-intl";
import { Terminal404, cdHomeClass } from "@/components/ui/Terminal404";
import { Link } from "@/i18n/navigation";

/**
 * Localized 404, rendered inside the locale layout. A client component so the
 * locale comes from NextIntlClientProvider and the page stays static.
 */
export default function LocaleNotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="container-site flex min-h-[60svh] items-center justify-center py-16">
      <Terminal404
        text={{
          title: t("title"),
          windowTitle: t("windowTitle"),
          command: t("command"),
          error: t("error"),
          status: t("status"),
          hint: t("hint"),
        }}
        home={
          <Link href="/" aria-label={`cd ~ (${t("homeLabel")})`} className={cdHomeClass}>
            cd ~
          </Link>
        }
      />
    </div>
  );
}
