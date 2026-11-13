import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/layout/PageShell";
import { RESUME } from "@/config";
import { DownloadIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/lib/locale";
import type { ExperienceItem } from "@/lib/messages";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({
    locale,
    path: "/about",
    title: t("aboutTitle"),
    description: t("aboutDescription"),
  });
}

function EntryList({ items }: { items: ExperienceItem[] }) {
  return (
    <ul className="flex flex-col gap-6">
      {items.map((item) => (
        <li key={item.id}>
          <p className="font-mono text-sm text-primary">{item.date}</p>
          <p className="font-medium">
            {item.role}
            <span className="font-normal text-muted"> · {item.org}</span>
          </p>
          <p className="t-small mt-1 text-muted">{item.body}</p>
        </li>
      ))}
    </ul>
  );
}

export default async function AboutPage({
  params,
}: PageProps<"/[locale]/about">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "about" });
  const e = await getTranslations({ locale, namespace: "experience" });
  const c = await getTranslations({ locale, namespace: "common" });
  const n = await getTranslations({ locale, namespace: "nav" });

  const paragraphs = t.raw("paragraphs") as string[];
  const languages = t.raw("languages") as string[];
  const items = e.raw("items") as ExperienceItem[];
  const education = items.filter((i) => i.kind === "education");
  const work = items.filter((i) => i.kind === "work");

  return (
    <PageShell title={t("title")}>
      <div className="grid gap-16 lg:grid-cols-[minmax(0,700px)_1fr]">
        <article className="prose-measure flex flex-col gap-6">
          {paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? "t-h3 font-medium" : "t-body"}>
              {p}
            </p>
          ))}
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={RESUME[locale]} download className="btn btn-primary">
              <DownloadIcon />
              {c("downloadResume")}
            </a>
            <Link href="/contact" className="btn btn-secondary">
              {n("contact")}
            </Link>
          </div>
        </article>

        <aside className="flex flex-col gap-10">
          <section aria-labelledby="about-work">
            <h2 id="about-work" className="t-h2 mb-4">
              {e("workTitle")}
            </h2>
            <EntryList items={work} />
          </section>
          <section aria-labelledby="about-education">
            <h2 id="about-education" className="t-h2 mb-4">
              {e("educationTitle")}
            </h2>
            <EntryList items={education} />
          </section>
          <section aria-labelledby="about-languages">
            <h2 id="about-languages" className="t-h2 mb-4">
              {t("languagesTitle")}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {languages.map((language) => (
                <li key={language} className="chip">
                  {language}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </PageShell>
  );
}
