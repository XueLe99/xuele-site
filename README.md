# 陈学礼 / Westly Tan Xue Le — personal website

Bilingual (中文 / English) personal site for recruiters and headhunters.
All copy comes from the approved site copy; nothing on the site is invented.

> **Status: phase 3** — phase 1 (scaffold, i18n, design tokens, layout, pages,
> SEO), phase 2 (starry-sky background, homepage scroll storytelling) and the
> three editable [lab demos](#lab-demos) on `/[locale]/lab`.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind CSS v4**
- **next-intl** — locales `zh` (default) and `en`, always-prefixed URLs
- **three + @react-three/fiber** (WebGL starfield), **GSAP ScrollTrigger**,
  **Lenis**, **Motion** — all loaded with dynamic `import()` after window load
  + idle; none of them is in the first-load JS
- **@codesandbox/sandpack-react** — the editable lab demos; a separate chunk
  that only the lab page requests, and only when a demo scrolls into view
- **shiki** — build-time syntax highlighting of the static code placeholders
  (server component only; never shipped to the browser)
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

## Background (starry sky)

`<Background />` server-renders the static poster (CSS gradients + an inline-SVG
star tile; a dot grid in light mode). `<BackgroundLive />` then picks a tier on
the client and fades it in above the poster over 600ms — the poster always
stays underneath, so there is never a black block.

| Tier     | When                                                                                         | What                                                                 |
| -------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `poster` | SSR default; reduced motion, effects off, `saveData`, light theme, every page except home    | Static, no JS                                                        |
| `lite`   | <768px, or no fine pointer, or no WebGL, or `hardwareConcurrency ≤ 4`                        | Canvas 2D: 150 stars / 2 layers, scroll parallax, 30fps              |
| `webgl`  | Desktop otherwise                                                                            | R3F: 3 `Points` layers, fbm nebula, meteors, dpr ≤ 1.5, ~30fps       |

The tier is re-evaluated when the effects toggle, the theme or a media query
changes (`data-tier` on `[data-starfield-slot]` shows the current one). Live
tiers are imported only after `load` + `requestIdleCallback`
(`src/lib/after-load.ts`). The scene itself is plain three.js in
`src/components/background/sky-scene.ts`; `StarfieldWebGL.tsx` is the R3F
canvas with `frameloop="demand"` and a throttled invalidate loop that stops
while the tab is hidden.

Scroll linkage goes through `src/lib/sky-store.ts` (a plain mutable object,
written by ScrollTrigger, read once per frame): `push` (act 1, camera z
0 → -40, near stars stretch ≤1.5x), `dim` (act 4, brightness 40%, nebula and
meteors paused), `gather` (act 5, stars drift toward `[data-contact-target]`).

## Scroll storytelling

`src/components/home/HomeFx.tsx` (client, renders nothing) enhances the
server-rendered acts. The SSR HTML is the final state; with reduced motion or
effects off nothing runs.

| Act | Effect                                                                                          | Tech                          |
| --- | ----------------------------------------------------------------------------------------------- | ----------------------------- |
| 0   | Mask-reveal lines (500ms / 80ms stagger), chips fade (40ms stagger)                             | CSS only (`globals.css`)      |
| 1   | Phrases light up muted → text (`--lit`), camera push                                            | ScrollTrigger scrub           |
| 2   | Constellation lines draw (600ms), stars light accent; chip ↔ star hover highlight               | Motion `inView` + `animate`   |
| 3   | Star-trail line `scaleY` scrub, nodes light when reached, entries fade + rise 16px              | ScrollTrigger + CSS           |
| 4   | Stars dim                                                                                       | ScrollTrigger → sky store     |
| 5   | Stars gather; magnetic primary button (≤6px)                                                    | ScrollTrigger, pointer events |

Lenis smooth scrolling runs on the homepage for desktop fine pointers only and
is driven by the GSAP ticker. The act 2 draw-in and the magnetic button are
desktop-only as well; on touch devices constellations are simply drawn.

## Hooks

| Hook                                                        | Where                                 | Used by                           |
| ----------------------------------------------------------- | ------------------------------------- | --------------------------------- |
| `[data-starfield-slot]` (`data-tier`) inside `<Background />` | `src/components/background`         | Canvas-2D / WebGL starfield       |
| `#act-0 … #act-5` with `data-act="act-N"`, `data-act-name`  | `src/components/home/Act.tsx`         | ScrollTrigger scenes              |
| `[data-hero-line]`, `[data-hero-chip]`, `[data-scroll-hint]` | `Hero.tsx`                            | Hero entrance (CSS)               |
| `[data-phrase]`                                             | `WhoIAm.tsx`                          | Phrase light-up on scroll         |
| `[data-constellation-line]`, `[data-star]`, `[data-star-chip]` | `Constellation.tsx`, `Skills.tsx`  | Constellation draw + hover        |
| `[data-timeline-line]`, `[data-timeline-node]`, `[data-timeline-item]` | `Experience.tsx`           | Star-trail timeline               |
| `[data-magnetic]`, `[data-contact-target]`                  | `ContactAct.tsx`                      | Magnetic button, star gathering   |
| `[data-demo-slot="low-light" \| "kernel" \| "pathfinding"]` (`data-demo-state` = `static` / `loading` / `live`) | `src/components/lab/DemoSlot.tsx` | Sandpack demos |

Everything is visible and complete without these enhancements.

## Lab demos

`/[locale]/lab` has three editable demos, each in a section with an id anchor
(`#low-light`, `#kernel`, `#pathfinding` — the homepage act 4 cards link to them).

| Demo          | Core file     | What it does                                                                                                   |
| ------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| `low-light`   | `enhance.js`  | Grayscale, gamma, histogram equalization, CLAHE-lite (tiles + clip limit + bilinear LUT blending); before/after, histograms, image upload |
| `kernel`      | `convolve.js` | Editable 3×3 kernel + divisor; presets Identity, Sobel X / Y / magnitude, Sharpen, Box blur, Emboss             |
| `pathfinding` | `search.js`   | 31×21 grid, draw walls, drag start/goal, animated A* / Dijkstra, visited-count and path-length comparison, random maze |

- **Sources** are plain files in `src/lab/demos/<name>/` (`App.js` + the core
  algorithm) plus `shared/scene.js` (the procedural night-street test image —
  no image assets) and `shared/styles.css`. They are imported as strings with
  `import src from "./file.js?raw"` (a `turbopack.rules` entry in
  `next.config.ts`; typed in `src/raw.d.ts`) and are excluded from ESLint,
  because they run inside the sandbox, not in the site bundle.
  `src/lab/demos/index.ts` maps them to Sandpack files (client-only);
  `src/lab/demos/core.ts` is the server-safe part (ids, colours, core sources).
- **Placeholder**: the lab page server-renders the core algorithm file of each
  demo with shiki (`src/components/lab/CodeSnippet.tsx`) in a box with the same
  fixed height as the editor (520px), so swapping in Sandpack causes no layout
  shift on desktop.
- **Loading**: `DemoSlot.tsx` (client) imports `SandpackDemo.tsx` with
  `next/dynamic` (`ssr: false`) when the slot comes within 200px of the
  viewport (IntersectionObserver). On `<768px` or coarse pointers nothing loads
  automatically: the code is shown with a “加载可交互演示 / Load interactive
  demo” button. Without JavaScript the highlighted code simply stays.
- **Sandpack**: `react` template, custom dark theme from the site tokens
  (`CODE_COLORS` in `core.ts`, shared with the shiki theme), editor and preview
  side by side on desktop and stacked on mobile, line numbers, 520px high.
  The page locale is injected as a hidden `/locale.js`; each `App.js` has a
  small `en` / `zh` label dictionary. A hidden `/sandbox.config.json` turns off
  the bundler's infinite-loop guard, which otherwise aborts per-pixel loops
  after 100k iterations.
- The demo area is always dark, in both site themes. Sandpack's bundler and
  the demo's React runtime are loaded from CodeSandbox's servers at run time,
  so the live demos need network access; the static code does not.

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
  lib/                     seo.ts, locale.ts, prefs.ts (theme/fx stores), no-flash.ts, messages.ts,
                           capability.ts (device tier), after-load.ts, sky-store.ts (scroll → starfield)
  content/                 schema.ts, projects.ts, blog.ts
  lab/demos/               core.ts, index.ts, low-light/, kernel/, pathfinding/, shared/
                           (Sandpack demo sources, imported with ?raw)
  raw.d.ts                 type for `?raw` imports
  components/
    background/            Background.tsx (poster), BackgroundLive.tsx (tier selection),
                           StarfieldLite.tsx (Canvas 2D), StarfieldWebGL.tsx + sky-scene.ts (R3F / three)
    fx/                    FxProvider.tsx (useFx)
    lab/                   CodeSnippet.tsx (shiki, server), DemoSlot.tsx (lazy mount),
                           SandpackDemo.tsx (the only Sandpack import)
    layout/                Header.tsx, header-controls.tsx, Footer.tsx, PageShell.tsx
    home/                  Act, Hero, WhoIAm, Skills, Constellation, Experience,
                           LabPreview, ContactAct, ProjectsSection, HomeFx (scroll choreography)
    seo/                   PersonJsonLd.tsx
    ui/                    CopyEmailButton.tsx, Terminal404.tsx, icons.tsx
  app/
    globals.css            tokens, type scale, components, background, act animations
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
