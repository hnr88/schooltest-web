---
id: 136
title: Metric 1 — "tests completed" hero stat from household.testsCompletedThisWeek
layer: ui
kind: implement
slice: Design metric inventory row 1
target: src/modules/dashboard/components/DashboardHeroStats.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--main.html:32 · .qa/design/spec/01-portal-dashboard.md#4.1 #10 (row 1)
status: TODO
depends_on: ["135"]
---

## Objective
The first hero stat cell: an integer count of the family's completed tests this week.

## Contract
`C-DASH-HOUSEHOLD` → `data.household.testsCompletedThisWeek` —
> `"testsCompletedThisWeek": 7,        // same, started_at within the current ISO week (Mon 00:00 local)`

**Field choice is deliberate.** The response also carries `testsCompleted` (all children, **all
time**). The stat sits under the panel's "This week" eyebrow (`portal--main.html:29`) and the metric
inventory row 1 reads "count of completed test sessions across all children of the parent, **within
the current ISO week**". Therefore `testsCompletedThisWeek`, never `testsCompleted`. Using the
all-time field would silently change the metric's meaning.

## Design source
- Location: `portal--main.html:32`, hero stat row, first cell.
- **Visible label, exact wording from the design: `tests completed`** — lowercase, no leading
  capital, no unit, no icon, no trend/delta indicator (spec §4.1 states all three are absent).
  i18n key `Dashboard.hero.testsCompletedLabel` = `"tests completed"`.
- Example value `7`. **Format: plain integer**, no thousands separator in the design — but render
  through next-intl `useFormatter().number(value)` so a locale that groups (e.g. `zh`) is correct;
  at realistic household magnitudes (<1000) this is identical to the design.
- Value style `24px / 700 / -0.02em / #FFFFFF`; label `12px / 400 / #8FA3C7 / margin-top:3px`
  (inherited from the 135 cell spec — this task supplies data and copy only).
- `data-metric="tests-completed"` on the cell.

## States
- **loading** — the whole hero renders the 154 skeleton; this cell's placeholder is a
  `w-10 h-6 rounded-md shimmer-sweep` block in the value slot with the real label already visible
  (labels are static copy, so they must not flash). `aria-busy="true"` on the row.
- **empty** — `testsCompletedThisWeek === 0` renders `0`, not a dash and not a hidden cell. Zero is
  a true answer here; hiding it would be dishonest in the other direction.
- **error** — the cell is never rendered in isolation on error; 155 replaces the whole panel with
  the page error state. This cell must not render a `—`, `?` or last-known value.
- **null/undefined** — impossible: the Zod mirror (090) makes the field required. If parsing fails
  the query errors and 155 takes over.

## Files
- EDIT `src/modules/dashboard/components/DashboardHeroStats.tsx` — feed cell 1.
- i18n: `Dashboard.hero.testsCompletedLabel` in all six catalogs.

## Depends on
- **135** — the row and the cell component.

## Steps
1. Pass `household.testsCompletedThisWeek` into cell 1 with the label key.
2. Format via `useFormatter().number()`.
3. Add the six-catalog label key.

## Project rules
- `.claude/rules/i18n.md` — label through `t()`; six catalogs identical.
- `.claude/rules/state-data.md` — no derivation in the component; the value arrives ready.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: read the live `GET /api/my/progress` body in the test; assert
  `[data-metric="tests-completed"] dd` text === `String(body.data.household.testsCompletedThisWeek)`.
  A hardcoded expected number is a fail.
- Cross-check against Postgres: the same number equals
  `select count(*) from sessions s join students st on … where st.parent = <parent> and s.status =
  'complete' and s.started_at >= <ISO week Monday 00:00>` run over `127.0.0.1:5540`. Reload the page
  — the number survives.
- Label text === `en.json` `Dashboard.hero.testsCompletedLabel` and is lowercase "tests completed".
- Route-stub `testsCompletedThisWeek: 0` ⇒ the cell renders `0` and is still visible.
- axe clean; six catalogs key-identical; zero banned-pattern hits.

## Assumptions
- The API computes the ISO week boundary; the client never recomputes it.

## Evidence
<filled in as the task runs>
