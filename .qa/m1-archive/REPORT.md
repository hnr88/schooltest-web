# REPORT.md — Mission: SchoolTest design system + landing page

Date: 2026-07-17/18 · Branch: `main` (7 wave commits) · Package: `schooltest-web`
Status: **COMPLETE** — 16/16 tasks DONE + independently verified; quality gate closed
(two consecutive CLEAN critic passes + banned-pattern scan CLEAN).

## What was delivered

### 1. Design-token foundation (task 01)
- `design-system-and-components/tokens.css` ported to `src/app/globals.css` as exact
  OKLCH (85/85 values verified verbatim, 52 spec tokens present, light + dark):
  navy/blue/teal brand scales, shadcn semantic tokens, success/warning, charts, sidebar,
  shadows sm–xl, `--radius`, CTA gradient, `--container-landing`, display type scale.
- Old EAL-D brand tokens (rausch/babu/arches/canvas/ink…) fully purged (task 12).
- Google Sans variable fonts (normal + italic) via `next/font/local` (D5 — spec wins over
  the approved-font list); Geist removed; mono fallback kept for vendored chart.
- Brand assets: `public/brand/{logo.png, logo-mark.png, hero-field.webp}` (hero photo
  extracted from the spec's base64 image slot, byte-verified 1200×800).

### 2. Reusable design system (tasks 03–06 + critic fixes) — `src/modules/design-system/`
16 wrapper/composite components over the read-only shadcn-on-Base-UI primitives (law 11 —
zero ui/* edits), all cn()-mergeable, typed, server-first: `Button` (10 variants incl.
navy/accent/white/outline-white, xl size, loading, **`href` prop for true link semantics**),
`Badge` (9 variants), `StatusBadge` (spec pills), `Tag` (removable, label-required union),
`CountBadge`, `Logo` (lockup/mark, color/white, dark-aware), `Eyebrow`, `Container`,
`Section`, `Alert` (4 variants, role="alert"), `ProgressBar` (solid/gradient, required
ariaLabel), `StatCard`, `FeatureCard`, `EmptyState`, `PresenceAvatar`, `SegmentedControl`
(Base UI ToggleGroup). Plus `primitives.ts` re-export surface (all ui families: forms,
cards, feedback, avatar, overlays incl. Sheet, data display) and full prop types.
Single import surface via the barrel (45 + 167 lines — under the 200 cap).

### 3. `/design-system` showcase (task 07 + fixes)
9 sections exercising every barrel export with all variants (server components + 7 client
demo islands). All copy from the `DesignSystem` i18n namespace (114 keys, en+de).
Documented exceptions (C-PAGE-DS addendum): ui PaginationLink/Previous/Next (vendored
role=button + hydration defect) replaced in the demo by DS Button href.

### 4. Landing page (tasks 08–12) — 13 separate section components in `src/modules/landing/`
AnnouncementBar → LandingHeader (+MobileNav sheet) → `<main>` { HeroSection (+HeroFlow,
campus-photo navy card), TrustedByStrip, FeaturesSection (#product), FeatureDetailSection
+AiFeedbackCard (#ai-feedback), StatsBand, HowItWorksSection +TestimonialCard
(#for-schools), PricingSection (#pricing), FaqSection (#resources), CtaSection (#cta) }
→ LandingFooter (link columns, socials, LocaleSwitcher, status pill).
- **100% of copy from `src/i18n/messages/{en,de}.json`** (266 keys, parity-checked) —
  nothing hardcoded; aria labels, alts, meta, scores included. Formal-Sie German.
- generateMetadata + openGraph from catalogs; one h1; sitemap/robots updated.
- Zero dead links (D7: CTAs→anchors; Company column + legal links omitted — no real
  targets; socials → real external URLs).

### 5. E2E suite (tasks 13–15) — 19 Playwright tests, all green
Catalog-driven assertions (specs read the JSONs at runtime): EN/DE full-section renders +
aria-label keys + no-leak both directions; 13-landmark composition order; every anchor
resolves + Pricing hash-scroll; showcase variants + real interactions (dialog 3 close
paths, tooltip hover+keyboard focus, segmented flips, tag removal, alert dismiss, tabs,
sheet); ds-probe className-merge (proven non-vacuous by adversarial probe); locale toggle
en→de→en with no-reload proof; axe zero serious/critical on / (en+de) + /design-system;
375px+1280px sweeps (no h-scroll, ≥44px targets on the landing); keyboard flows; console
guards (zero errors); 6 screenshots in `.qa/screenshots/`.

## Proof (verification gates, all fresh-run)
- `pnpm tsc --noEmit` → 0 errors · `pnpm lint` → 0 errors (1 pre-existing articles warning)
- `pnpm exec playwright test` → **19/19 passed**, zero FATAL/panic/console errors
- i18n parity → PARITY OK 266 keys · banned-pattern scan → CLEAN
- axe → 0 serious/critical (en, de, showcase) · dark-mode ratios measured live → all pass AA
- Independent verifiers: every task passed by a fresh non-builder agent; 11 critic passes
  (pass 10 + 11 consecutively CLEAN = quality-gate closure).

## Files created/changed (per wave commit)
- `79d1620` wave 1: tokens/fonts/assets + i18n catalogs + playwright webServer
- `2b4e359` wave 2: design-system module (16 components + barrel)
- `48f2f6d` wave 3: /design-system showcase + pagination i18n + import-alias compliance
- `6d6364a` wave 4: landing sections 1–8 (+44px header targets)
- `8791fca` wave 5: landing sections 9–13 + composition + purge + LocaleSwitcher fix (D20)
- `4dd8b47` wave 6: 3 e2e suites + DS Button href + 11 a11y fixes
- wave 7 (final): critic-pass fixes D23–D27 (spec coverage, Company column, Sheet demo,
  barrel split, Turbopack panic root-cause, 404 i18n, dark-mode AA, sitemap/OG) + this report

## Deviations & decisions (full log: `.qa/DECISIONS.md` D1–D27)
- Spec wins over tailwind.md font list (Google Sans shipped by the spec) — D5.
- Landing's print-variant hero mockup + App Screens file excluded (product UI, not the
  design system) — D2.
- Legal links + footer Company column omitted (no real routes; honesty over fakery) — D7/D23.
- ui PaginationLink/Previous/Next not demoed (vendored defect, law 11) — C-PAGE-DS addendum.
- Showcase 44px sweep log-only (vendored size-scale gallery; landing asserts zero) — D22.
- Accent button re-colored for AA (spec's white-on-teal fails) — D22.
- Dark-mode AA hardening beyond the light-first spec — D26/D27.

## Security findings (for human review)
- No auth surface added; no endpoints; no secrets (grep-clean; env via src/lib/env.ts only).
- External links: socials target=_blank rel="noreferrer noopener".
- Locale cookie: NEXT_LOCALE, samesite=lax (existing mechanism, D20 boundary fix).
- Notable latent defect fixed: LocaleSwitcher imported a server-only module client-side
  (would have 500'd any page rendering it) — D20.
- Root-cause fix: stray npm debris at the repo root poisoned Next's workspace-root
  inference (FATAL Turbopack panics) — removed; avoid running npm/npx at the repo root.

## A11y findings
- axe moderate/minor (non-blocking): `region` landmark hints on both pages (logged in the
  a11y spec output); showcase gallery has 43 vendored small-size exhibits (D22 ruling).
- Reduced-motion not handled (matches vendored shadcn stock; future hardening).

## Not built (out of scope per D2)
- Dashboard/test-taking/PTE components from the DS doc's app sections; the print-variant
  hero mockup; the App Screens file; real sign-in/register/legal pages (no routes exist).

## How to run
- Checks: `pnpm tsc --noEmit && pnpm lint` · E2E: `pnpm exec playwright test`
  (boots the app on :3100 itself) · Pages: `/` (landing), `/design-system` (showcase).
