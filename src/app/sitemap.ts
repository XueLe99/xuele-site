import type { MetadataRoute } from "next";
import { NAV_ITEMS, SHOW_BLOG, SHOW_PROJECTS } from "@/config";
import { publishedPosts } from "@/content/blog";
import { publishedProjects } from "@/content/projects";
import { routing } from "@/i18n/routing";
import { languageAlternates, localeUrl } from "@/lib/seo";

/** Both locales, visible pages only (flagged-off sections are excluded). */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...NAV_ITEMS.map((item) => (item.href === "/" ? "" : item.href)),
    ...(SHOW_PROJECTS ? publishedProjects().map((p) => `/projects/${p.slug}`) : []),
    ...(SHOW_BLOG ? publishedPosts().map((p) => `/blog/${p.slug}`) : []),
  ];

  return paths.flatMap((path) =>
    routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : 0.7,
      alternates: { languages: languageAlternates(path) },
    })),
  );
}
