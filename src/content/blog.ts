import type { BlogPost } from "./schema";

/** Add real posts here. Never add placeholder or invented entries. */
export const posts: BlogPost[] = [];

export const publishedPosts = () =>
  posts
    .filter((p) => p.published)
    .sort((a, b) => b.date.localeCompare(a.date));

export const getPost = (slug: string) =>
  publishedPosts().find((p) => p.slug === slug);

export const postSlugs = () => publishedPosts().map((p) => p.slug);
