---
id: 140
title: Build the "Practice minutes" card shell — header, range label, 120px plot area
layer: ui
kind: build
slice: The practice-minutes chart card container (design §4.4), without bars
target: src/modules/dashboard/components/DashboardPracticeChart.tsx
contract: n/a (presentation)
design: .qa/design/screens/portal--main.html:40-45 · .qa/design/spec/01-portal-dashboard.md#4.4
status: TODO
depends_on: ["131"]
---

## Objective
The right cell of the hero grid: a white 24px card with a baseline-aligned header and an empty
bottom-aligned plot area sized to the design. Bars (141) and caption (142) land inside.

## Contract
n/a. Quoted design, `portal--main.html:40`:
> `background:#FFFFFF; border-radius:24px; padding:28px 30px;
> box-shadow:0 1px 2px rgba(14,35,80,.04); display:flex; flex-direction:column`

## Design source
- Card → `flex flex-col rounded-portal bg-card p-8 shadow-sm`.
  `--color-card` = `oklch(1 0 89.8756)`; `--shadow-sm` = `0 1px 2px oklch(0.2692 0.0871 263.0388 /
  6%)` — the design's `.04` alpha vs the token's `.06`; the token is the sanctioned value (spec
  §0 records the mismatch). `p-8` = 32px vs 28/30px, 2-4px delta, accepted over an arbitrary value.
  `data-slot="dashboard-practice-chart"`.
- Header row (`:41`): `display:flex; align-items:baseline; justify-content:space-between`
  → `flex items-baseline justify-between`.
  - `<h2>` **"Practice minutes"** — `16px / 600 / #0E2350` → `text-base font-semibold text-navy-900`
    (`text-base` = 1rem = 16px ✓ exact). Key `Dashboard.practice.title`.
  - Range label **"last 7 days"** — `12.5px / #7C8698` → `text-meta text-muted-foreground`
    (`--text-meta` = 12.5px ✓). Key `Dashboard.practice.range`.
- Plot area (`:45`): `flex:1; display:flex; align-items:flex-end; gap:14px; margin-top:20px;
  min-height:120px` → `mt-5 flex min-h-30 flex-1 items-end gap-3.5`.
  `mt-5` = 20px ✓, `gap-3.5` = 14px ✓, `min-h-30` = 7.5rem = 120px ✓ exact.
  `data-slot="dashboard-practice-plot"`.
- Heading level: the page `<h1>` is the greeting (132), so this is an `<h2>` — ordered headings per
  `.claude/rules/quality.md`.
- Motion: none for the shell; 141 animates the bars, 156 the card entrance.
- 375px: card keeps its full width in the collapsed 1-column grid; `p-6` at `max-sm`.

## Files
- CREATE `src/modules/dashboard/components/DashboardPracticeChart.tsx` — shell + header + plot slot.
- EDIT `DashboardScreen` — mount in the hero grid's second cell.
- i18n: `Dashboard.practice.title`, `Dashboard.practice.range`.

## Depends on
- **131** — `rounded-portal` and the hero grid.

## Steps
1. Build the card, header and plot area.
2. Confirm the plot area is exactly 120px tall when empty and grows with the card.

## Project rules
- `.claude/rules/tailwind.md` — no arbitrary values; token colours; `gap-*` not margin between
  siblings.
- `.claude/rules/quality.md` — ordered headings, one `h1` per page.
- `.claude/rules/module-pattern.md` — ≤120 lines.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `[data-slot="dashboard-practice-chart"]` computed `border-radius` is `24px` and
  `background-color` resolves to the card token; `[data-slot="dashboard-practice-plot"]`
  `getBoundingClientRect().height >= 120`.
- The `h2` text equals `en.json` `Dashboard.practice.title`; heading order on the page is h1→h2 with
  no skipped level (axe `heading-order` clean).
- 375px: no horizontal overflow; card spans the single column. axe clean.
- Six catalogs key-identical; zero banned-pattern hits.

## Assumptions
- none

## Evidence
<filled in as the task runs>
