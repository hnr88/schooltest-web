---
id: "096"
title: Derive the practice duration, the 7-bar chart model and the strongest-day model from the household payload
layer: data
kind: build
slice: Design metrics #3, #4 and #5 — `4h 20m`, the seven normalised bars, and the strongest-day caption inputs
target: src/modules/dashboard/lib/practice-time.ts · src/modules/dashboard/lib/practice-chart.ts · src/modules/dashboard/types/household-progress.types.ts · src/modules/dashboard/index.ts · tests/e2e/w3-household-contract.spec.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#4.3 Metric 3 — Practice this week · #4.4 Metric 4 — Practice minutes, last 7 days · #4.5 (caption)
status: TODO
depends_on: ["094"]
---

## Objective

The API returns seconds. The design shows `4h 20m`, seven bars normalised into a `120px` plot with
the max day highlighted, and a caption naming the strongest day. Put those three derivations in pure,
testable functions so W5's chart component stays dumb, and so the design's own arithmetic bug is
fixed once rather than copied into JSX.

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD**, the fields consumed:

- `household.practiceSecondsThisWeek` — `SUM(ended_at - started_at)`, `mode='practice'`,
  `status='complete'`, current ISO week. Non-negative integer seconds.
- `household.practiceByDay` — **EXACTLY 7 entries, oldest → newest, trailing 7 days incl. today**,
  each `{ date: "2026-07-16", weekday: "M", seconds: 2040 }`.
- `household.strongestDay` — `{ date, weekday, seconds }`, **argmax of `practiceByDay`, null when
  every day is 0**.

Read-only data; these helpers add nothing to it and must not re-derive `strongestDay` differently
from the server. If a client recomputation disagrees with `strongestDay`, that is a drift alarm the
e2e asserts — not something to paper over.

## Design source

`.qa/design/spec/01-portal-dashboard.md`:

**§4.3 Metric 3** (`portal--main.html:36`)
- Label `practice this week` (exact lowercase wording). Example `4h 20m`.
- Format: **`{H}h {MM}m` — hour has no leading zero, minutes zero-padded to 2.**

**§4.4 Metric 4** (`portal--main.html:40–52`)
- Card `background:#FFFFFF; border-radius:24px; padding:28px 30px; box-shadow:0 1px 2px rgba(14,35,80,.04)`.
- Header `h2` "Practice minutes" `16px/600/#0E2350` (`--color-navy-900`); range "last 7 days" `12.5px/#7C8698`.
- Plot `flex:1; display:flex; align-items:flex-end; gap:14px; margin-top:20px; min-height:120px`.
- Bar column `flex:1; display:flex; flex-direction:column; align-items:center; gap:8px`;
  bar `width:100%; max-width:30px; border-radius:8px`; weekday letter `font-size:11px`.
- Highlight rule: **the max-value day is filled `#0E2350` and its label goes weight `600` colour
  `#0E2350`; all other days bar `#E4E9F2` + label `#9AA6B8` weight `400`.**
- The design's own note, quoted: *"bar `height` in px equals the minutes value 1:1 for Thursday
  (`88px` ↔ `88 min`) … the week totals `316 min = 5h 16m`, which contradicts the hero's `4h 20m`.
  … A real implementation must **normalise bar height to `min-height:120px` from the max value**
  rather than copy px = minutes."* This task implements that instruction.

**§4.4 caption** (`portal--main.html:54`) — `margin-top:16px; font-size:13px; color:#7C8698`:
> Thursday was the strongest day — **88 min**, mostly Emma's speaking drills.
`88 min` renders `color:#0E2350; font-weight:600`.
The trailing clause *"mostly Emma's speaking drills"* has **no data source** — the household payload
carries no per-day, per-child, per-skill breakdown. It is dropped, and the caption template ends at
the minutes (task 101 authors the shortened key). Recorded here, not invented.

Colour tokens per `.qa/design/spec/04-ds-foundations.md` TAILWIND V4 MAPPING: `#0E2350` →
`--color-navy-900`, `#7C8698` → the portal muted-foreground token registered by W0. **This task
applies no colour** — it returns `isMax: boolean` and W5 binds the tokens.

## Files

Create:
- `src/modules/dashboard/lib/practice-time.ts`
- `src/modules/dashboard/lib/practice-chart.ts`

Touch:
- `src/modules/dashboard/types/household-progress.types.ts` — add `PracticeDuration`, `PracticeBar`,
  `PracticeChartModel`.
- `src/modules/dashboard/index.ts` — export the helpers and types.
- `tests/e2e/w3-household-contract.spec.ts` — add one `test()`
  (`'practice derivations match the live household payload'`).

## Depends on

- **094** — `HouseholdSummary` / `HouseholdPracticeDay` types are the inputs.

## Steps

