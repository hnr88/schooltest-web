---
id: 142
title: Metric 5 — strongest-day caption from household.strongestDay, without the unservable clause
layer: ui
kind: implement
slice: Design metric inventory row 5
target: src/modules/dashboard/components/DashboardPracticeCaption.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--main.html:54 · .qa/design/spec/01-portal-dashboard.md#4.4 #10 (row 5)
status: TODO
depends_on: ["140", "130"]
---

## Objective
The caption under the bars naming the week's strongest practice day and its minutes.

## Contract
`C-DASH-HOUSEHOLD` →
> `"strongestDay": { "date": "2026-07-19", "weekday": "T", "seconds": 5280 }  // argmax of
> practiceByDay, null when every day is 0`

The `null` case is contractual and must be handled, not assumed away.

## Design source
- Caption node (`portal--main.html:54`): `margin-top:16px; font-size:13px; color:#7C8698`
  → `mt-4 text-caption text-muted-foreground` (`mt-4` = 16px ✓, `--text-caption` = 13px ✓).
  `data-slot="dashboard-practice-caption"`.
- Design copy:
  > Thursday was the strongest day — **88 min**, mostly Emma's speaking drills.

  `88 min` is `color:#0E2350; font-weight:600` → `font-semibold text-navy-900` inside `t.rich`.
- **The trailing clause is dropped and this is why.** "mostly Emma's speaking drills" needs a
  per-day × per-child × per-skill breakdown of practice sessions. `C-DASH-HOUSEHOLD` returns
  `practiceByDay` as `{date, weekday, seconds}` only, and `.qa/intake/api-inventory.md` **G3 — No
  parent-reachable session data of any kind** confirms a parent cannot read sessions to derive it.
  Rendering a guessed child+skill would be fabrication. The clause is not shipped and no
  approximation replaces it.
- Shipped copy, `Dashboard.practice.strongestDay`:
  `"{day} was the strongest day — <b>{minutes} min</b>."` — `{day}` formatted from
  `strongestDay.date` via `useFormatter().dateTime(d, { weekday: 'long' })` (locale-aware; never the
  API's English `weekday` letter). `{minutes}` = `Math.floor(strongestDay.seconds / 60)` formatted
  with `useFormatter().number()`.
- `strongestDay === null` ⇒ `Dashboard.practice.noPractice`:
  "No practice recorded in the last 7 days." Same node, same styling, no emphasis span. Never an
  empty caption slot (the card would end on a row of grey stubs with no explanation).
- Motion: the caption enters with the card (156); it has no motion of its own so the number does not
  count up — a count-up would be motion for its own sake on a factual figure.

## Files
- CREATE `src/modules/dashboard/components/DashboardPracticeCaption.tsx` (≤50 lines).
- EDIT `DashboardPracticeChart.tsx` — mount after the plot.
- i18n: `Dashboard.practice.strongestDay`, `Dashboard.practice.noPractice`.

## Depends on
- **140** (card), **130** (household data).

## Steps
1. Build the component with the two branches.
2. `t.rich` for the emphasised minutes span.
3. Six-catalog keys.

## Project rules
- `.claude/rules/i18n.md` — never build the sentence by concatenating translated fragments; one ICU
  message with a `<b>` tag.
- `.claude/rules/quality.md` — the emphasis is styling only; the sentence reads correctly without it.
- `.qa/CONTRACTS.md` governing rules + `.qa/intake/api-inventory.md` G3 — no fabricated attribution.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright against live data: the caption text equals the sentence the test rebuilds from
  `GET /api/my/progress`'s `strongestDay` (long weekday in the page locale + floor(seconds/60)).
  Hardcoded expected text is a fail.
- The emphasised span has computed `font-weight: 600` and colour resolving to
  `oklch(0.2692 0.0871 263.0388)`.
- Null branch: `page.route` a body with `strongestDay: null` and an all-zero `practiceByDay` ⇒ the
  caption renders `Dashboard.practice.noPractice` and the emphasis span is absent.
- The weekday in the caption matches the highlighted bar from 141 (same date) — asserted by index.
- `grep -rniE "drills|mostly .*'s" src/modules/dashboard src/i18n/messages` returns nothing.
- `/zh/dashboard` renders the zh weekday. axe clean; six catalogs key-identical.

## Assumptions
- Minutes are floored, consistent with 137's truncation rule, so the caption and the hero never
  disagree by a rounding step.

## Evidence
<filled in as the task runs>
