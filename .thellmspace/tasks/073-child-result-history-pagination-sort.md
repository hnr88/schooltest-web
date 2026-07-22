---
id: 073
title: Prove pagination arithmetic and sort determinism on the child result history
layer: backend
kind: fix
slice: GET /api/my/students/:documentId/results — stable ordering and correct pagination meta across pages
target: schooltest-api/src/api/student/services/parent-results.ts · schooltest-web/tests/e2e/child-result-history-paging.spec.ts
contract: C-CHILD-RESULT-HISTORY
design: .qa/design/spec/02-portal-children.md#b6-component-recentresults (`All reports →`, 3 placeholder rows)
status: TODO
depends_on: [071, 072]
---

## Objective

A paginated list that is not deterministically ordered silently duplicates and drops rows as a
parent pages through it. `published_at_field` is null on **192 of 2358** live result rows, which is
exactly the condition gap **G5** flags as making the existing 5-row projection unorderable. Prove
this endpoint does not inherit that defect.

## Contract

`.qa/CONTRACTS.md` → **C-CHILD-RESULT-HISTORY**:

- **Sort:** `published_at_field:desc, createdAt:desc` — same as the existing progress read
  (`services/parent-progress.ts:142`).
- **`meta.pagination`:** `{ page, pageSize, pageCount, total }`.
- `pageSize` default `10`, max `50`; `page` default `1`.

Gap text this closes:
> **G5** — `recentResults[].publishedAt` can be `null` … and there is no `createdAt` on the
> recentResults projection, so even the 5 rows cannot be reliably ordered on the client when
> `publishedAt` is null.

## Design source

`.qa/design/spec/02-portal-children.md` §B.6 — the card shows **3 placeholder rows** with a
**`All reports →`** link (`13.5px/500/#7C8698`, hover `#2563EB` = `--color-brand-600`), i.e. a
first page of a longer list. Each row's date cell is `13px/#7C8698` and reads `Jul 14, 2026`,
`Jul 8, 2026`, `Jun 20, 2026` — strictly descending. The border rule
`border-bottom:1px solid #EEF1F6` is on **every** row including the last, with a trailing spacer
`padding:8px 0 14px` below (`portal--child-detail.html:71`) — so the design has no "last row"
special case and the API must not have an "unstable last row" either.

## Files

- EDIT `schooltest-api/src/api/student/services/parent-results.ts`
- CREATE `schooltest-web/tests/e2e/child-result-history-paging.spec.ts`

## Depends on

- **071** — the validated `page`/`pageSize` inputs.
- **072** — the full 14-key row, so page comparisons compare complete rows.

## Steps

1. Add a **third, total-order tiebreak** to the sort: `['published_at_field:desc', 'createdAt:desc',
   'documentId:desc']`. Two rows can share both timestamps (bulk-published sittings do); without a
   unique final key Postgres may return them in a different order per page request and a row will
   be duplicated on one page and missing from another. Document the reason in a code comment citing
   G5.
   - This is an addition to, not a replacement of, the contract's stated sort — the first two keys
     stay byte-identical to `parent-progress.ts:142` so the two surfaces agree.
2. Confirm `pageCount = total === 0 ? 0 : Math.ceil(total / pageSize)` and that a `page` beyond
   `pageCount` returns `200` with `data: []` and the correct `meta` — **not** a `404` and not a
   clamp to the last page.
3. Confirm `start` is computed from the validated `page`/`pageSize` and never from raw query values.
4. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rule 20 (the page walk in the test uses `Promise.all` where
  ordering is irrelevant), rule 23.
- `.claude/rules/rest-api.md` — "NEVER sort by `id` for chronological order — use `createdAt`". The
  `documentId:desc` third key is a tiebreak for determinism, never the chronological key.
- `.claude/rules/controllers.md` — pagination meta shape.
- `.qa/CONTRACTS.md` C-CHILD-RESULT-HISTORY sort + meta.

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/child-result-history-paging.spec.ts` passes, against a child
  with enough official results to page (select the child with the highest official-result count
  belonging to a parent whose credentials are known, via `runSql`; if the seeded household is too
  thin, page with `pageSize=1` — 1 row per page is a legitimate and sufficient paging proof):
  - **no duplicate, no gap:** walking every page with `pageSize=1` collects a `documentId` list
    whose length equals `meta.pagination.total` and whose `Set` size equals its length;
  - the concatenated single-row walk equals, element for element, the single request with
    `pageSize=50` — same order, same ids;
  - **stability:** the same page requested three times returns the identical `documentId` sequence;
  - **null-publishedAt ordering:** if the child has a row with `publishedAt: null`, it sorts after
    every non-null row (desc nulls-last as Postgres orders them) and its relative position is
    identical across repeated requests. Assert the observed null-ordering and record it in Evidence
    — this is the concrete answer to G5;
  - `pageCount === Math.ceil(total / pageSize)`, and `pageCount === 0` exactly when `total === 0`;
  - `page = pageCount + 1` → **`200`** with `data: []`, `page` echoed as requested, `total`
    unchanged (never `404`, never a clamp);
  - `pageSize=50` on a child with fewer results → `data.length === total`;
  - a child with **zero** official results → `200`, `data: []`, `meta.pagination = { page: 1,
    pageSize: 10, pageCount: 0, total: 0 }`. Use `ol10bd2bui8jf2mjzziol1iq` (0 results live);
  - **cross-check with SQL:** the full ordered id list equals
    `select r.document_id from results r join results_student_lnk rl on rl.result_id = r.id
      join students s on s.id = rl.student_id
     where s.document_id = '<child>' and r.destination = 'official'
     order by r.published_at_field desc nulls last, r.created_at desc, r.document_id desc`.
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression: 157 passed / 1 pre-existing fail; `/my/students/:documentId/progress` output
  is byte-identical to before this task (its own sort was not touched) — assert by diffing a
  captured response.

## Assumptions

- Postgres orders `NULLS LAST` for `DESC` by default; the assertion records the observed behaviour
  rather than presuming it, because the Document Service builds the ORDER BY.
- If adding `documentId:desc` is rejected by the Document Service sort parser, fall back to
  `createdAt:desc` plus an explicit stable secondary the engine does accept — never drop the
  determinism requirement and never sort in memory after paging (that would defeat pagination).

## Evidence

<!-- filled in as the task runs -->