1. `lib/practice-time.ts`, pure:
   - `export function toPracticeDuration(seconds: number): PracticeDuration` returning
     `{ hours: number; minutes: number; totalMinutes: number }` where
     `totalMinutes = Math.floor(seconds / 60)`, `hours = Math.floor(totalMinutes / 60)`,
     `minutes = totalMinutes % 60`. Truncation (not rounding) is deliberate: a parent must never be
     shown more practice than actually happened.
   - It returns NUMBERS, not a string. The `{H}h {MM}m` assembly and the zero-padding happen in the
     locale catalog (task 101: `Dashboard.practiceDurationValue = "{hours}h {minutes}m"` with
     `minutes` pre-padded by this helper as `minutesLabel: string` — a two-character zero-padded
     string) so the format survives translation. Both fields are returned; W5 picks.
   - Guard: negative or non-finite input ⇒ treat as `0` and return zeros (defensive, because the
     schema already forbids it, so this branch is unreachable-by-contract and is documented as such).
2. `lib/practice-chart.ts`, pure:
   - `export function toPracticeChart(days: HouseholdPracticeDay[], plotHeightPx = 120): PracticeChartModel`
     where `PracticeBar = { date: string; weekday: string; seconds: number; minutes: number; heightPx: number; isMax: boolean }`
     and `PracticeChartModel = { bars: PracticeBar[]; maxSeconds: number; hasAnyPractice: boolean }`.
   - Normalisation: `heightPx = maxSeconds === 0 ? 0 : Math.max(MIN_BAR_PX, Math.round((seconds / maxSeconds) * plotHeightPx))`
     with `MIN_BAR_PX = 4` so a non-zero day is never invisible, and a **zero day is exactly 0** —
     never a floor value, because a fake stub bar reads as practice that did not happen.
   - `isMax` is true for the day whose `seconds` equals `maxSeconds`, **only when `maxSeconds > 0`**,
     and on a tie only for the LATEST such day (the array is oldest→newest; ties get one highlight,
     matching the design which highlights exactly one bar).
   - `hasAnyPractice = maxSeconds > 0`. When false, W5 suppresses the caption entirely (see the
     "ready-no-practice" state in task 095's contract table).
   - Assert-by-construction: the function throws if `days.length !== 7`. The schema already enforces
     `.length(7)`; this makes a future caller that slices the array fail loudly.
   - `export function getStrongestBar(model: PracticeChartModel): PracticeBar | null`.
3. Types added to `types/household-progress.types.ts`; helpers exported from the dashboard barrel.
4. e2e case: against the LIVE `GET /api/my/progress` body —
   - `toPracticeChart(data.household.practiceByDay).bars` has length 7 and `heightPx` ≤ 120 for all;
   - when `data.household.strongestDay !== null`, `getStrongestBar(...)?.date === data.household.strongestDay.date`
     (client↔server agreement); when it is `null`, `hasAnyPractice === false`;
   - `toPracticeDuration(data.household.practiceSecondsThisWeek).totalMinutes === Math.floor(seconds/60)`
     and `minutesLabel` is always 2 characters.

## Project rules

- `schooltest-web/.claude/rules/module-pattern.md` — pure utilities in `lib/`, types in `types/`;
  components carry no business logic, so this arithmetic must not end up in the chart component.
- `schooltest-web/.claude/rules/tailwind.md` — no arbitrary values in the eventual markup; the bar
  height is an inline computed `style` on a data-driven element (the one sanctioned exception, since
  it is a runtime value, not a design token) and every COLOUR comes from a token. This task returns
  the number; W5 must not turn it into `h-[88px]`.
- `schooltest-web/.claude/rules/i18n.md` — never hardcode a user-facing string; that is why this
  file returns numbers plus a padded string, not `"4h 20m"`.
- `.qa/DECISIONS.md` **D-SCOPE-1.4** — no invention: the caption's "mostly Emma's speaking drills"
  clause is dropped, not synthesised.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-household-contract.spec.ts` passes including the new
  derivation case, computed over the LIVE payload.
- Evidence records the actual live numbers: `practiceSecondsThisWeek`, the derived `{H}h {MM}m`
  string W5 would render, the seven `heightPx` values, and the `isMax` index — plus confirmation
  that it equals the server's `strongestDay`.
- `grep -rn "88\|316\|4h 20m" src/modules/dashboard/lib/` → zero hits (no design sample data leaks
  into code).
- `grep -rn "as any\|: any\|@ts-ignore" src/modules/dashboard/lib/practice-*.ts` → zero hits.
- No user-facing string in this task (the format template lands in task 101) → six catalogs untouched
  and still key-identical.
- Non-UI slice: no motion / viewport / axe criteria; W5's chart carries the bar grow-in animation
  and its `prefers-reduced-motion` variant.
- Playwright baseline unchanged.

## Assumptions

- `plotHeightPx` defaults to the design's `min-height:120px`; W5 may pass a smaller value at 375px.
  The helper is parameterised so the mobile composition does not need a second implementation.

## Evidence

<!-- filled in as the task runs -->
