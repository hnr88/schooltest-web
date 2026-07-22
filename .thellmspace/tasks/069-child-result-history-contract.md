---
id: 069
title: Author the C-CHILD-RESULT-HISTORY Zod contract module and prove it against real result rows
layer: backend
kind: scaffold
slice: GET /api/my/students/:documentId/results — the params, query and paginated row shape
target: schooltest-api/src/contracts/parent-child-results.ts · src/contracts/index.ts · schooltest-web/tests/e2e/child-result-history-contract.spec.ts
contract: C-CHILD-RESULT-HISTORY
design: .qa/design/spec/02-portal-children.md#b6-component-recentresults · .qa/design/screens/portal--child-detail.html:58-72
status: TODO
depends_on: []
---

## Objective

Define, once, the request and response shape of the paginated per-child result history that gap
**G4** blocks today (`recentResults` is hard-capped at 5, `.max(5)` in
`src/contracts/parent-child-progress.ts:45`, `limit: 5` in `services/parent-progress.ts:143`, with
no page, no filter and no `createdAt`). Prove the definition matches the rows that actually exist.

## Contract

`.qa/CONTRACTS.md` → **C-CHILD-RESULT-HISTORY — GET /api/my/students/:documentId/results**.

**Request query** — all optional, strictly validated, **unknown keys ⇒ `400`**:

| Param | Type | Default | Rule |
|---|---|---|---|
| `page` | int ≥ 1 | `1` | |
| `pageSize` | int 1..50 | `10` | `> 50` ⇒ `400 ValidationError` |
| `skill` | enum `reading\|listening\|speaking\|writing` | — | filters to that skill |

**Success `200`:**

```jsonc
{ "data": [ {
    "documentId": "amkb…",
    "scope": "skill",                    // skill | combined
    "skill": "reading",                  // null when scope='combined'
    "displayLabel": "Critical Reader",   // nullable
    "cefrBand": "B2",                    // nullable
    "acaraPhase": "Consolidating",       // nullable
    "readiness": "met",                  // nullable
    "lowConfidence": false,
    "effortValid": true,
    "status": "complete",                // scoring | partial_pending | complete
    "publishedAt": "2026-07-22T08:28:04.544Z",  // nullable
    "createdAt": "2026-07-22T08:27:51.101Z",    // ALWAYS present — fixes G5's unorderable rows
    "previousResultDocumentId": "x9k…",  // nullable — enables the design's "+N vs {month}" delta
    "sessionDocumentId": "s2z6…"         // nullable — fixes G12
  } ],
  "meta": { "pagination": { "page": 1, "pageSize": 10, "pageCount": 4, "total": 37 } } }
```

Also in scope for this module: `parentChildResultsParamsSchema` with
`documentId: z.string().regex(/^[a-z0-9]{24}$/i, 'must be a Strapi document id')` — byte-identical
to `src/contracts/parent-child-progress.ts:7-9`, so the two parent child-scoped surfaces reject the
same malformed ids the same way.

## Design source

`.qa/design/spec/02-portal-children.md` §B.6 RecentResults (`portal--child-detail.html:58-72`):

- Card `border-radius:24px; padding:8px 30px; box-shadow:0 1px 2px rgba(14,35,80,.04)`.
- Header `padding:22px 0 6px`; `<h2>` **`Recent results`** `19px/600/-0.01em/#0E2350`
  (`--color-navy-900`); link **`All reports →`** `13.5px/500/#7C8698`, hover `#2563EB`
  (`--color-brand-600`). That link is exactly why pagination exists — the design offers a full
  history and `recentResults`'s 5-row cap cannot serve it.
- **ResultRow** `display:flex; align-items:center; gap:20px; padding:17px 0; border-bottom:1px solid
  #EEF1F6`, placeholder count 3. Cells: name `14.5px/600/#0E2350`; date `13px/#7C8698/margin-top:2px`;
  score `14px/700/#0E2350`; delta `12px/600; width:90px; text-align:right`; action `Report`
  `13px/600/#2563EB`.
- Row data in the export: `Listening check-in` / `Jul 14, 2026` / `B1 · 74%` / `+6% vs May`.
  - the **name** slot ← `displayLabel` (nullable; W6 falls back to the skill name);
  - the **date** slot ← `publishedAt`, falling back to `createdAt` — which is precisely why
    `createdAt` is `ALWAYS present` in this contract (G5: 2166 of 2358 live result rows have a
    `published_at_field`, 192 do not, so `publishedAt`-only ordering is genuinely broken today);
  - the **score** slot's `· 74%` half is a composite percentage and is **BLOCKED** (B-3, task 080).
    `cefrBand` + `readiness` fill that slot instead;
  - the **delta** slot (`+6% vs May`, `first attempt` in grey `#9AA6B8`) needs a prior result to
    compare against — `previousResultDocumentId` is what makes the "first attempt" vs
    "has-a-predecessor" distinction real. The **percentage** part of the delta is BLOCKED (B-3);
    W6 renders a band-to-band change or `first attempt`.
  - the **`Report`** action needs a target — `documentId` deep-links to C-PARENT-RESULT-VIEW.
