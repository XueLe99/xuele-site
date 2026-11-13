import type { Locale } from "@/i18n/routing";

/** A value available in every locale. */
export type Localized<T = string> = Record<Locale, T>;

export interface ContentLink {
  label: Localized;
  href: string;
}

/** A project entry (src/content/projects.ts). Shown only when SHOW_PROJECTS is true. */
export interface Project {
  /** URL segment: /[locale]/projects/[slug] */
  slug: string;
  title: Localized;
  summary: Localized;
  /** Paragraphs of the detail page. */
  body: Localized<string[]>;
  tags: string[];
  /** Free-form period, e.g. "2025". */
  period?: string;
  links?: ContentLink[];
  /** Unpublished entries never get a page or a card. */
  published: boolean;
}

/** A blog post (src/content/blog.ts). Shown only when SHOW_BLOG is true. */
export interface BlogPost {
  /** URL segment: /[locale]/blog/[slug] */
  slug: string;
  title: Localized;
  summary: Localized;
  /** Paragraphs of the post. */
  body: Localized<string[]>;
  /** ISO date, e.g. "2026-01-31". */
  date: string;
  tags: string[];
  published: boolean;
}
