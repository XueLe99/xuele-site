import type { Project } from "./schema";

/** Add real projects here. Never add placeholder or invented entries. */
export const projects: Project[] = [];

export const publishedProjects = () => projects.filter((p) => p.published);

export const getProject = (slug: string) =>
  publishedProjects().find((p) => p.slug === slug);

export const projectSlugs = () => publishedProjects().map((p) => p.slug);