- `.qa/design/spec/02-portal-children.md` §B.2 KpiStrip cell 5 `Since joining` / `+2 levels` also
  consumes this history (oldest vs newest band).

## Files

- CREATE `schooltest-api/src/contracts/parent-child-results.ts`
- EDIT `schooltest-api/src/contracts/index.ts` — add the barrel export
- CREATE `schooltest-web/tests/e2e/child-result-history-contract.spec.ts`

## Depends on

Nothing.

## Steps

1. Read `src/contracts/parent-child-progress.ts` and `src/contracts/search-domains.ts` — the first
   for the params/data/response convention, the second for the STRICT query-object convention
   (`z.strictObject` with `.default()`s and an unknown-key rejection) used by
   `POST /api/search/schools`.
2. Author, importing enums from `./vocab` (`skillSchema`, `cefrBandSchema`, `readinessSchema`,
   `resultStatusSchema`) — never re-declaring a vocabulary:
   - `parentChildResultsParamsSchema`
   - `parentChildResultsQuerySchema` — `z.strictObject({ page: coerced int min 1 default 1,
     pageSize: coerced int min 1 max 50 default 10, skill: skillSchema.optional() })`. Coercion is
     required because Koa query values are strings; a non-numeric `page=abc` must be a `400`, not
     `NaN`.
   - `parentChildResultRowSchema` — `z.strictObject` with the 14 keys above, `scope:
     z.enum(['skill','combined'])`, `lowConfidence`/`effortValid` as `z.boolean().nullable()`
     (both columns are nullable booleans on `result/schema.json`), `createdAt: z.iso.datetime()`
     non-nullable.
   - `parentChildResultsResponseSchema` — `{ data: z.array(row), meta: z.strictObject({
     pagination: z.strictObject({ page, pageSize, pageCount, total }) }) }`, all ints ≥ 0.
   - one `z.infer` type export per schema that the service/controller need.
3. Barrel export; `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.
4. Write the contract spec: import the module, and assert against REAL rows read with `runSql`.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rules 6 (`documentId`, never numeric `id`), 7, 19, 23.
- `.claude/rules/typescript.md` — strict, no `any`.
- `.qa/RULES.md` [schooltest-api] — "Single source of truth: every shape is defined once as a Zod
  schema in `schooltest-api/src/contracts/`" and mirrored 1:1 by the web module in W3.
- `.qa/CONTRACTS.md` governing rules — Strapi v5 envelope, no `attributes` wrapper, no numeric `id`.

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/child-result-history-contract.spec.ts` passes, asserting
  against the live database via `runSql`:
  - every distinct `results.scope` value parses (`select distinct scope from results` → currently
    `skill`, `combined`);
  - every distinct `results.status`, `results.readiness`, `results.cefr_band` value parses;
  - a row built from `select ... from results where published_at_field is null limit 1` parses —
    proving `publishedAt: null` is legal (192 such rows exist live);
  - `createdAt` is non-nullable: `select count(*) from results where created_at is null` returns
    `0`, and the schema rejects a row with `createdAt: null`;
  - query schema: `{}` yields `{ page: 1, pageSize: 10 }`; `{ pageSize: '50' }` parses to `50`;
    `{ pageSize: '51' }` FAILS; `{ pageSize: '0' }` FAILS; `{ page: 'abc' }` FAILS;
    `{ skill: 'maths' }` FAILS; `{ sort: 'createdAt' }` FAILS as an unknown key;
  - `parentChildResultsParamsSchema` rejects `'short'` and accepts a real 24-char documentId read
    from the database.
- `grep -nE "\bany\b|\bid\b:" schooltest-api/src/contracts/parent-child-results.ts` shows no `any`
  and no numeric `id` field.
- No i18n change (W3 owns the six catalogs for these strings). No UI → motion / 375px / axe **n/a**.
- Baseline regression: full `pnpm exec playwright test` still 157 passed / 1 pre-existing fail.

## Assumptions

- `lowConfidence` / `effortValid` are typed nullable because `result/schema.json` declares them as
  plain booleans with no `required`, and `src/contracts/results.ts:80-81` already types them
  `z.boolean().nullable()`. Matching that existing contract is deliberate — the two result-shaped
  contracts must not disagree.
- The 24-char documentId regex is copied verbatim from `parent-child-progress.ts:8`, including the
  `/i` flag, so a documentId valid on `/progress` is valid here.

## Evidence

<!-- filled in as the task runs -->
