import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/layout/PageShell";
import { SHOW_PROJECTS } from "@/config";
import { getProject, projectSlugs } from "@/content/projects";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return projectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/projects/[slug]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const project = SHOW_PROJECTS ? getProject(slug) : undefined;
  if (!project) return { robots: { index: false } };
  return pageMetadata({
    locale,
    path: `/projects/${project.slug}`,
    title: project.title[locale],
    description: project.summary[locale],
  });
}

export default async function ProjectPage({
  params,
}: PageProps<"/[locale]/projects/[slug]">) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const project = SHOW_PROJECTS ? getProject(slug) : undefined;
  if (!project) notFound();

  const t = await getTranslations({ locale, namespace: "projects" });

  return (
    <PageShell title={project.title[locale]} intro={project.summary[locale]}>
      <article className="prose-measure flex flex-col gap-6">
        {project.period && (
          <p className="font-mono text-sm text-primary">{project.period}</p>
        )}
        {project.body[locale].map((paragraph, i) => (
          <p key={i} className="t-body">
            {paragraph}
          </p>
        ))}
        {project.tags.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <li key={tag} className="chip">
                {tag}
              </li>
            ))}
          </ul>
        )}
        {project.links && project.links.length > 0 && (
          <ul className="flex flex-wrap gap-4">
            {project.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="link" rel="noopener noreferrer">
                  {link.label[locale]}
                </a>
              </li>
            ))}
          </ul>
        )}
        <Link href="/projects" className="link mt-4 inline-flex h-11 items-center">
          {t("back")}
        </Link>
      </article>
    </PageShell>
  );
}
