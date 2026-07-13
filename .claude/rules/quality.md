---
paths:
  - "src/app/**"
  - "src/**/*.tsx"
---

## Performance

Docs: `.claude/docs/guides/production-checklist.md`, `.claude/docs/getting-started/images.md`, `.claude/docs/getting-started/fonts.md`

1. Server Components by default — minimize client JS bundle.
2. `next/image` for ALL images. Always `width`/`height` or `fill`. `priority` for LCP.
   - Use `images.remotePatterns` (not deprecated `images.domains`).
   - Default `minimumCacheTTL` is 4 hours. Default `qualities` is `[75]`.
3. `next/font` for ALL fonts. Self-hosted, eliminates CLS.
4. Stream slow data with `<Suspense>`. Parallelize with `Promise.all`.
5. `"use cache"` for expensive computations/DB reads. Tag everything.
6. Code-split heavy below-fold Client Components with `next/dynamic`.
7. Fetch on the server. Never create client-side waterfalls.
8. Core Web Vitals: LCP < 2.5s, INP < 200ms, CLS < 0.1.
9. `useMemo`/`useCallback` ONLY when profiling proves need. React Compiler (`reactCompiler: true`) handles most cases.

## SEO — Every Page

Docs: `.claude/docs/getting-started/metadata-and-og-images.md`, `.claude/docs/api-reference/functions/generate-metadata.md`

1. Every page exports `metadata` or `generateMetadata`.
2. `title` (max 60 chars) and `description` (max 160 chars) required.
3. Public pages: `openGraph.images` (1200x630) and `twitter.card`.
4. Detail pages: `alternates.canonical`.
5. `app/sitemap.ts` and `app/robots.ts` at root.
6. Semantic HTML: `<main>`, `<header>`, `<nav>`, `<article>`, `<section>`. ONE `<h1>` per page.
7. JSON-LD via `<script type="application/ld+json">` when relevant. See `.claude/docs/guides/json-ld.md`.
8. Locale alternates via `alternates.languages` for hreflang.

## Accessibility

Docs: `.claude/docs/architecture/accessibility.md`

1. Every interactive element: keyboard reachable.
2. Every image: `alt` text (decorative = `alt=""`).
3. Every form input: associated `<Label>` via shadcn FormLabel.
4. Color contrast: WCAG AA (4.5:1 body, 3:1 large text).
5. Semantic elements: `<button>` for actions, `<a>` for navigation. **Never `<div onClick>`.**
6. Focus rings: always visible. Never `outline: none` without replacement.
7. `aria-*` ONLY when semantic HTML cannot express meaning.
8. Modals: trap focus, restore on close, ESC closes.

## Environment Variables

Docs: `.claude/docs/guides/environment-variables.md`

1. All env access through `@t3-oss/env-nextjs` in `src/lib/env.ts`. Never `process.env` elsewhere.
2. Client vars prefixed `NEXT_PUBLIC_`.
3. `.env.example` committed with placeholders. `.env.local` gitignored.
