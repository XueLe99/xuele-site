import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CodeSnippet } from "@/components/lab/CodeSnippet";
import { DemoSlot } from "@/components/lab/DemoSlot";
import { LabBackdrop } from "@/components/lab/LabBackdrop";
import { PageShell } from "@/components/layout/PageShell";
import { CORE_SOURCE, isDemoId } from "@/lab/demos/core";
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
      <LabBackdrop />
      <div className="flex flex-col gap-16">
        {demos.map((demo, i) => (
          <section
            key={demo.id}
            id={demo.id}
            className="scroll-mt-24"
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

            {isDemoId(demo.id) && (
              <DemoSlot
                demo={demo.id}
                locale={locale}
                file={demo.file}
                labels={{
                  load: t("load"),
                  loading: t("loading"),
                  preview: t("static"),
                  viewSource: t("viewSource"),
                  hideSource: t("hideSource"),
                  viewOnGitHub: t("viewOnGitHub"),
                }}
              >
                <CodeSnippet code={CORE_SOURCE[demo.id]} />
              </DemoSlot>
            )}
          </section>
        ))}
      </div>
      <p className="t-small mt-12 text-muted">{t("network")}</p>
    </PageShell>
  );
}
