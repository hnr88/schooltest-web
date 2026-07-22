---
id: 168
title: Build the ChildCard metric strip from real household metrics (streak, tests, last assessed)
layer: ui
kind: implement
slice: Row 2 of the child card — three real metric cells replacing the design's two forbidden percentages.
target: src/modules/children/components/ChildCardMetrics.tsx (new), src/modules/children/lib/children-list-view-model.ts, src/i18n/messages/*.json
contract: C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--my-children-list.html (L22-28) · .qa/design/spec/02-portal-children.md §A.5 "Row 2 — MetricStrip"
status: TODO
depends_on: ["167"]
---

## Objective

Render the design's three-cell metric strip with the three metrics this system genuinely has:
`day streak`, `tests completed`, and `last assessed` (CEFR band + date). This is the honest
replacement slice that tasks 169 (B-3) and 170 (B-4) refuse to fake.

## Contract

`C-DASH-HOUSEHOLD` `data.children[]`:
- `practiceDayStreak` — "consecutive calendar days back from today with >=1 complete practice session".
- `testsCompleted` — integer.
- `lastActivityAt` — "max(sessions.ended_at, results.published_at_field); **nullable**".
- `cefrBand` / `acaraPhase` — nullable Crosswalk lookups, never computed
  (`docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:192`).
Nothing else may enter a cell. `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:46` — "There is no
cross-skill composite score anywhere in the system."

## Design source

`portal--my-children-list.html` L22-28:

- Strip: `flex gap-0; border-top:1px solid #EEF1F6` (W0 `--color-portal-rule`) `padding-top:20px`
  → `border-t border-portal-rule pt-5`.
- 3 cells, each `flex-1`; 2 dividers `width:1px; background:#EEF1F6; margin:0 18px` (37px effective
  gutter) → `w-px bg-portal-rule mx-[18px]` becomes the W0 spacing token or normalised `mx-4`.
- Value: 20px / 700 / `#0E2350` / `letter-spacing:-0.01em` → `text-xl font-bold text-navy-900`.
- Label: 12px / `#7C8698` / `margin-top:2px` → `text-xs text-portal-muted mt-0.5`.

Cell mapping (design template → honest value):

| Cell | Design | This build |
|---|---|---|
| 1 | `{{k.progress}}%` / `to {{k.nextLevel}}` — **BLOCKED B-4** | `{practiceDayStreak}` / `Children.dayStreak` |
| 2 | `{{k.streak}}` / `day streak` | `{testsCompleted}` / `Children.testsCompleted` |
| 3 | `{{k.lastScore}}` / `last result` — **BLOCKED B-3** | `{cefrBand ?? notBanded}` / `Children.lastAssessed` with the `lastActivityAt` date as the label suffix |

## Files

- `src/modules/children/components/ChildCardMetrics.tsx` (new).
- `children-list-view-model.ts` — expose `lastAssessedAt` (ISO) already carried on the row.
- Catalogs: `Children.dayStreak` (`{count, plural, one {# day streak} other {# day streak}}` — keep
  the design's bare-integer-value + label-carries-unit shape: value cell = the integer, label =
  `day streak`), `Children.testsCompleted`, `Children.lastAssessed`, `Children.neverAssessed`.

## Depends on

- `167` — the card shell this row lives in.

## Steps

1. Streak cell: integer value, label `Children.dayStreak`. `0` is a real value and renders as `0`
   (never `-`, never hidden).
2. Tests cell: `testsCompleted` integer, label `Children.testsCompleted`.
3. Last-assessed cell: value = `cefrBand` (uppercased exactly as the enum, `pre_A1` displayed via
   `Children.cefrBands.pre_A1`), label = `format.dateTime(lastActivityAt, { dateStyle: 'medium' })`.
   When `cefrBand` is null the value is `Children.notBanded` at the same size and the label is
   `Children.neverAssessed`.
4. Dividers are `aria-hidden` presentational `<span>`s; the strip itself is a `<dl>` with `dt`/`dd`
   so the value/label pairing survives a screen reader.
5. No `%` character may appear anywhere in this component — assert it in the e2e.

## Project rules

- `.claude/rules/i18n.md` — ICU plural for the streak; six catalogs.
- `.claude/rules/tailwind.md` — tokens only; `gap-*` not margin (the dividers are the exception the
  design ships and stay `w-px` siblings).
- `.qa/intake/docs-constraints.md` §3c/§3d — no composite, CEFR is a lookup.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: for each rendered card, the three cell values equal the corresponding
  `children[].practiceDayStreak` / `testsCompleted` / `cefrBand` fields parsed from the live
  `GET /api/my/progress` response; a child whose `cefrBand` is `null` shows `Children.notBanded`.
- `await expect(card).not.toContainText('%')` passes on every card.
- Motion: the strip inherits the card's entrance (`st-fade-in`, 180ms, `--ease-out-quart`); values do
  not count up (no fabricated animation of a number). `motion-reduce:animate-none`.
- 375px: three cells stay on one row at 343px content width (each ~101px minus the 2 x 1px dividers +
  32px margins) — verified by screenshot; if the value string overflows, the cell wraps its label,
  never the page.
- axe zero serious/critical; six catalogs key-identical; `students-list.spec.ts` green.

## Assumptions

`Children.cefrBands.*` display labels for the six enum values are added here if W3 did not already
add them; `pre_A1` renders as `Pre-A1`.

## Evidence

<!-- filled in as the task runs -->
