import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/layout/PageShell";
import { resolveLocale } from "@/lib/locale";
import type { LabDemo } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lab">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({
    locale,
    path: "/lab",
    title: t("labTitle"),
    description: t("labDescription"),
  });
}

export default async function LabPage({ params }: PageProps<"/[locale]/lab">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "lab" });
  const demos = t.raw("demos") as LabDemo[];

  return (
    <PageShell title={t("title")} intro={t("intro")}>
      <div className="flex flex-col gap-16">
        {demos.map((demo, i) => (
          <section
            key={demo.id}
            id={demo.id}
            data-lab-demo={demo.id}
            aria-labelledby={`${demo.id}-title`}
          >
            <p className="t-eyebrow mb-2">
              {String(i + 1).padStart(2, "0")} / {demo.file}
            </p>
            <h2 id={`${demo.id}-title`} className="t-h2">
              {demo.title}
            </h2>
            <p className="t-body prose-measure mt-3 text-muted">{demo.explain}</p>

            {/*
              Demo slot. A later phase replaces the placeholder body with the
              Sandpack editor (client-only, loaded when scrolled into view).
            */}
            <div
              className="surface mt-6 overflow-hidden"
              data-demo-slot={demo.id}
            >
              <div className="term-bar" aria-hidden="true">
                <span className="term-dots">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="term-tab">{demo.file}</span>
              </div>
              <div className="flex min-h-48 flex-col justify-center gap-2 p-6 font-mono text-sm">
                <p className="text-muted">
                  <span aria-hidden="true" className="text-primary">
                    ${" "}
                  </span>
                  {demo.summary}
                </p>
                <p className="text-accent">
                  <span aria-hidden="true">{"// "}</span>
                  {t("placeholder")}
                </p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </PageShell>
  );
}
