import { getTranslations } from "next-intl/server";
import { EMAIL, RESUME } from "@/config";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { DownloadIcon, MailIcon } from "@/components/ui/icons";
import type { Locale } from "@/i18n/routing";
import { Act, Eyebrow } from "./Act";

/** Act 5. `[data-magnetic]` marks the primary button for the magnetic hover (HomeFx). */
export async function ContactAct({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "contact" });
  const c = await getTranslations({ locale, namespace: "common" });

  return (
    <Act name="contact" labelledBy="contact-title" className="py-24 md:py-40">
      <Eyebrow text={t("eyebrow")} />
      <h2
        id="contact-title"
        data-heading-mask
        className={`t-display ${locale === "en" ? "font-display" : ""}`}
      >
        {t("big")}
      </h2>
      <p className="t-body prose-measure mt-6 text-muted">{t("body")}</p>

      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href={RESUME[locale]}
          download
          data-magnetic
          data-contact-target
          className="btn btn-primary"
        >
          <DownloadIcon />
          {c("downloadResume")}
        </a>
        <a href={`mailto:${EMAIL}`} className="btn btn-secondary">
          <MailIcon />
          <span className="font-mono">{EMAIL}</span>
        </a>
        <CopyEmailButton
          email={EMAIL}
          label={c("copyEmail")}
          copiedLabel={c("copied")}
        />
      </div>

      <dl className="t-small mt-10 flex flex-wrap gap-x-10 gap-y-4 text-muted">
        <div>
          <dt className="font-mono text-xs tracking-widest uppercase">
            {t("locationLabel")}
          </dt>
          <dd className="text-text">{t("location")}</dd>
        </div>
        <div>
          <dt className="font-mono text-xs tracking-widest uppercase">
            {t("timezoneLabel")}
          </dt>
          <dd className="text-text">{t("timezone")}</dd>
        </div>
      </dl>
    </Act>
  );
}
