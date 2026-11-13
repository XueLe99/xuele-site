import { SHOW_BLOG, SHOW_PROJECTS } from "./flags";

/** Base URL, without trailing slash. A custom domain only needs the env var. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

export const EMAIL = "TAN6533@gmail.com";

export const RESUME = {
  zh: "/resume-zh.pdf",
  en: "/resume-en.pdf",
} as const;

export const THEME_COLOR = { dark: "#070A12", light: "#F6F5F1" } as const;

/** localStorage keys shared by the no-flash inline script and the client stores. */
export const STORAGE = { theme: "theme", fxOff: "fx-off" } as const;

export const FORMSPREE_ID = process.env.NEXT_PUBLIC_FORMSPREE_ID || "";

export type NavKey = "home" | "about" | "lab" | "contact" | "blog" | "projects";

export interface NavItem {
  key: NavKey;
  href: string;
}

/** Visible pages. Used by the header nav, the footer and the sitemap. */
export const NAV_ITEMS: NavItem[] = [
  { key: "home", href: "/" },
  { key: "about", href: "/about" },
  { key: "lab", href: "/lab" },
  { key: "contact", href: "/contact" },
  ...(SHOW_PROJECTS ? [{ key: "projects", href: "/projects" } as NavItem] : []),
  ...(SHOW_BLOG ? [{ key: "blog", href: "/blog" } as NavItem] : []),
];

export { SHOW_BLOG, SHOW_PROJECTS };
