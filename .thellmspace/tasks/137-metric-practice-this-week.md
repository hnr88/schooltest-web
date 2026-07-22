---
id: 137
title: Metric 3 — "practice this week" hero stat, {H}h {MM}m from practiceSecondsThisWeek
layer: ui
kind: implement
slice: Design metric inventory row 3
target: src/modules/dashboard/lib/format-practice-duration.ts, src/modules/dashboard/components/DashboardHeroStats.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--main.html:36 · .qa/design/spec/01-portal-dashboard.md#4.3 #10 (row 3)
status: TODO
depends_on: ["135"]
---

## Objective
The second (and last) hero stat cell: total practice time across the household this week, in the
design's duration format.

## Contract
`C-DASH-HOUSEHOLD` → `data.household.practiceSecondsThisWeek` —
> `"practiceSecondsThisWeek": 15600,   // SUM(ended_at - started_at), mode='practice',
> status='complete', current ISO week`

## Design source
- Location: `portal--main.html:36`, hero stat row, second cell.
- **Visible label, exact wording: `practice this week`** — lowercase. No sub-label, no delta,
  no icon (spec §4.3). i18n key `Dashboard.hero.practiceWeekLabel`.
- Example value `4h 20m`. **Format, quoted from spec §4.3:** "duration, rendered `{H}h {MM}m` —
  hour has no leading zero, minutes zero-padded to 2."
  Verification against the contract example: `15600 s ⇒ 15600/3600 = 4 ⇒ "4h"; 15600 % 3600 = 1200
  ⇒ 1200/60 = 20 ⇒ "20m"` = `4h 20m` ✓ — the contract's example value and the design's agree.
- Rules for the cases the design does not show, fixed here so two builders cannot diverge:
  - Truncate, never round: `hours = Math.floor(s / 3600)`, `minutes = Math.floor((s % 3600) / 60)`.
  - Under one hour still renders the hour part: `0 ⇒ "0h 00m"`, `900 ⇒ "0h 15m"`. The design's
    format string has no conditional and inventing one would drift from it.
  - Negative or non-finite input is impossible under the Zod mirror; the helper throws in dev and
    returns `"0h 00m"` in prod rather than rendering `NaNh`.
  - The `h`/`m` unit letters are localisable: the helper returns `{ hours, minutes }` and the
    component renders `t('Dashboard.hero.durationHm', { hours, minutes })` = `"{hours}h {minutes}m"`
    with `minutes` pre-padded to 2 by the helper. Six catalogs may reorder or re-letter it.
- Value/label styling inherited from the 135 cell spec (`text-h3 font-bold`, `text-xs
  text-navy-muted`). `data-metric="practice-week"`.

## States
- **loading** — value slot is a `w-16 h-6 rounded-md shimmer-sweep` block; the label stays visible.
- **empty** — `0` seconds renders `0h 00m`. This is the true answer for a family that has not
  practised; it is not an empty state and the cell is not hidden.
- **error** — 155 replaces the panel; this cell never renders a fallback duration.

## Files
- CREATE `src/modules/dashboard/lib/format-practice-duration.ts` — `formatPracticeDuration(seconds:
  number): { hours: number; minutes: string }`. Pure, no i18n inside.
- CREATE `tests/unit/format-practice-duration.test.ts` — table test: 0, 59, 60, 900, 3599, 3600,
  15600, 86399.
- EDIT `DashboardHeroStats.tsx` — feed cell 2.
- i18n: `Dashboard.hero.practiceWeekLabel`, `Dashboard.hero.durationHm`.

## Depends on
- **135** — the row and the cell component.

## Steps
1. Write the unit test first (red), then the helper (green) — `.claude/rules/testing.md` TDD.
2. Wire cell 2; render the ICU duration string.
3. Six-catalog keys.

## Project rules
- `.claude/rules/module-pattern.md` — the formatter is a pure utility, so `lib/`, not the component.
- `.claude/rules/testing.md` — TDD red→green; a unit test is NOT proof of the feature, the
  Playwright run is (D-VERIFY-1).
- `.claude/rules/i18n.md` — unit letters are translatable, never hardcoded in TSX.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean; `pnpm test --run` green for the new unit test.
- Playwright: `[data-metric="practice-week"] dd` text === the value the test computes from the live
  `GET /api/my/progress` `practiceSecondsThisWeek` using the same truncation rule. Hardcoded = fail.
- Postgres cross-check: the seconds equal
  `select coalesce(sum(extract(epoch from (ended_at - started_at))),0) from sessions …
  mode='practice' and status='complete' and started_at >= <ISO week Monday>` on `127.0.0.1:5540`;
  survives a reload.
- Route-stub `practiceSecondsThisWeek: 0` ⇒ renders `0h 00m`; stub `900` ⇒ `0h 15m`; stub `15600`
  ⇒ `4h 20m`.
- `/zh/dashboard` renders the zh duration string from the same numbers.
- axe clean; six catalogs key-identical; zero banned-pattern hits.

## Assumptions
- `practiceSecondsThisWeek` is a whole number of seconds; the contract shows an integer.

## Evidence
<filled in as the task runs>
