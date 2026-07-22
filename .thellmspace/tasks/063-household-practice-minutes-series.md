---
id: 063
title: Add practiceSecondsThisWeek, the 7-day practiceByDay series and strongestDay to /api/my/progress
layer: backend
kind: implement
slice: GET /api/my/progress — the practice-minutes chart data and its strongest-day argmax
target: schooltest-api/src/api/student/services/parent-dashboard.ts · src/contracts/parent-household-progress.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#43-metric-3--practice-this-week · #44-metric-4--practice-minutes-last-7-days-bar-chart-card · .qa/design/screens/portal--main.html:36,40-55
status: TODO
depends_on: [061, 062]
---

## Objective

Serve the data behind the design's "Practice minutes / last 7 days" chart card and its caption, and
behind the hero's `practice this week` stat — computed from real `sessions` rows, in seconds, with
no invented normalisation.

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD**. Keys this task adds to `data.household`:

```jsonc
"practiceSecondsThisWeek": 15600,   // SUM(ended_at - started_at), mode='practice',
                                    // status='complete', current ISO week
"practiceByDay": [                  // EXACTLY 7 entries, oldest -> newest, trailing 7 days incl today
  { "date": "2026-07-16", "weekday": "M", "seconds": 2040 }
],
"strongestDay": { "date": "2026-07-19", "weekday": "T", "seconds": 5280 }  // argmax; null when every day is 0
```

Unchanged: auth (parent JWT), `400` on any query key, `403` non-parent, read-only, one grouped
query per aggregate via `Promise.all`, explicit `fields`, no `populate:'*'`.

Scope of `practiceByDay`: the SAME filter as `practiceSecondsThisWeek` (`mode='practice'`,
`status='complete'`) but over the trailing-7-day window rather than the ISO week. Those two windows
genuinely differ (Mon-anchored vs rolling) — that is what the addendum specifies and it is what the
design shows (`this week` hero stat vs `last 7 days` chart range label).

## Design source

`.qa/design/spec/01-portal-dashboard.md`:

- **§4.3 / §10 row 3** — hero stat 3: value **`4h 20m`**, sub-label literal **`practice this week`**.
  Format `{H}h {MM}m` — hour has no leading zero, minutes zero-padded to 2. Value `24px / 700 /
  -0.02em`, sub-label `12px / 400 / #8FA3C7`. The API returns **seconds**; the `{H}h {MM}m`
  rendering is W5's.
- **§4.4 / §10 row 4** — chart card `portal--main.html:40`: `border-radius:24px; padding:28px 30px;
  box-shadow:0 1px 2px rgba(14,35,80,.04)`. Header `<h2>` **"Practice minutes"** `16px/600/#0E2350`,
  range label **"last 7 days"** `12.5px/#7C8698`. Plot area `gap:14px; min-height:120px`, **7**
  columns, bar `max-width:30px; border-radius:8px`. Weekday letters `M T W T F S S` at `11px`.
  Highlight rule: the max-value day is `#0E2350` bar + `11px/600/#0E2350` label; all others
  `#E4E9F2` bar + `11px/400/#9AA6B8` label. `#0E2350` → `--color-navy-900`.
- **§4.4 IMPLICATION (lines 326-330)** — the design's px heights are NOT minutes and its two
  numbers are not one dataset. The API therefore returns raw seconds only; the chart normalises to
  `min-height:120px` from the max in W5. **Nothing here fakes `88`.**
- **§10 row 5** — the caption `Thursday was the strongest day — 88 min, mostly Emma's speaking
  drills.` The `Thursday` + `88 min` half is `strongestDay`. The **"mostly Emma's speaking drills"**
  half is NOT served: it would require a per-day dominant child+skill attribution that the addendum
  does not define and the docs do not sanction. W5 renders the caption without that clause and
  records the omission — do not invent it here.

## Files

- EDIT `schooltest-api/src/api/student/services/parent-dashboard.ts`
- EDIT `schooltest-api/src/contracts/parent-household-progress.ts` — add the three keys to
  `householdProgressHouseholdSchema` (still `z.strictObject`), plus a
  `practiceDaySchema = z.strictObject({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weekday: z.enum(['M','T','W','F','S']), seconds: z.number().int().nonnegative() })` and
  `practiceByDay: z.array(practiceDaySchema).length(7)`
- EDIT `schooltest-web/tests/e2e/household-progress.spec.ts`

