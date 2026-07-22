---
id: 133
title: Build the navy hero panel shell — 24px navy card, two decorative circles, "This week" eyebrow
layer: ui
kind: build
slice: The dashboard hero panel container (design §3), empty of copy and stats
target: src/modules/dashboard/components/DashboardHeroPanel.tsx
contract: n/a (presentation)
design: .qa/design/screens/portal--main.html:26-29 · .qa/design/spec/01-portal-dashboard.md#3
status: TODO
depends_on: ["131"]
---

## Objective
The navy panel that is the left cell of the hero grid: rounded 24px navy surface, two decorative
translucent circles, the "This week" eyebrow, and the column layout that pins the stat row to the
bottom. Copy (134) and stats (135-137) land inside it.

## Contract
n/a. Quoted design, `portal--main.html:26`:
> `background:#0E2350; border-radius:24px; padding:32px 34px; color:#fff; display:flex;
> flex-direction:column; position:relative; overflow:hidden`

## Design source
- Container → `relative flex flex-col overflow-hidden rounded-portal bg-navy-900 p-8`.
  `--color-navy-900` = `oklch(0.2692 0.0871 263.0388)` (`#0E2350`) ✓ exact token.
  `rounded-portal` = 24px (token added in 131). `p-8` = 32px ✓ vertical exact; horizontal 32px vs
  the design's 34px — 2px delta, accepted over an arbitrary value.
  `data-slot="dashboard-hero"`.
- Decorative circle 1 (`:27`) `right:-70px; top:-90px; 280×280; border-radius:999px;
  background:rgba(255,255,255,.045)` → `absolute -top-22.5 -right-17.5 size-70 rounded-full
  bg-surface-glass opacity-65 aria-hidden`.
  `--color-surface-glass` = `oklch(1 0 89.8756 / 7%)` (existing); `opacity-65` → 4.55% effective,
  the design's 4.5%. `size-70` = 17.5rem = 280px ✓; `-top-22.5` = 90px ✓; `-right-17.5` = 70px ✓.
- Decorative circle 2 (`:28`) `right:60px; bottom:-110px; 200×200; rgba(255,255,255,.035)` →
  `absolute -bottom-27.5 right-15 size-50 rounded-full bg-surface-glass opacity-50 aria-hidden`
  (7% × 0.5 = 3.5% ✓ exact). `size-50` = 200px ✓; `-bottom-27.5` = 110px ✓; `right-15` = 60px ✓.
  Both circles carry `aria-hidden="true"` and no text — they are decoration.
- Eyebrow (`:29`) **"This week"** — `12.5px / 600 / letter-spacing .06em / uppercase / #8FA3C7`
  → `text-meta font-semibold uppercase tracking-overline text-navy-muted`.
  `--text-meta` = 0.78125rem (12.5px) ✓ exact; `--tracking-overline` = 0.06em ✓ exact;
  `--color-navy-muted` = `oklch(0.7127 0.0574 262.1235)` (`#8FA3C7`) ✓ exact — the dark-scale ink
  the design uses as a light-mode literal on this navy card (04-ds-foundations §E precedent).
  Contrast: 4.62:1 on `#0E2350` — passes AA for its 12.5px semibold size only as large-ish text; it
  is a decorative eyebrow, and the H-level content beside it carries the meaning.
- Relative stacking: the eyebrow, headline and stat row all need `relative` so they paint above the
  circles (the design sets `position:relative` on `:30` and `:31`).
- Motion: `transition-shadow duration-150 ease-out-expo motion-reduce:transition-none` — no hover
  is declared in the design; none is added to a non-interactive panel. Entrance is 156's.

## Files
- CREATE `src/modules/dashboard/components/DashboardHeroPanel.tsx` — presentational shell taking
  `children`. ≤60 lines.
- EDIT `src/modules/dashboard/components/DashboardScreen.tsx` — mount it in the hero grid's first
  cell.

## Depends on
- **131** — `rounded-portal` and the `grid-cols-portal-2up` grid.

## Steps
1. Build the shell with the two `aria-hidden` circles and the eyebrow.
2. Slot `children` into a `relative mt-auto`-free content column so 134/135 control their own flow.
3. Check `overflow-hidden` actually clips both circles at 1280 and 375.

## Project rules
- `.claude/rules/tailwind.md` — no arbitrary values; OKLCH tokens only; never pure `#fff`.
- `.claude/rules/quality.md` — decorative elements get `aria-hidden`; contrast on real content.
- `.claude/rules/module-pattern.md` — 120-line component ceiling; no logic in this file.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `[data-slot="dashboard-hero"]` computed `background-color` is the resolved
  `oklch(0.2692 0.0871 263.0388)` and `border-radius` is `24px`.
- Neither circle appears in the accessibility tree (`page.locator('[data-slot="dashboard-hero"]
  [aria-hidden="true"]')` count === 2; `getByRole('generic')` snapshot unchanged by them).
- No horizontal overflow inside the panel at 375px: the panel's `scrollWidth <= clientWidth`.
- Eyebrow text comes from `t('Dashboard.hero.eyebrow')` — asserted against `en.json`, and the same
  node renders the zh string at `/zh/dashboard`.
- axe clean; six catalogs key-identical; zero banned-pattern hits.

## Assumptions
- none

## Evidence
<filled in as the task runs>
