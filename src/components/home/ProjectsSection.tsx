import { getTranslations } from "next-intl/server";
import { SHOW_PROJECTS } from "@/config";
import { publishedProjects } from "@/content/projects";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * Projects grid for the homepage. Hidden (renders nothing) unless
 * SHOW_PROJECTS is true and at least one project is published.
 */
export async function ProjectsSection({ locale }: { locale: Locale }) {
  if (!SHOW_PROJECTS) return null;
  const projects = publishedProjects();
  if (projects.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "projects" });

  return (
    <section
      id="projects"
      data-section="projects"
      aria-labelledby="projects-title"
      className="relative py-24 md:py-32"
    >
      <div className="container-site">
        <header className="mb-8 md:mb-12">
          <p className="t-eyebrow mb-2">{t("eyebrow")}</p>
          <h2 id="projects-title" data-heading-mask className="t-h1">
            {t("title")}
          </h2>
        </header>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.slug} className="flex">
              <Link
                href={`/projects/${project.slug}`}
                className="surface group flex w-full flex-col gap-3 p-6 hover:-translate-y-1 hover:border-primary"
              >
                {project.period && (
                  <p className="font-mono text-sm text-primary">{project.period}</p>
                )}
                <h3 className="t-h3">{project.title[locale]}</h3>
                <p className="t-small text-muted">{project.summary[locale]}</p>
                {project.tags.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <li key={tag} className="chip">
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
                <span className="mt-auto inline-flex items-center gap-2 pt-2 text-sm text-primary">
                  {t("view")}
                  <ArrowRightIcon className="group-hover:translate-x-1" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
