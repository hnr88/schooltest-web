---
id: 061
title: Author the pure ISO-week / trailing-7-day / practice-streak helpers for the household aggregate
layer: backend
kind: build
slice: GET /api/my/progress — the date-boundary arithmetic every practice metric depends on
target: schooltest-api/src/utils/household-window.ts · schooltest-web/tests/e2e/household-window.spec.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#44-metric-4--practice-minutes-last-7-days-bar-chart-card · .qa/design/screens/portal--main.html:40-55
status: TODO
depends_on: []
---

## Objective

Put every calendar boundary the dashboard depends on into ONE pure, strapi-free module so it can
be tested exhaustively and cannot drift between the household total, the 7-day chart and the
per-child streak. This is the highest-risk logic in W2 — an off-by-one on the week boundary makes
every practice number wrong and nothing else in the stack will catch it.

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD**. The three boundary definitions this module owns:

- `testsCompletedThisWeek` — sessions with `started_at` inside "the current ISO week (Mon 00:00
  local)".
- `practiceByDay` — "EXACTLY 7 entries, oldest → newest, trailing 7 days incl. today", each
  `{ date: "YYYY-MM-DD", weekday: "M"|"T"|"W"|"T"|"F"|"S"|"S", seconds: int }`.
- `practiceDayStreak` — "consecutive calendar days back from today with >= 1 complete practice
  session".
- `strongestDay` — "argmax of practiceByDay, **null when every day is 0**".

## Design source

`.qa/design/spec/01-portal-dashboard.md` §4.4 (`portal--main.html:40-55`):

- The plot area holds **exactly 7** bar columns, `gap:14px`, `min-height:120px`.
- Weekday letters in markup order are **`M T W T F S S`** — Monday-first, single uppercase
  letter, `font-size:11px`. The Thursday column is the highlighted one at `font-weight:600`.
- Header range label is the literal **`last 7 days`** (`12.5px`, `#7C8698`).
- §4.4's IMPLICATION note: `34+52+42+88+60+26+14 = 316 min` contradicts the hero's `4h 20m`
  (`260 min`) — the design's two numbers are not one dataset. This module returns **seconds**; the
  `{H}h {MM}m` formatting and the bar-height normalisation (`min-height:120px` scaled from the max,
  never px = minutes) are W5's, per §4.4's closing paragraph.
- §10 row 5: strongest day is the argmax over row 4.

No colour/size value belongs in this task — it ships no UI.

## Files

- CREATE `schooltest-api/src/utils/household-window.ts`
- CREATE `schooltest-web/tests/e2e/household-window.spec.ts`

## Depends on

Nothing.

## Steps

1. Read `schooltest-api/src/utils/result-view.ts` — the precedent for a "pure, strapi-free,
   probe-testable" util module living in `src/utils/` with a doc comment naming its contract.
2. Author, all pure functions taking an explicit `now: Date` (never reading the clock internally —
   that is what makes them testable and what stops two metrics using two different "now"s):
   - `isoWeekStartUtc(now: Date): Date` — Monday 00:00:00.000 UTC of `now`'s ISO week.
   - `trailingSevenDayKeys(now: Date): string[]` — 7 `YYYY-MM-DD` keys, oldest → newest, last
     entry = `now`'s UTC date.
   - `weekdayLetter(dateKey: string): 'M'|'T'|'W'|'F'|'S'` — Mon→`M`, Tue→`T`, Wed→`W`, Thu→`T`,
     Fri→`F`, Sat→`S`, Sun→`S` (the design's exact letters; Tue and Thu deliberately collide, as
     do Sat and Sun).
   - `sessionSeconds(startedAt: string | null, endedAt: string | null): number` — `0` when either
     end is null or the delta is negative; otherwise `floor((ended - started) / 1000)`.
     **2449 of 2611 rows in the live `sessions` table have `ended_at`, 162 do not** — a null
     `ended_at` is a real, common state, never an error.
   - `bucketByDay(rows, keys): Record<string, number>` — sum of `sessionSeconds` per UTC date key,
     every key present with at least `0`.
   - `argmaxDay(buckets, keys): { date, weekday, seconds } | null` — **null when every value is 0**;
     ties break on the EARLIEST key so the result is deterministic.
   - `consecutiveDayStreak(dateKeys: Set<string>, now: Date): number` — walk back from `now`'s UTC
     date while the key is present; stop at the first gap; `0` when today is absent.
3. Every function is exported; the module imports nothing from `@strapi/strapi`.
4. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.
5. Write the Playwright spec asserting, with fixed `now` values (no live clock):
   - `isoWeekStartUtc(new Date('2026-07-22T09:24:58Z'))` (a Wednesday) → `2026-07-20T00:00:00.000Z`;
   - the Monday case is idempotent, and the **Sunday** case returns the PRECEDING Monday
     (the classic ISO off-by-one);
   - `trailingSevenDayKeys` has length 7, is strictly increasing, ends on today's key;
   - `weekdayLetter` over one full week returns exactly `['M','T','W','T','F','S','S']`;
   - `sessionSeconds(x, null) === 0` and a negative delta returns `0`;
   - `argmaxDay` of an all-zero week is `null`;
   - `consecutiveDayStreak` returns `0` when today is missing and `3` for today/-1/-2 with a gap
     at -3;
   - a month-boundary and a year-boundary case (`2025-12-31` → `2026-01-01`).

## Project rules

- `schooltest-api/CLAUDE.md` §2 rule 7 (TS only), rule 20 (`Promise.all`, never await-in-loop —
  this module does no I/O at all, which is the point), rule 23.
- `.claude/rules/typescript.md` — strict, no `any`, no `require`.
- `schooltest-web/.claude/rules/testing.md` — TDD red → green; the spec is written first.

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `cd schooltest-web && pnpm exec playwright test tests/e2e/household-window.spec.ts` passes, with
  at least the 9 assertion groups above, all using injected `now` values.
- `grep -n "new Date()" schooltest-api/src/utils/household-window.ts` returns NOTHING — the clock
  is always a parameter.
- `grep -n "strapi" schooltest-api/src/utils/household-window.ts` returns NOTHING — the module is
  pure.
- No user-facing string, no i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression unchanged (157 passed / 1 pre-existing fail).

## Assumptions

- **Boundaries are computed in UTC, not "local".** The addendum says "Mon 00:00 local", but
  `schooltest-api` configures no timezone anywhere: `.env` has no `TZ`, `config/*.ts` has no
  `timeZone`, and the host currently runs EEST. "Local" is therefore undefined and would make the
  numbers depend on which machine served the request. UTC is chosen because Postgres stores these
  columns as timestamptz and UTC is the only boundary that is reproducible in a Playwright
  assertion. Recorded here as a deliberate deviation from the addendum's wording, not an
  oversight; if the product later fixes a display timezone (Australia/*), it becomes a one-line
  change in this module and nowhere else — which is the reason for centralising it.
- `now` is passed once per request by the service (062/063) so the week total, the 7 buckets and
  every per-child streak cannot straddle midnight mid-request.

## Evidence

<!-- filled in as the task runs -->
