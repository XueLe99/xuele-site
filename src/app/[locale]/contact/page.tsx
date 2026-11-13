import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/layout/PageShell";
import { CopyEmailButton } from "@/components/ui/CopyEmailButton";
import { DownloadIcon, MailIcon } from "@/components/ui/icons";
import { EMAIL, FORMSPREE_ID, RESUME } from "@/config";
import { resolveLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({
    locale,
    path: "/contact",
    title: t("contactTitle"),
    description: t("contactDescription"),
  });
}

const fieldClass =
  "min-h-11 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text placeholder:text-muted";

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "contact" });
  const c = await getTranslations({ locale, namespace: "common" });

  return (
    <PageShell
      title={t("big")}
      intro={t("body")}
      displayFont={locale === "en"}
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="surface p-6 md:p-8" aria-label={t("title")}>
          <dl className="flex flex-col gap-6">
            <div>
              <dt className="t-eyebrow">{t("emailLabel")}</dt>
              <dd className="mt-1">
                <a
                  href={`mailto:${EMAIL}`}
                  className="link font-mono text-lg break-all"
                >
                  {EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="t-eyebrow">{t("locationLabel")}</dt>
              <dd className="mt-1">{t("location")}</dd>
            </div>
            <div>
              <dt className="t-eyebrow">{t("timezoneLabel")}</dt>
              <dd className="mt-1">{t("timezone")}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={`mailto:${EMAIL}`} className="btn btn-primary">
              <MailIcon />
              {c("sendEmail")}
            </a>
            <CopyEmailButton
              email={EMAIL}
              label={c("copyEmail")}
              copiedLabel={c("copied")}
            />
          </div>
        </section>

        <section className="surface p-6 md:p-8" aria-labelledby="contact-resume">
          <h2 id="contact-resume" className="t-h2">
            {t("resumeLabel")}
          </h2>
          <ul className="mt-6 flex flex-col items-start gap-3">
            <li>
              <a href={RESUME.zh} download className="btn btn-secondary">
                <DownloadIcon />
                {c("resumeZh")}
              </a>
            </li>
            <li>
              <a href={RESUME.en} download className="btn btn-secondary">
                <DownloadIcon />
                {c("resumeEn")}
              </a>
            </li>
          </ul>
        </section>

        {/* Optional: rendered only when NEXT_PUBLIC_FORMSPREE_ID is set. */}
        {FORMSPREE_ID && (
          <section
            className="surface p-6 md:p-8 lg:col-span-2"
            aria-labelledby="contact-form"
          >
            <h2 id="contact-form" className="t-h2">
              {t("formTitle")}
            </h2>
            <form
              action={`https://formspree.io/f/${FORMSPREE_ID}`}
              method="POST"
              className="mt-6 grid gap-4 md:grid-cols-2"
            >
              <label className="t-small flex flex-col gap-1">
                {t("formName")}
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className={fieldClass}
                />
              </label>
              <label className="t-small flex flex-col gap-1">
                {t("formEmail")}
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={fieldClass}
                />
              </label>
              <label className="t-small flex flex-col gap-1 md:col-span-2">
                {t("formMessage")}
                <textarea name="message" rows={6} required className={fieldClass} />
              </label>
              <div className="md:col-span-2">
                <button type="submit" className="btn btn-primary">
                  {t("formSubmit")}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </PageShell>
  );
}
