---
id: 072
title: Add previousResultDocumentId and sessionDocumentId to the child result history (closes G12/G5)
layer: backend
kind: implement
slice: GET /api/my/students/:documentId/results — the deep-link and delta linkage a parent cannot reach today
target: schooltest-api/src/api/student/services/parent-results.ts · schooltest-web/tests/e2e/child-result-history-linkage.spec.ts
contract: C-CHILD-RESULT-HISTORY
design: .qa/design/spec/02-portal-children.md#b6-component-recentresults (delta column, `Report` action) · #b2-component-kpistrip (`Since joining`)
status: TODO
depends_on: [070]
---

## Objective

Give each history row the two references the design's delta column and `Report` action need, and
which gap **G12** records as unreachable today: the result that preceded it, and the sitting that
produced it. Without them the design's `+6% vs May` / `first attempt` distinction is guesswork and
the `Report` link has nothing to correlate.

## Contract

`.qa/CONTRACTS.md` → **C-CHILD-RESULT-HISTORY**, the two remaining row keys:

```jsonc
"previousResultDocumentId": "x9k…",  // nullable — enables the design's "+N vs {month}" delta
"sessionDocumentId": "s2z6…"         // nullable — fixes G12
```

Both nullable. Everything else about the endpoint is unchanged: parent JWT, ownership 404,
`destination='official'` only, sort `published_at_field:desc, createdAt:desc`, pagination meta,
read-only, explicit `fields`, no `populate:'*'`.

Gap text this closes, quoted from `.qa/intake/api-inventory.md`:
> **G12** — `recentResults` items carry no `sessionDocumentId` and no `previousResultDocumentId`
> (`parent-child-progress.ts:32-40`). Even for navigation-only purposes a parent cannot correlate a
> result with the sitting that produced it.

## Design source

`.qa/design/spec/02-portal-children.md` §B.6 (`portal--child-detail.html:64-68`):

- **Delta cell** — `font-size:12px; font-weight:600; color:{{r.deltaColor}}; flex:none; width:90px;
  text-align:right`. Two states in the export's own data:
  - has a predecessor → blue `#2563EB` (`--color-brand-600`), copy `+6% vs May`;
  - **no predecessor → neutral grey `#9AA6B8`, copy `first attempt`** (Lucas's Writing check-in,
    `Parent Portal.dc.html:895`).
  `previousResultDocumentId === null` is exactly the `first attempt` state. The **percentage** in
  `+6%` is a composite score and is BLOCKED (B-3, task 080) — W6 renders a band-to-band change
  instead; the *presence or absence of a predecessor* is not blocked and is what this field serves.
  §B.6's closing note: "No negative-delta example exists in the design" — the API is symmetric, so
  W6 must handle a downward band change too.
- **`Report` action** — `13px/600/#2563EB`, `cursor:pointer`, no handler bound in the export. Its
  target is `documentId` → C-PARENT-RESULT-VIEW (`GET /api/results/:documentId`, tasks 075-077);
  `sessionDocumentId` is the secondary correlation for "which sitting produced this".
- **§B.2 KpiStrip cell 5** `Since joining` / `+2 levels` / value `24px/700/-0.01em/#2563EB` — the
  oldest→newest band walk over this history.

## Files

- EDIT `schooltest-api/src/api/student/services/parent-results.ts`
- CREATE `schooltest-web/tests/e2e/child-result-history-linkage.spec.ts`

## Depends on

- **070** — the live endpoint whose row projection this widens. (Independent of 071.)

## Steps

1. Add an explicit, one-level `populate` to the existing `findMany` — do **not** add a second query
   and do **not** widen `fields`:
   ```ts
   populate: {
     session:         { fields: ['documentId'] },
     previous_result: { fields: ['documentId'] },
   }
   ```
   This is the exact shape `src/api/result/services/result-view.ts:45-51` already uses, so the two
   result-reading services stay consistent. **Never `populate: '*'`** (CLAUDE.md §2 rules 11/12).
2. Project `previous_result?.documentId ?? null` and `session?.documentId ?? null`, mirroring
   `src/utils/result-view.ts:114-115`.
3. Do **not** use the flat `results.session_document_id` string column as the source: it is
   populated on 2356 of 2358 live rows but the relation is the authoritative link, and
   `result-view.ts` already reads the relation. Consistency beats the shortcut. Record the 2-row
   discrepancy in Evidence.
4. The row schema from 069 already declares both keys — no contract edit is expected. If it does not,
   the contract module is wrong and gets fixed here, not worked around.
5. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rule 6 (`documentId`, never numeric `id` — the populate selects
  `documentId` only, never the FK), rules 11/12 (explicit populate), rule 20 (one query, no loop),
  rule 23.
- `.claude/rules/document-service.md` — `populate: { relation: { fields: [...] } }`.
- `.qa/CONTRACTS.md` C-CHILD-RESULT-HISTORY success shape.

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/child-result-history-linkage.spec.ts` passes:
  - every row carries both keys; each is `null` or a 24-char string;
  - for a child whose result has a predecessor, `previousResultDocumentId` equals the SQL truth via
    `runSql`:
    `select pr.document_id from results r
      join results_previous_result_lnk l on l.result_id = r.id
      join results pr on pr.id = l.inv_result_id
     where r.document_id = '<row documentId>'`
    (**117 such links exist live**, so a real example is guaranteed);
  - a result with no predecessor returns `previousResultDocumentId: null` — the `first attempt`
    state — and **not** an omitted key;
  - `sessionDocumentId` equals the SQL truth from `results_session_lnk` for the same row;
  - the returned `previousResultDocumentId`, when non-null, is itself a result of the SAME child
    (assert via `runSql`) — a cross-child predecessor would be a data leak;
  - **no numeric `id` and no foreign key** appears anywhere in the body (`grep` the serialised
    response for `"id":` and for `session_id`/`result_id`);
  - the response still contains no `attributes`, no `productive_scores`, no `supplementary` — this
    endpoint is a list, not the detail view (that is C-PARENT-RESULT-VIEW);
  - the query count for the page is unchanged from 070 (one `count` + one `findMany`); a populate
    must not become an N+1. Compare API-log statement counts for a `pageSize=1` and a `pageSize=10`
    request — they must differ by data volume, not by a factor of 10 in statement count.
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression: 157 passed / 1 pre-existing fail.

## Assumptions

- `previous_result` is a self-relation on `api::result.result`
  (`result/content-types/result/schema.json`), backed by `results_previous_result_lnk` (verified
  present, 117 rows). If the relation direction makes the populate return the *inverse* side, fix
  the populate — never fall back to reading the flat column to paper over it.
- Transient predecessors: a `destination='transient'` predecessor of an official result would leak
  a practice result's id to a parent. Assert the returned predecessor's `destination` is
  `'official'` via `runSql`; if any is transient, return `null` for it and record the decision.

## Evidence

<!-- filled in as the task runs -->
