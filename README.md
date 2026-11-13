# 陈学礼 / Westly Tan Xue Le — personal website

Bilingual (中文 / English) personal site for recruiters and headhunters.
All copy comes from the approved site copy; nothing on the site is invented.

> **Status: phase 1** — scaffold, i18n, design tokens, layout, all pages with
> real text, SEO. The starfield, scroll animations and the interactive lab demos
> come in later phases; their slots are already in place (see
> [Slots for later phases](#slots-for-later-phases)).

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind CSS v4**
- **next-intl** — locales `zh` (default) and `en`, always-prefixed URLs
- Fonts via `next/font/google`: Noto Sans SC (400/500/700), Geist, Geist Mono, Syne
- Fully statically generated (`generateStaticParams` + `setRequestLocale`)

## Scripts

| Command         | What it does                         |
| --------------- | ------------------------------------ |
| `npm run dev`   | Dev server on http://localhost:3000  |
| `npm run build` | Production build (static generation) |
| `npm run start` | Serve the production build           |
| `npm run lint`  | ESLint                               |

## Environment variables

Copy `.env.example` to `.env.local`. There are no secrets.

| Variable                    | Default                 | Purpose                                                                 |
| --------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`      | `http://localhost:3000` | Base URL for canonical/hreflang, sitemap, robots, OG image and JSON-LD. |
| `NEXT_PUBLIC_SHOW_BLOG`     | `false`                 | Feature flag `SHOW_BLOG`.                                               |
| `NEXT_PUBLIC_SHOW_PROJECTS` | `false`                 | Feature flag `SHOW_PROJECTS`.                                           |
| `NEXT_PUBLIC_FORMSPREE_ID`  | _(unset)_               | Optional. The contact form is rendered only when set.                   |

`NEXT_PUBLIC_*` values are inlined at build time: change them, then rebuild.

## Feature flags

Defined in `src/config/flags.ts` as `SHOW_BLOG` and `SHOW_PROJECTS`.
While a flag is `false`:

- `/[locale]/blog`, `/[locale]/blog/[slug]`, `/[locale]/projects`,
  `/[locale]/projects/[slug]` respond with 404 (`notFound()`),
- the section is not in the header/footer nav and not in `sitemap.xml`,
- `<ProjectsSection>` renders nothing on the homepage.

The content schema lives in `src/content/schema.ts`; add entries to
`src/content/projects.ts` / `src/content/blog.ts` (both empty — real content only).

## i18n

- `messages/zh.json` and `messages/en.json` hold all copy (same key structure;
  `zh.json` is the type source, see `src/global.d.ts`).
- `/` always redirects to `/zh`. There is no browser-language detection
  (`localeDetection: false`).
- The 中 / EN switch writes the `NEXT_LOCALE` cookie (1 year) to record the
  explicit choice. The proxy does not read it, so `/` stays `/zh`.
- Routing config: `src/i18n/routing.ts`; the proxy (Next.js 16's name for
  middleware) is `src/proxy.ts`.

## Theme and effects

- Design tokens are CSS variables in `src/app/globals.css` (`:root` = dark,
  `.light` = light) and are exposed to Tailwind through `@theme inline`
  (`bg-bg`, `bg-surface`, `text-text`, `text-muted`, `text-primary`,
  `text-accent`, `border-border`, …).
- Class strategy: `<html class="dark">` by default. A blocking inline script
  (`src/lib/no-flash.ts`) applies the stored theme before first paint and keeps
  `<meta name="theme-color">` in sync.
- **Effects off** toggle: persisted in `localStorage["fx-off"]` (`"1"` = off),
  mirrored as `<html data-fx="off">`. Read it in client components with
  `useFx()` from `src/components/fx/FxProvider.tsx`.

## Slots for later phases

| Hook                                                        | Where                                 | For                               |
| ----------------------------------------------------------- | ------------------------------------- | --------------------------------- |
| `[data-starfield-slot]` inside `<Background />`             | `src/components/background`           | WebGL / Canvas-2D starfield       |
| `#act-0 … #act-5` with `data-act="act-N"`, `data-act-name`  | `src/components/home/Act.tsx`         | ScrollTrigger scenes              |
| `[data-hero-line]`, `[data-hero-chip]`, `[data-scroll-hint]` | `Hero.tsx`                            | Hero entrance                     |
| `[data-phrase]`                                             | `WhoIAm.tsx`                          | Phrase light-up on scroll         |
| `[data-constellation-line]`, `[data-star]`, `[data-star-chip]` | `Constellation.tsx`, `Skills.tsx`  | Constellation draw + hover        |
| `[data-timeline-line]`, `[data-timeline-node]`, `[data-timeline-item]` | `Experience.tsx`           | Star-trail timeline               |
| `[data-magnetic]`, `[data-contact-target]`                  | `ContactAct.tsx`                      | Magnetic button, star gathering   |
| `[data-demo-slot="low-light" \| "kernel" \| "pathfinding"]` | `src/app/[locale]/lab/page.tsx`       | Sandpack demos                    |

Everything is visible and complete without these enhancements.

## SEO

- Per-locale `generateMetadata` with canonical + hreflang (`zh`, `en`,
  `x-default` → zh): `src/lib/seo.ts`
- `<html lang="zh-CN">` / `<html lang="en">`
- `src/app/sitemap.ts` (both locales, visible pages only), `src/app/robots.ts`
- `src/app/[locale]/opengraph-image.tsx` (English-only text, generated at build)
- JSON-LD `Person`: `src/components/seo/PersonJsonLd.tsx`

## Notes on Next.js configuration

`create-next-app` enables `cacheComponents` / `partialPrefetching` by default.
They are turned off in `next.config.ts` on purpose: this site is fully static,
and with classic static generation unknown locales and unknown slugs return a
real HTTP 404 (`dynamicParams = false` on the locale layout) instead of a
streamed 200 shell.

`experimental.globalNotFound` is on so that `src/app/global-not-found.tsx`
(bilingual) handles URLs outside `/zh` and `/en`; `src/app/[locale]/not-found.tsx`
is the localized 404.

## Deploying to Vercel

1. Import the repository in Vercel (framework preset: Next.js, default build settings).
2. Set `NEXT_PUBLIC_SITE_URL` to the production URL (for example the
   `*.vercel.app` URL, later the custom domain) for the Production environment.
3. Optionally set the flags and `NEXT_PUBLIC_FORMSPREE_ID`.
4. Deploy. When a custom domain is added, update `NEXT_PUBLIC_SITE_URL` and redeploy —
   nothing else changes.

## Project structure

```
messages/                  zh.json, en.json — all copy
public/                    resume-zh.pdf, resume-en.pdf
src/
  proxy.ts                 next-intl locale routing ("/" → "/zh")
  global.d.ts              next-intl type augmentation
  config/                  flags.ts, site.ts (URL, email, nav items, storage keys)
  i18n/                    routing.ts, navigation.ts, request.ts, locale-cookie.ts
  lib/                     seo.ts, locale.ts, prefs.ts (theme/fx stores), no-flash.ts, messages.ts
  content/                 schema.ts, projects.ts, blog.ts
  components/
    background/            Background.tsx (static poster + starfield slot), poster-stars.ts
    fx/                    FxProvider.tsx (useFx)
    layout/                Header.tsx, header-controls.tsx, Footer.tsx, PageShell.tsx
    home/                  Act, Hero, WhoIAm, Skills, Constellation, Experience,
                           LabPreview, ContactAct, ProjectsSection
    seo/                   PersonJsonLd.tsx
    ui/                    CopyEmailButton.tsx, Terminal404.tsx, icons.tsx
  app/
    globals.css            tokens, type scale, components, background poster
    fonts.ts               next/font definitions
    global-not-found.tsx   bilingual 404 outside /[locale]
    sitemap.ts, robots.ts
    [locale]/
      layout.tsx           root layout: <html lang>, theme script, header, footer
      page.tsx             homepage, acts 0–5
      about/ lab/ contact/
      blog/ blog/[slug]/ projects/ projects/[slug]/   (flag-gated)
      [...rest]/           unknown paths → localized 404
      not-found.tsx        terminal-style 404
      opengraph-image.tsx
```
