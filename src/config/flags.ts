/**
 * Feature flags. Both default to false.
 * Set NEXT_PUBLIC_SHOW_BLOG=true / NEXT_PUBLIC_SHOW_PROJECTS=true to enable.
 * When false: routes call notFound(), links are left out of the nav and the
 * sitemap, and <ProjectsSection> is not rendered on the homepage.
 */
export const SHOW_BLOG = process.env.NEXT_PUBLIC_SHOW_BLOG === "true";
export const SHOW_PROJECTS = process.env.NEXT_PUBLIC_SHOW_PROJECTS === "true";
