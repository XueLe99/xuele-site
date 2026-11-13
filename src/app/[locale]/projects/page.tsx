import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/layout/PageShell";
import { SHOW_PROJECTS } from "@/config";
import { publishedProjects } from "@/content/projects";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/projects">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  if (!SHOW_PROJECTS) return { robots: { index: false } };
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({
    locale,
    path: "/projects",
    title: t("projectsTitle"),
    description: t("projectsDescription"),
  });
}

export default async function ProjectsPage({
  params,
}: PageProps<"/[locale]/projects">) {
  const locale = await resolveLocale(params);
  if (!SHOW_PROJECTS) notFound();

  const t = await getTranslations({ locale, namespace: "projects" });
  const projects = publishedProjects();

  return (
    <PageShell title={t("title")}>
      {projects.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.slug} className="flex">
              <Link
                href={`/projects/${project.slug}`}
                className="surface flex w-full flex-col gap-2 p-6 hover:border-primary"
              >
                {project.period && (
                  <p className="font-mono text-sm text-primary">{project.period}</p>
                )}
                <h2 className="t-h3">{project.title[locale]}</h2>
                <p className="t-small text-muted">{project.summary[locale]}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