## Depends on

- **061** — `isoWeekStartUtc`, `trailingSevenDayKeys`, `weekdayLetter`, `sessionSeconds`,
  `bucketByDay`, `argmaxDay`. This task calls them; it re-implements none of them.
- **062** — the live endpoint, service and contract module this extends.

## Steps

1. Compute `const now = new Date()` ONCE at the top of `getHouseholdProgress` and thread it into
   every helper — the whole point of 061's injected-clock design.
2. Add ONE `strapi.documents(SESSION_UID).findMany(...)` to the existing `Promise.all`:
   - `filters: { student: { documentId: { $in: childDocumentIds } }, mode: { $eq: 'practice' },
     status: { $eq: 'complete' }, started_at: { $gte: <earliest of isoWeekStart and
     trailingSevenDayKeys[0]> } }`
   - `fields: ['student_document_id', 'started_at', 'ended_at']` — explicit, three columns.
     `student_document_id` is a **plain string column on `sessions`** (verified: 2611/2611
     populated), so the per-child split in 064 needs no relation populate at all.
   - `limit` an explicit high cap with a code comment (the live table holds 185 practice sessions
     total); never unbounded, never `populate:'*'`.
   - Fetching ONE window that covers both spans and slicing it in memory keeps this to a single
     query — do not issue one query per day and do not `await` inside a loop.
3. `practiceSecondsThisWeek` = sum of `sessionSeconds` over rows whose `started_at` is
   `>= isoWeekStartUtc(now)`.
4. `practiceByDay` = `trailingSevenDayKeys(now).map(k => ({ date: k, weekday: weekdayLetter(k),
   seconds: buckets[k] ?? 0 }))` — always 7 entries, oldest first, zeros included.
5. `strongestDay` = `argmaxDay(...)` → `null` when every bucket is 0.
6. Extend the Zod schema; the service's existing `householdProgressDataSchema` guard now covers the
   new keys automatically.
7. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rules 5, 6, 11, 19, **20 (no await-in-loop — one grouped query)**,
  21, 23.
- `.claude/rules/document-service.md` — nested relation filters, explicit `fields`, `$in` for the
  child set.
- `.claude/rules/services.md` — the arithmetic lives in `src/utils/household-window.ts` (061), the
  service only orchestrates.
- `.qa/CONTRACTS.md` C-DASH-HOUSEHOLD implementation constraints, verbatim.

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/household-progress.spec.ts` passes with new assertions:
  - `data.household.practiceByDay` has **length exactly 7**, `date` strictly increasing, the last
    entry equals today's UTC `YYYY-MM-DD`, every `weekday` ∈ `M T W F S`, every `seconds` an
    integer `>= 0`;
  - `strongestDay` is either `null` or an element whose `seconds` equals
    `Math.max(...practiceByDay.map(d => d.seconds))` and is `> 0`;
  - `practiceSecondsThisWeek` equals a direct SQL sum via `runSql`:
    `select coalesce(sum(extract(epoch from (ended_at - started_at))),0)::int from sessions se
     join sessions_student_lnk sl on sl.session_id = se.id
     join students_parent_lnk pl on pl.student_id = sl.student_id
     join up_users u on u.id = pl.user_id
     where u.email = 'parent@schooltest.local' and se.mode = 'practice'
       and se.status = 'complete' and se.ended_at is not null
       and se.started_at >= date_trunc('week', now() at time zone 'utc')`
    — an equality assertion against the database, not a plausibility check;
  - the sum of `practiceByDay[].seconds` equals the equivalent SQL sum over the trailing 7 days;
  - a second identical request returns identical numbers (no clock straddle inside one request).
- `grep -n "await" schooltest-api/src/api/student/services/parent-dashboard.ts` shows no `await`
  inside a `for`/`while`/`.map(` body.
- No i18n change (W3 owns keys). No UI → motion / 375px / axe **n/a**.
- Baseline regression unchanged.

## Assumptions

- Sessions whose `ended_at` is null contribute `0` seconds and are excluded from the day-streak
  evidence; 162 of 2611 live sessions are in that state, so this is the common path, not an edge.
- The "mostly Emma's speaking drills" clause of the design's caption is deliberately NOT served
  (see Design source). This is an omission recorded in Evidence, not a BLOCKED metric — the
  strongest-day date and duration ARE served.

## Evidence

<!-- filled in as the task runs -->
