---
id: 064
title: Add per-child testsCompleted, practiceSecondsThisWeek, practiceDayStreak and lastActivityAt
layer: backend
kind: implement
slice: GET /api/my/progress — the per-child activity numbers behind the "My children" rows
target: schooltest-api/src/api/student/services/parent-dashboard.ts · src/utils/household-child.ts · src/contracts/parent-household-progress.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/02-portal-children.md#a5-component-childcard (cell 2 `day streak`) · .qa/design/spec/01-portal-dashboard.md#5-my-children-section
status: TODO
depends_on: [061, 063]
---

## Objective

Give every child row its own activity numbers — completed tests, practice time this week, the
consecutive practice-day streak, and a real "last active" timestamp (gap **G9**: no endpoint
returns one today) — still inside the single `/api/my/progress` round-trip, still with no
per-child query loop.

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD**. Keys this task adds to each `data.children[]` entry:

```jsonc
"testsCompleted": 14,
"practiceSecondsThisWeek": 5400,
"practiceDayStreak": 12,        // consecutive calendar days back from today with >=1 complete practice session
"lastActivityAt": "2026-07-22T08:28:04.544Z"  // max(sessions.ended_at, results.published_at_field); nullable
```

Unchanged: parent JWT, `400` on any query key, `403` non-parent, read-only, `Promise.all`,
explicit `fields`, no `populate:'*'`, **no per-child loop with `await` inside it**.

## Design source

- `.qa/design/spec/02-portal-children.md` §A.5 ChildCard MetricStrip (`portal--my-children-list.html`
  L22-28): three cells, `flex:1`, dividers `width:1px; background:#EEF1F6; margin:0 18px`. Value
  `20px / 700 / #0E2350 / -0.01em`; label `12px / #7C8698 / margin-top:2px`.
  **Cell 2** is value `{{k.streak}}` / label literal **`day streak`** — seed values Emma `12`,
  Lucas `5`. That cell is what `practiceDayStreak` fills.
  Cell 1 (`{{k.progress}}%` / `to {{k.nextLevel}}`) and cell 3 (`{{k.lastScore}}` / `last result`)
  are **BLOCKED** — see tasks 080 (B-4, B-3). This task must not invent a substitute for them.
- `.qa/design/spec/01-portal-dashboard.md` §5 — the dashboard "My children" row
  (`portal--main.html:65-81`): `display:flex; align-items:center; gap:20px; padding:20px 0;
  border-bottom:1px solid #EEF1F6`, avatar `44×44`, name block fixed `width:190px`, name
  `15px/600/#0E2350`, meta `12.5px/#7C8698`. `#0E2350` → `--color-navy-900`.
- `lastActivityAt` has no visible slot in the design; it exists because §5's row and §A.5's card
  both need a stable recency sort and gap **G9** says nothing serves one today. It is data for the
  UI, not a rendered metric.

## Files

- CREATE `schooltest-api/src/utils/household-child.ts` — pure projection helpers
- EDIT `schooltest-api/src/api/student/services/parent-dashboard.ts`
- EDIT `schooltest-api/src/contracts/parent-household-progress.ts`
- EDIT `schooltest-web/tests/e2e/household-progress.spec.ts`

## Depends on

- **061** — `trailingSevenDayKeys`, `sessionSeconds`, `consecutiveDayStreak`, `isoWeekStartUtc`.
- **063** — the practice-session read this task re-uses and the `now` threading it established.

## Steps

1. Widen the existing single practice-session query from 063 rather than adding new ones: request
   `fields: ['student_document_id', 'started_at', 'ended_at', 'mode', 'status']` and **drop the
   `mode`/`status` filters into an `$in`/`$or` only where the addendum requires**, so ONE read
   serves household practice, per-child practice and per-child streak. Group in memory by
   `student_document_id` (the plain string column, 2611/2611 populated — no relation populate
   needed).
