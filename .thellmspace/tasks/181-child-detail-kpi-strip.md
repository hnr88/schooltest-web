---
id: 181
title: Build the child-detail KPI strip from real household metrics
layer: ui
kind: implement
slice: The five-cell KPI card under the header — CEFR band, ACARA phase, practice streak, last assessed, and band movement.
target: src/modules/children/components/ChildKpiStrip.tsx (new), src/modules/children/lib/child-detail-view-model.ts, src/i18n/messages/*.json
contract: C-DASH-HOUSEHOLD · C-CHILD-RESULT-HISTORY (date of the newest official result)
design: .qa/design/screens/portal--child-detail.html (L17-27) · .qa/design/spec/02-portal-children.md §B.2
status: TODO
depends_on: ["177", "178"]
---

## Objective

Build the design's KPI strip with five cells that every carry a real, sanctioned value — two of the
design's five cells are forbidden metrics (tasks `169`, `170`) and are replaced here.

## Contract

From `C-DASH-HOUSEHOLD` `children[]`: `cefrBand` (nullable Crosswalk lookup), `acaraPhase` (nullable),
`practiceDayStreak` (integer), `testsCompleted` (integer). From `C-CHILD-RESULT-HISTORY` page 1:
`data[0].publishedAt` / `createdAt` — the date of the newest official result (`createdAt` is
"ALWAYS present — fixes G5's unorderable rows"). Band movement is task `182`'s cell.

Vocabulary is fixed: ACARA phase ∈ Beginning / Emerging / Developing / Consolidating
(`SCHOOLTEST_ONSHORE_HANDOFF.md:151`); CEFR ∈ `pre_A1, A1, A2, B1, B2, C1`
(`docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`). No percentage, no computed score.

## Design source

`portal--child-detail.html` L17-27:
- Card: `bg-card rounded-3xl`, `padding:24px 30px` (`py-6 px-7.5` → W0 token or `px-8`),
  `--shadow-portal-card`, `flex flex-wrap gap-y-5 gap-x-0`.
- 5 cells: `flex-1 min-w-35` (140px). 4 dividers: `w-px bg-portal-rule mx-6.5` (26px → 24px normalised),
  `aria-hidden`.
- Label: 12px / `#9AA6B8` (W0 `--color-portal-muted-2`, `oklch(0.7215 0.0295 258.37)`) / `mb-1.5`
  → `text-xs text-portal-muted-2 mb-1.5`.
- Value: 24px / 700 / `-0.01em` → `text-2xl font-bold`; cells 1-4 `text-navy-900`,
  **cell 5 `text-primary`** (`#2563EB`).
- §B.2 wrapping note: with `min-width:140px` + 4 x 53px gutters the strip needs >= ~912px; below that
  cells wrap and the sibling dividers wrap with them (a known fragility) — this build hides the
  dividers below `lg` and uses a 2-column grid instead.

Cell mapping:

| # | Design label / value | This build |
|---|---|---|
| 1 | `Overall level` / `{{kid.level}}` | `Children.kpiLevel` / `cefrBand` or `Children.notBanded` |
| 2 | `Progress to {{next}}` / `68%` — **BLOCKED B-4** | `Children.kpiPhase` / `acaraPhase` or `Children.skillNotAssessed` |
| 3 | `Practice streak` / `{{streak}} days` | `Children.kpiStreak` / `{n} days` (ICU plural) |
| 4 | `Last result` / `74%` — **BLOCKED B-3** | `Children.kpiLastAssessed` / date of the newest official result, or `Children.neverAssessed` |
| 5 | `Since joining` / `+2 levels` (blue) | task `182` — band movement, blue |

## Files

- `src/modules/children/components/ChildKpiStrip.tsx` (new, <=120 lines).
- `child-detail-view-model.ts` — expose `lastResultAt`.
- Catalogs: `Children.kpiLevel`, `kpiPhase`, `kpiStreak`, `kpiStreakValue` (ICU plural
  `{count, plural, one {# day} other {# days}}`), `kpiLastAssessed`.

## Depends on

- `177` (view model + stack), `178` (the header above it).

## Steps

1. Render as a `<dl>`; each cell is a `dt` (label) + `dd` (value) pair so the pairing is exposed.
2. Keep the existing `[data-slot="stat-strip"]` session-metrics block out of this component — it is
   task `184` and it must keep its own `aria-label={t('metricsHeading')}` for `children-profile.spec.ts`.
3. Nulls render their honest catalog string at the same size — never `-`, never `0`, never a dash.
4. Cell 5's blue is `text-primary`, matching the design's single accent in the strip.

## Project rules

- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, 4pt spacing.
- `.claude/rules/i18n.md` — ICU plural for days; six catalogs.
- `.qa/intake/docs-constraints.md` §2, §3c, §3d — controlled vocabulary, no composite, CEFR is a lookup.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: each of the five values equals the corresponding field parsed from the live
  `GET /api/my/progress` / `GET /api/my/students/:id/results` responses; a child with no official
  result shows `Children.notBanded`, `Children.skillNotAssessed` and `Children.neverAssessed` rather
  than blanks.
- `await expect(kpiStrip).not.toContainText('%')` passes.
- Motion: the strip enters with `st-fade-in` 180ms `--ease-out-quart` after the header (40ms stagger);
  `motion-reduce:animate-none`.
- 375px: 2-column grid, dividers hidden, no h-scroll. 1280px: five cells in one row with dividers.
- axe zero serious/critical; six catalogs key-identical; `children-profile.spec.ts` green.

## Assumptions

`Children.cefrBands.*` and `Children.acaraPhases.*` display maps exist (added in `168` / here if not).

## Evidence

<!-- filled in as the task runs -->
