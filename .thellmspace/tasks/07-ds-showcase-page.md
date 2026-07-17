---
id: 07
title: /design-system showcase page — every export, every variant
layer: ui
kind: build
slice: showcase route exercising the whole design-system barrel with all variants
target: src/app/design-system/page.tsx, src/modules/design-system/components/showcase/
contract: C-PAGE-DS
status: DONE
depends_on: [02, 03, 04, 05, 06]
---
## Objective
Create the `/design-system` route: a server-component page that renders EVERY export of the
design-system barrel with ALL its variants, copy exclusively from the `DesignSystem` i18n
namespace (en+de exist from task 02). This is the acceptance "test page" (D8).

## Contract (C-PAGE-DS in .qa/CONTRACTS.md)
Sections (each with an `<h2>` from the namespace + id):
1. brand — Logo lockup/mark/white (white on a navy panel), Eyebrow both tones.
2. buttons — all 10 variants (default, navy, accent, secondary, outline, ghost,
   destructive, link, white, outline-white — white/outline-white on a navy panel), sizes
   sm/default/lg/xl, icon button (aria-label), loading state, disabled.
3. badges — all Badge variants, StatusBadge live/scheduled/draft, Tag (removable — client
   demo island), CountBadge.
4. alerts — 4 variants; warning with action + dismiss (client island), error with action.
5. cards — StatCard ×3 (icon tones, one with delta, one with progress), FeatureCard light +
   navy, EmptyState with action.
6. forms — Field+Input default/error/disabled, Textarea, InputGroup search (icon),
   NativeSelect or Select with placeholder, Checkbox+label, RadioGroup (2 options), Switch ×2
   (one disabled), all labels/helpers/errors from namespace.
7. overlays — Dialog (trigger opens, cancel/confirm), DropdownMenu (4 items), Tooltip,
   Popover (link input + Copy) — client demo islands.
8. data — Tabs (3 + panels), SegmentedControl (client island), Table (4 rows, status pills,
   caption, header from namespace), Pagination (Showing 1–4 of 12 + prev/next + pages),
   Breadcrumb (Dashboard › Tests › Midterm Algebra).
9. feedback — ProgressBar solid + gradient with aria labels, Skeleton block, Spinner.
Layout: Container + Sections; page header (pageTitle/pageDescription); generateMetadata
from DesignSystem.meta. Server component; client islands ONLY: `TagDemo`, `AlertDismissDemo`,
`DialogDemo`, `DropdownDemo`, `TooltipDemo`? (tooltip needs no state — ui Tooltip is already
client; compose directly), `PopoverDemo`, `SegmentedDemo`. Put them in
`src/modules/design-system/components/showcase/` (each ≤120 lines, 'use client' line 1).

## Files
- CREATE src/app/design-system/page.tsx (async server component, getTranslations)
- CREATE src/modules/design-system/components/showcase/*.tsx (client islands, named *Demo)
- Barrel: export the showcase demos? NO — page imports them via relative-safe path:
  app/ imports modules ONLY through barrels → export the demos from the design-system barrel
  under a `// showcase` group (they are module components; rule: cross-module = barrel).

## Steps
1. Compose page.tsx section by section from the barrel only (no direct ui/* imports).
2. Client islands for interactive demos. 3. generateMetadata. 4. tsc+lint zero errors.
5. Smoke: this page is verified by task 14's e2e — here, only compile/lint + careful code
   review against the contract (the dev server runs under Playwright in task 13+).

## Project rules
module-pattern (page → barrel imports), i18n.md (zero hardcoded strings — every label from
DesignSystem.*), nextjs-patterns (server by default, 'use client' leaves), quality.md
(metadata, one h1, semantic headings order h1→h2), tailwind.md.

## Done criteria
- Page renders (compile-clean) with all 9 sections; EVERY barrel export appears at least
  once; every Button/Badge/Alert variant present; all strings from DesignSystem namespace
  (grep page+demos for hardcoded English words in JSX text → none); tsc+lint zero errors.
- Verifier: read page + demos top to bottom against the contract checklist; grep for
  hardcoded copy; tsc+lint.
## Assumptions
- Runtime proof happens in tasks 13–15 (Playwright) per the wave plan; this task's gate is
  compile/lint/review (keeps one-server-at-a-time discipline).
## Evidence
PASS (independent verifier, 2026-07-17): every barrel export exercised (7 via composed parents, verified in ui source); all 10 button + 10 badge variants, alerts ×4, stat/feature cards, forms states, overlays, tabs/segmented/table/pagination/breadcrumb, progress/skeleton/spinner, logo ×3; zero hardcoded English words in JSX; tsc 0, lint 0 errors. Orchestrator fix after verify: pagination text + aria-labels i18n-driven (5 new keys, parity 300 keys OK); stray .thellmspace/DECISIONS.md merged into .qa/DECISIONS.md.
(filled by builder/verifier)