2. `testsCompleted` per child: add ONE
   `strapi.documents(SESSION_UID).findMany({ filters: { student: { documentId: { $in: childIds } },
   status: { $eq: 'complete' } }, fields: ['student_document_id'], limit: <cap> })` to the same
   `Promise.all` and tally in memory. A `.count()` per child would be N queries — forbidden.
3. `lastActivityAt` per child: add TWO reads to the same `Promise.all` —
   - sessions: `fields: ['student_document_id','ended_at']`, `sort: ['ended_at:desc']`,
     filtered `ended_at: { $notNull: true }`;
   - results: `fields: ['published_at_field']` + `populate: { student: { fields: ['documentId'] } }`
     (explicit, one level), `sort: ['published_at_field:desc']`,
     `published_at_field: { $notNull: true }`.
   Take `max()` of the two per child; `null` when neither exists.
4. `practiceDayStreak` per child: build the child's set of UTC date keys that have >= 1
   `mode='practice' AND status='complete'` session, then `consecutiveDayStreak(keys, now)`.
   **The streak window is NOT capped at 7 days** — the design shows `12`. Fetch practice sessions
   for the streak with an explicit `started_at: { $gte: <now - 400 days> }` bound and a code comment
   saying why the bound exists (unbounded reads are the thing being avoided) and what happens past
   it (the streak saturates at the bound rather than lying).
5. Put every pure grouping/derivation in `src/utils/household-child.ts` (the `src/utils/result-view.ts`
   precedent) so the service stays orchestration-only.
6. Extend the Zod child schema with the four keys, all still inside `z.strictObject`.
7. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rules 5, 6, 11/12 (explicit populate — the results read populates
  `student` with `fields: ['documentId']` only), 19, **20**, 21, 23.
- `.claude/rules/document-service.md` — `$in` over the child set, nested relation filters, never a
  bare id.
- `.claude/rules/services.md` — pure logic out of the service.
- `.qa/CONTRACTS.md` C-DASH-HOUSEHOLD: "one grouped query per aggregate via `Promise.all`, never a
  per-child loop with `await` inside it".

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/household-progress.spec.ts` passes with new assertions:
  - every `children[]` entry carries the four new keys with the right types; `practiceDayStreak`
    and `testsCompleted` are integers `>= 0`; `lastActivityAt` is an ISO string or `null`;
  - `sum(children[].testsCompleted) === household.testsCompleted` — an internal-consistency
    equality that catches a mis-grouped `$in`;
  - for the seeded parent's child `tgczwn7ou2yuvsvdudcxp7qa` (13 sessions in the live DB),
    `testsCompleted` equals `select count(*) from sessions se join sessions_student_lnk sl on
     sl.session_id = se.id join students s on s.id = sl.student_id
     where s.document_id = 'tgczwn7ou2yuvsvdudcxp7qa' and se.status = 'complete'` via `runSql`;
  - a child with zero sessions (`ol10bd2bui8jf2mjzziol1iq`, 0 sessions live) returns
    `testsCompleted: 0`, `practiceSecondsThisWeek: 0`, `practiceDayStreak: 0`,
    `lastActivityAt: null` — **not** an omitted key and **not** an error;
  - `lastActivityAt` for a child with results equals the SQL `greatest(max(ended_at),
    max(published_at_field))` for that child;
  - the response is stable across a reload.
- **Query-count guard:** the API log for one request shows a bounded, constant number of SQL
  statements independent of child count. Prove it by comparing the statement count for the 10-child
  seeded parent against `parent2@schooltest.local` (3 children) — they must match. This is the
  N+1 proof that justifies the endpoint's existence (gap G1).
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression unchanged.

## Assumptions

- `sessions.student_document_id` is authoritative for grouping (verified fully populated); if any
  row is ever null the service falls back to the `student` relation rather than dropping the row —
  state which branch was taken in Evidence.
- The 400-day streak bound is an implementation cap, disclosed in a code comment, not a contract
  field. It does not appear on the wire.

## Evidence

<!-- filled in as the task runs -->
