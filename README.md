# 陈学礼 / Westly Tan Xue Le — personal website

Bilingual (中文 / English) personal site for recruiters and headhunters.
All copy comes from the approved site copy; nothing on the site is invented.

> **Status: complete** — scaffold, i18n, design tokens, layout, pages and SEO;
> starry-sky background with [degradation tiers](#background-starry-sky) and
> homepage scroll storytelling; three editable [lab demos](#lab-demos) on
> `/[locale]/lab`.

## Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript** + **Tailwind CSS v4**
- **next-intl** — locales `zh` (default) and `en`, always-prefixed URLs
- **three + @react-three/fiber** (WebGL starfield), **GSAP ScrollTrigger**,
  **Lenis**, **Motion** — all loaded with dynamic `import()` after window load
  + idle; none of them is in the first-load JS
- **GSAP motion layer** (`src/components/motion`, with `@gsap/react`,
  SplitText and Flip) — `next/dynamic` client-only chunks, fetched after
  hydration because the hero intro starts 0.6s after first paint
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
| `NEXT_PUBLIC_SITE_URL`      | Vercel's `VERCEL_PROJECT_PRODUCTION_URL` (https), else `http://localhost:3000` | Base URL for canonical/hreflang, sitemap, robots, OG image and JSON-LD. |
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
meteors paused), `gather` (act 5, stars drift toward `[data-contact-target]`),
`heroScroll` (hero parallax: the mid star layer rises at 0.1x, the far layer
stays put; written by `motion/ParallaxHero.tsx`).

## Scroll storytelling

`src/components/home/HomeFx.tsx` (client, renders nothing) enhances the
server-rendered acts. The SSR HTML is the final state; with reduced motion or
effects off nothing runs.

| Act | Effect                                                                                          | Tech                          |
| --- | ----------------------------------------------------------------------------------------------- | ----------------------------- |
| 0   | Parallax scene (effect 10), opening intro (effect 11); mask-reveal lines (500ms / 80ms stagger), chips fade (40ms stagger); name, tagline and role line: see the motion layer | CSS (`globals.css`) + GSAP    |
| 1   | Phrases light up muted → text (`--lit`), camera push                                            | ScrollTrigger scrub           |
| 2   | Constellation lines draw (600ms), stars light accent; chip ↔ star hover highlight               | Motion `inView` + `animate`   |
| 3   | Star-trail stroke draws with scroll, nodes pop when reached, entries cross-fade (`motion/ScrollStory.tsx`) | ScrollTrigger                 |
| 4   | Stars dim                                                                                       | ScrollTrigger → sky store     |
| 5   | Stars gather                                                                                    | ScrollTrigger → sky store     |

Lenis smooth scrolling runs on the homepage for desktop fine pointers only and
is driven by the GSAP ticker. The act 2 draw-in is desktop-only as well; on
touch devices constellations are simply drawn.

## GSAP motion layer

`src/components/motion/` holds one component per effect. Each renders nothing
(or only its own overlay), finds its targets through `data-*` hooks, and runs
inside `useGSAP()` so everything is reverted on unmount. Styles live in
`src/app/motion.css`, one block per effect.

Site-wide effects are mounted in `MotionLayer.tsx` (locale layout);
homepage-only ones in `HomeMotion.tsx` (home page). **To remove an effect, delete
its component file and its mount line** — the hooks left in the markup do
nothing on their own. Exceptions are noted in the last column.

| #  | Effect                                   | Component               | Mounted in    | Also remove                                                        |
| -- | ---------------------------------------- | ----------------------- | ------------- | ------------------------------------------------------------------ |
| 1  | Hero name / tagline intro + sweep        | `TitleIntro.tsx`        | home page     | `data-intro-hold` on the name and tagline in `Hero.tsx`            |
| 2  | Pinned scroll story, timeline draw       | `ScrollStory.tsx`       | home page     | —                                                                  |
| 3  | Count-up numbers / skill tag pop         | `Counters.tsx` / `SkillTags.tsx` | layout / home page | —                                                    |
| 4  | Magnetic buttons / card tilt / cursor ring | `MagneticButtons.tsx` / `CardTilt.tsx` / `CursorRing.tsx` | layout | —                                          |
| 5  | Route curtain                            | `RouteCurtain.tsx`      | layout        | `LabFlip.tsx` imports its `internalDestination()` helper           |
| 6  | Role line decode                         | `RoleDecode.tsx`        | home page     | `data-intro-hold` on the role line in `Hero.tsx`                   |
| 7  | Section heading line masks               | `HeadingMasks.tsx`      | layout        | —                                                                  |
| 8  | Projects horizontal gallery              | `ProjectsGallery.tsx`   | home page     | —                                                                  |
| 9  | Lab card → demo Flip                     | `LabFlip.tsx`           | layout        | —                                                                  |
| 10 | Parallax hero (layer speeds on scroll)   | `ParallaxHero.tsx`      | home page     | optional: `scroll` in `sky-scene.ts` LAYERS / `sky.heroScroll`     |
| 11 | Opening intro (once per session)         | `OpeningIntro.tsx`      | home page     | `<IntroOverlay />` in `[locale]/page.tsx` + `home/IntroOverlay.tsx`, the gate `<script>` in `[locale]/layout.tsx` (+ `lib/opening-intro-script.ts`), `lib/opening-intro.ts` and its use in `hero-clock.ts` / `TitleIntro.tsx` / `RoleDecode.tsx`, the effect 11 block in `motion.css` |
| 12 | Scroll-driven section backgrounds       | `SectionBackdrop.tsx`   | home page     | the `[data-section-bg]` div in `[locale]/page.tsx`, the "Section backdrop" block in `globals.css` |

`data-intro-hold` keeps the hero name, tagline and role line invisible until
their intro starts. It is a 2.5s CSS animation, not a declaration: if the
script never runs the text appears by itself, and a `<noscript>` rule disables
the hold entirely. While the opening intro overlay is pending the hold lasts
3.4s, and while it plays (`<html data-intro="play" | "reveal">`) OpeningIntro
owns it; the name intro waits for its release (`src/lib/opening-intro.ts`).

### Parallax hero (effect 10)

`Hero.tsx` renders a 100svh scene that starts under the sticky header. Each
`[data-parallax]` layer has a speed s = on-screen movement ÷ scroll distance;
ParallaxHero counter-translates it by `y = scroll × (1 − s)`, scrubbed from
"top top" to "bottom top" (natural scroll, no pin, no pointer parallax).

| Layer (far → near)           | Desktop | Mobile (<768px, `data-parallax-mobile`) |
| ---------------------------- | ------- | --------------------------------------- |
| Far stars (WebGL)            | 0       | — (lite starfield unchanged)            |
| Mid stars (WebGL)            | 0.1     | —                                       |
| Antigravity particle ring    | 0.2     | scrolls with the page                   |
| Skyline `#1B2340`            | 0.25    | 0.125                                   |
| Hills `#11151F`              | 0.45    | hidden                                  |
| Name block (WESTLY / 陈学礼 / role) | 0.6 | 0.3                                  |
| Foreground `#070A12` + 1px rim light | 1 | 1                                     |

The foreground is filled with the page background and continues into
`.hero-ground` (headline, tagline, chips, buttons), so the scene sinks into
the page without a seam while the faster foreground climbs over the name.
Dark theme only: the light theme hides the silhouettes.

**Placeholder art** — `public/parallax/skyline.svg`, `hills.svg`,
`foreground.svg` are generated placeholders (each < 30KB, 5120 wide,
`preserveAspectRatio="xMidYMax slice"` so they always span the width). Replace
them with the final art under the same names; keep the fills, and in
`foreground.svg` keep a solid bottom edge plus the rim-light stroke along the
top contour. Layer heights are in `globals.css` (`.hero-layer-*`).

### Section backgrounds (effect 12)

A fixed `.section-bg` layer (z -9: above the starfield, below all content) is
painted from `--bg` plus `--glow`, a ~600px radial glow (300px below 768px) at
12% opacity. Per section, the colour and glow scrub from the previous
section's values to this one's between "top 60%" and "top 20%" (`scrub: 1`,
ease "none"), and the glow drifts a few percent while the section is in view.
The layer is invisible over the hero, so the sky stays visible behind the
silhouettes, and fades in as 我是谁 arrives on the hero foreground colour
`#070A12`, so there is no seam. Values are in `LOOKS` in `SectionBackdrop.tsx`.
With reduced motion or effects off the colours switch instantly when a section
reaches 40% of the viewport. Dark theme only: the light theme hides the
layer. Once the layer is fully visible it covers the starfield.

### Opening intro (effect 11)

Once per browser session (`sessionStorage["xl-intro"]`), homepage only:
`XL` signature draws (DrawSVG, 1.0s) → `#11151F` panel rises (0.45s) →
"Build · Research · Discover" (0.6s) → hold 0.3s → panel leaves upward (0.5s)
→ hero layers settle from scale 1.15 (far → near) → name intro. About 2.6s;
1.2s on mobile without the drawing. Skip: the "跳过 / Skip" button, a click,
wheel, scroll or Escape. Reduced motion / effects off / already seen: an inline
script in `<head>` sets `<html data-intro="skip">` before first paint and the
overlay is never shown. If JS never runs, CSS hides the overlay after 3s; the
hero always renders underneath, so LCP is not blocked.

Rules the layer follows:

- **Reduced motion / Effects off:** `useMotion()` returns `enabled: false`, the
  GSAP context is reverted and nothing runs. The server markup + CSS is the
  final state, so no content depends on JavaScript to become visible.
- **Mobile** (`<768px` or coarse pointer): no pinning, no pointer effects, no
  curtain, no gallery, no Lab Flip; the intro runs without blur and the
  decode / count-up / tag pop are shortened.
- **Performance:** transforms and opacity only, except where an effect is
  defined by another property (hero blur, sweep `background-position`,
  `stroke-dashoffset`). Pointer effects attach after window load + idle and
  never during the hero particle intro (`src/lib/hero-intro.ts`).
- **Cross-route Flip:** a shared element cannot survive an App Router
  navigation, so `LabFlip` flies a clone of the card onto the demo slot with
  `Flip.fit()` while a veil cross-fades into the Lab page.

## Hooks

| Hook                                                        | Where                                 | Used by                           |
| ----------------------------------------------------------- | ------------------------------------- | --------------------------------- |
| `[data-starfield-slot]` (`data-tier`) inside `<Background />` | `src/components/background`         | Canvas-2D / WebGL starfield       |
| `#act-0 … #act-5` with `data-act="act-N"`, `data-act-name`  | `src/components/home/Act.tsx`         | ScrollTrigger scenes              |
| `[data-hero-line]`, `[data-hero-chip]`, `[data-scroll-hint]` | `Hero.tsx`                            | Hero entrance (CSS)               |
| `[data-title-name]`, `[data-title-tagline]`, `[data-role-decode]`, `[data-intro-hold]` | `Hero.tsx`  | Title intro, role decode          |
| `[data-story-block]`                                        | `WhoIAm.tsx`, `Skills.tsx`, `Experience.tsx` | Scroll story cross-fade    |
| `[data-heading-mask]`, `[data-count]`                       | `Act.tsx`, `PageShell.tsx`, pages     | Heading masks, count-up           |
| `[data-tilt]`, `[data-lab-card]`                            | `Skills.tsx`, `LabPreview.tsx`, `ProjectsSection.tsx` | Card tilt, Lab Flip |
| `[data-projects-gallery]`, `[data-gallery-track]`           | `ProjectsSection.tsx`                 | Projects gallery                  |
| `[data-phrase]`                                             | `WhoIAm.tsx`                          | Phrase light-up on scroll         |
| `[data-constellation-line]`, `[data-star]`, `[data-star-chip]` | `Constellation.tsx`, `Skills.tsx`  | Constellation draw + hover        |
| `[data-timeline-stroke]`, `[data-timeline-node]`, `[data-timeline-item]` | `Experience.tsx`         | Star-trail timeline               |
| `[data-magnetic]`, `[data-contact-target]`                  | buttons site-wide, `ContactAct.tsx`   | Magnetic buttons, star gathering  |
| `[data-hero-scene]`, `[data-parallax]`, `[data-parallax-mobile]`, `[data-intro-layer]` | `Hero.tsx` | Parallax hero, opening intro layer settle |
| `[data-opening-intro]` (`data-intro-veil` / `-mark` / `-panel` / `-tagline` / `-skip`), `<html data-intro>` | `IntroOverlay.tsx`, gate script | Opening intro |
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
- **Placeholder**: before Sandpack mounts, the card is a dark preview shell
  (at least 480px), not the source. The core file is still server-rendered with
  shiki (`src/components/lab/CodeSnippet.tsx`) and stays collapsed under
  “View source” until the live editor takes over.
- **Loading**: `DemoSlot.tsx` (client) imports `SandpackDemo.tsx` with
  `next/dynamic` (`ssr: false`) when the slot comes within 200px of the
  viewport (IntersectionObserver). On `<768px` or coarse pointers nothing loads
  automatically: the shell shows a “加载可交互演示 / Load interactive demo”
  button. The GitHub link to the source file works without JavaScript.
- **Sandpack**: `react` template, custom dark theme from the site tokens
  (`CODE_COLORS` in `core.ts`). The preview is full width. Each demo posts its
  content height to the page, which sizes the iframe to match (minimum 480px,
  no inner scrollbar). The code editor is not mounted until “View source” /
  “查看源码”; it then opens below the preview (240ms, at most 480px tall, and
  scrolls inside the editor). The page locale is injected as a hidden
  `/locale.js`; each `App.js` has a small `en` / `zh` label dictionary. A
  hidden `/sandbox.config.json` turns off the bundler's infinite-loop guard,
  which otherwise aborts per-pixel loops after 100k iterations.
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
2. `NEXT_PUBLIC_SITE_URL` is optional: without it the site uses Vercel's
   `VERCEL_PROJECT_PRODUCTION_URL` (the project's production domain, served
   over https). Set it for the Production environment only to force a specific
   canonical domain.
3. Optionally set the flags and `NEXT_PUBLIC_FORMSPREE_ID`.
4. Deploy. After adding a custom domain, redeploy so the canonical URLs,
   sitemap and OG image pick it up (the value is read at build time).

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
