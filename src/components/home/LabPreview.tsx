import { getTranslations } from "next-intl/server";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { LabDemo } from "@/lib/messages";
import { Act, ActHeading } from "./Act";

/** Act 4. Static preview: lab intro + three terminal-tab cards linking to /lab. */
export async function LabPreview({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "lab" });
  const demos = t.raw("demos") as LabDemo[];

  return (
    <Act name="lab" labelledBy="lab-title" className="py-24 md:py-32">
      <ActHeading id="lab-title" eyebrow={t("eyebrow")} title={t("title")} />
      <p className="t-body prose-measure text-muted">{t("intro")}</p>

      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {demos.map((demo) => (
          <li key={demo.id} data-lab-card={demo.id} className="flex">
            <Link
              href={`/lab#${demo.id}`}
              className="surface group flex w-full flex-col overflow-hidden hover:-translate-y-1 hover:border-primary"
            >
              <div className="term-bar" aria-hidden="true">
                <span className="term-dots">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="term-tab">{demo.file}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-6">
                <h3 className="t-h3">{demo.title}</h3>
                <p className="t-small text-muted">{demo.summary}</p>
                <span className="mt-auto inline-flex items-center gap-2 pt-2 font-mono text-sm text-primary">
                  <span aria-hidden="true">$</span>
                  {t("open")}
                  <ArrowRightIcon className="group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/lab" className="link mt-8 inline-flex h-11 items-center gap-2">
        {t("viewAll")}
        <ArrowRightIcon />
      </Link>
    </Act>
  );
}
