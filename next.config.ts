import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Cache Components / Partial Prefetching are intentionally off: the site is
  // fully static (generateStaticParams), and classic SSG gives real 404 status
  // codes for unknown locales and slugs (see `dynamicParams` in the layout).
  experimental: {
    // src/app/global-not-found.tsx: 404 for URLs outside the [locale] root layout.
    globalNotFound: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withNextIntl(nextConfig);
