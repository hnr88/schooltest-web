---
id: 131
title: Rebuild the dashboard page composition — 28px section stack and the two auto-fit 2-up grids
layer: ui
kind: build
slice: The dashboard page frame the hero, chart, children and note cards drop into
target: src/modules/dashboard/components/DashboardScreen.tsx, src/app/globals.css, src/lib/utils.ts
contract: n/a (presentation)
design: .qa/design/screens/portal--main.html:5,25,88 · .qa/design/spec/01-portal-dashboard.md#1.3 #3 #6
status: TODO
depends_on: ["130"]
---

## Objective
Replace the current three-block overview layout with the design's dashboard frame: one vertical
stack at a 28px gap holding, in order, the greeting row, the hero grid, the "My children" section
and the note grid. Adds the one new radius token the portal's 24px cards need.

## Contract
n/a. Quoted design spec, `.qa/design/spec/01-portal-dashboard.md` §1.3:
> Dashboard inner wrapper (line 5): `display:flex; flex-direction:column; gap:28px;
> padding:8px 4px 8px 8px`.

§3 (hero grid, `portal--main.html:25`) and §6 (note grid, `:88`):
> `display:grid; grid-template-columns:repeat(auto-fit,minmax(380px,1fr)); gap:20px`

## Design source
- Stack: `flex flex-col gap-7` (28px = `gap-7` on the 4pt grid). Page padding `py-2 pr-1 pl-2`
  (8px/4px/8px) at ≥1280px; `px-4 py-6` at 375px (see 157).
- Grids: `grid gap-5 grid-cols-[repeat(auto-fit,minmax(380px,1fr))]` is an arbitrary value and is
  **banned**. Emit a `@utility grid-cols-portal-2up` in `src/app/globals.css` next to the existing
  `@utility grid-cols-search-list` (globals.css:376) with
  `grid-template-columns: repeat(auto-fit, minmax(23.75rem, 1fr));` (23.75rem = 380px).
- Page well behind the cards: `--color-surface-well` (`oklch(0.9595 0.008 253.8534)`, `#EEF2F7`) —
  the design's `#EEF1F6`; the 1-hex delta is the sanctioned token, record it, do not add a token.
- **NEW token** `--radius-portal: 1.5rem` (24px) in the `@theme` block of `src/app/globals.css`
  with the provenance comment `/* 24px — portal card radius, portal--main.html:26,40,64,89,98,121 */`
  (D-DESIGN-2). Nothing in the existing scale is 24px: `--radius-panel` is 16px, `--radius-3xl`
  is 22px, `--radius-4xl` is 26px.
  Register `'portal'` in `THEME_CLASS_GROUPS.rounded` in `src/lib/utils.ts` — otherwise
  `tests/e2e/design-tokens.spec.ts` fails on parity AND `cn()` silently drops `rounded-portal`.
- Section order top→bottom: greeting row (132) → hero grid [hero panel 133 | practice chart 140] →
  "My children" (144) → note grid [school note 150 | nothing, see 152].
- Motion: the stack itself gets no animation; 156 owns the staggered entrance.

## Files
- EDIT `src/app/globals.css` — `--radius-portal` in `@theme`; `@utility grid-cols-portal-2up`.
- EDIT `src/lib/utils.ts` — add `'portal'` to `THEME_CLASS_GROUPS.rounded`.
- EDIT `src/modules/dashboard/components/DashboardScreen.tsx` — the new frame. Keep
  `data-slot="dashboard-overview"` and `data-surface="parent-overview"` on `<main>`.
- DELETE-BY-SUPERSESSION (per D-SCOPE-3, styling-only components): the JSX usages of
  `DashboardFamilySummary`, `DashboardPromo`, `DashboardRecentActivity`, `DashboardRecentProfiles`.
  Leave the files in place until 159 confirms nothing else imports them; **do not delete any query
  hook, store or i18n key.**

## Depends on
- **130** — the household state the sections consume.

## Steps
1. Add the token, register it in `THEME_CLASS_GROUPS`, add the `@utility`.
2. Rewrite the `DashboardScreen` return into the stack + two `grid-cols-portal-2up` grids with
   placeholder section landmarks (`<section data-slot="…">`) that later tasks fill.
3. Confirm at 1280px the hero grid is 2 columns and at 375px it is 1 column with no horizontal
   scroll.

## Project rules
- `.claude/rules/tailwind.md` — **no arbitrary values** (`grid-cols-[…]`, `rounded-[24px]`,
  `gap-[28px]` all fail); OKLCH only; `gap-*` for sibling spacing, never margin.
- `.claude/rules/module-pattern.md` — 120 lines max per component; `DashboardScreen` stays a dumb
  composition shell.
- `CLAUDE.md` §0 law 11 — never edit `src/components/ui/*`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/design-tokens.spec.ts` passes with `--radius-portal` present in BOTH `globals.css` and
  `THEME_CLASS_GROUPS.rounded`.
- Playwright at 1280×800: the hero grid element's two children have different `x` bounding-box
  values (2 columns); computed `gap` on the stack is `28px`; computed `border-radius` on a portal
  card is `24px`.
- Playwright at 375×800: the hero grid's children share the same `x` (1 column) and
  `document.documentElement.scrollWidth <= clientWidth`.
- axe: zero serious/critical on `/dashboard` en.
- Zero banned-pattern grep hits; no `[` arbitrary-value bracket introduced in any `className`.

## Assumptions
- W0 did not already emit a 24px radius token. If it did, use it and skip the token step.

## Evidence
<filled in as the task runs>
