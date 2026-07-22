---
id: "097"
title: Mirror C-CHILD-RESULT-HISTORY request params + paginated response as strict Zod schemas
layer: data
kind: build
slice: The typed client boundary for a child's full official result history — the paginated "Recent results" source
target: src/modules/children/schemas/child-result-history.schema.ts · src/modules/children/types/children.types.ts · src/modules/children/index.ts · tests/e2e/w3-child-result-history-contract.spec.ts
contract: C-CHILD-RESULT-HISTORY
design: .qa/design/spec/02-portal-children.md#B.6 Component: RecentResults (L58–72)
status: TODO
depends_on: ["077"]
---

## Objective

Type both directions of `GET /api/my/students/:documentId/results`: the strictly-validated request
query (so a bad page size never reaches the server as a 400) and the paginated response (so drift
fails at the boundary). Schemas + types + barrel only; the hook is task 098.

## Contract

`.qa/CONTRACTS.md` → **C-CHILD-RESULT-HISTORY — GET /api/my/students/:documentId/results**:

- Route file `01-custom-parent-students.ts`, placed **before** `/my/students/:documentId`.
  Handler `api::student.parent-results.listChildResults`.
- Auth: parent JWT; grant → `parent`. Ownership: unknown/foreign child ⇒ **404**.
- **Request query (all optional, strictly validated — unknown keys ⇒ `400`):**

  | Param | Type | Default | Rule |
  |---|---|---|---|
  | `page` | int ≥ 1 | `1` | |
  | `pageSize` | int 1..50 | `10` | >50 ⇒ `400 ValidationError` |
  | `skill` | enum reading/listening/speaking/writing | — | filters to that skill |

- **Success `200`:**

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

- **Scope:** `destination='official'` ONLY. Practice/transient results stay invisible to parents.
- **Sort:** `published_at_field:desc, createdAt:desc`.
- Errors: `400` bad/unknown query · `401` no JWT · `403` non-parent role · `404` unknown or foreign child.
- Persistence effect: none.

Note the casing difference from task 090: this projection is **camelCase** on the wire, while
`C-PARENT-RESULT-VIEW` is snake_case. Both mirrors are 1:1 with their own endpoint; do not
"harmonise" either.

## Design source

`.qa/design/spec/02-portal-children.md` §B.6 **RecentResults** (`portal--child-detail.html` L58–72),
the exact surface this feeds (built in W6):

- Card `background:#FFFFFF; border-radius:24px; padding:8px 30px; box-shadow:0 1px 2px rgba(14,35,80,.04)`.
- Header `display:flex; align-items:baseline; justify-content:space-between; padding:22px 0 6px`;
  `h2` "Recent results" `19px/600/-0.01em/#0E2350` (`--color-navy-900`); link "All reports →"
  `13.5px/500/#7C8698`, hover `#2563EB` (`--color-brand-600`).
- ResultRow `display:flex; align-items:center; gap:20px; padding:17px 0; border-bottom:1px solid #EEF1F6`
  (border on EVERY row incl. the last).
  - Left stack `flex:1; min-width:0`: name `14.5px/600/#0E2350`, date `13px/#7C8698; margin-top:2px`.
  - Score `14px/700/#0E2350; flex:none`.
  - Delta `12px/600; flex:none; width:90px; text-align:right`.
  - Action "Report" `13px/600/#2563EB`.

Field mapping this schema must make possible, and the two refusals:
- row name ← `displayLabel` (nullable → the existing `Children.untitledResult` key covers it).
- row date ← `publishedAt ?? createdAt` (`createdAt` is ALWAYS present — that is precisely why the
  contract added it, gap **G5**).
- design score `B1 · 74%` → **the `74%` half is BLOCKED B-3** (a composite score;
  `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46`). The row renders `cefrBand` + `readiness` only.
- design delta `+6% vs May` → **BLOCKED B-4** as a percentage. `previousResultDocumentId` supports
  the honest band-step delta instead (task 099).
- The design's "All reports →" link has no handler; real pagination (this contract's `meta.pagination`)
  is what W6 wires in its place.

## Files

Create:
- `src/modules/children/schemas/child-result-history.schema.ts`
- `tests/e2e/w3-child-result-history-contract.spec.ts`

Touch:
- `src/modules/children/types/children.types.ts` — add the inferred types.
- `src/modules/children/index.ts` — the barrel currently exports **only three screens**
  (`ChildrenScreen, ChildProfileScreen, EditStudentScreen`); add the new schema + types so the
  dashboard/results modules can consume them through the barrel per the cross-module import rule.

Do NOT touch `src/modules/children/schemas/child-progress.schema.ts` or
`queries/use-child-progress.query.ts` — `C-PARENT-CHILD-PROGRESS` and its ≤5-row `recentResults`
keep working exactly as they do today (`.qa/DECISIONS.md` D-SCOPE-3: functional wiring is preserved).

## Depends on

- **077** (W2) — the task that ships the `/my/students/:documentId/results` route (ordered before the
  `/my/students/:documentId` wildcard), handler and `parent` grant.

## Steps

1. `schemas/child-result-history.schema.ts`, matching the house style of
   `child-progress.schema.ts` (shared local enums, `z.strictObject`, `z.iso.datetime()`, a header
   comment naming the contract id):
   - Local enums: `skillSchema`, `cefrBandSchema` (`pre_A1|A1|A2|B1|B2|C1`), `readinessSchema`,
     `resultStatusSchema` (`scoring|partial_pending|complete`).
   - **Request:** `childResultHistoryParamsSchema = z.strictObject({ page: z.number().int().min(1).default(1),
     pageSize: z.number().int().min(1).max(50).default(10), skill: skillSchema.optional() })`.
     `.max(50)` mirrors the server rule so an out-of-range page size fails on the client with a
     usable error instead of burning a request on a guaranteed `400`.
   - **Response row:** `childResultHistoryRowSchema = z.strictObject({ documentId: z.string().min(1),
     scope: z.enum(['skill','combined']), skill: skillSchema.nullable(),
     displayLabel: z.string().nullable(), cefrBand: cefrBandSchema.nullable(),
     acaraPhase: z.string().nullable(), readiness: readinessSchema.nullable(),
     lowConfidence: z.boolean(), effortValid: z.boolean(), status: resultStatusSchema,
     publishedAt: z.iso.datetime().nullable(), createdAt: z.iso.datetime(),
     previousResultDocumentId: z.string().min(1).nullable(),
     sessionDocumentId: z.string().min(1).nullable() })`.
     `createdAt` is **non-nullable** — the contract says ALWAYS present and the whole point of G5's
     fix is that rows are orderable.
   - `childResultHistoryResponseSchema = z.strictObject({ data: z.array(childResultHistoryRowSchema),
     meta: z.strictObject({ pagination: z.strictObject({ page: z.number().int().min(1),
     pageSize: z.number().int().min(1).max(50), pageCount: z.number().int().min(0),
     total: z.number().int().min(0) }) }) })` — `pagination` is REQUIRED here (unlike
     `studentsResponseSchema`, where it is optional) because the contract always returns it.
2. `types/children.types.ts` — add `ChildResultHistoryParams`, `ChildResultHistoryRow`,
   `ChildResultHistoryResponse` via `z.infer`, next to the existing `ChildProgress*` types.
3. Barrel exports.
4. TDD: create `tests/e2e/w3-child-result-history-contract.spec.ts` red-first — log in as the seeded
   parent over the real API, take the first child from `GET /api/my/students`, call
   `GET /api/my/students/:documentId/results`, expect `200`, assert the LIVE body parses through
   `childResultHistoryResponseSchema`, and assert the default page is `page:1, pageSize:10`.
   Also assert every returned row's `createdAt` is a parseable ISO datetime (the G5 fix, proved).

## Project rules

- `schooltest-web/.claude/rules/module-pattern.md` — Zod in `schemas/`, types in `types/`, barrel for
  cross-module use; 200-line file cap.
- `schooltest-web/.claude/rules/state-data.md` — one Zod schema validates both directions.
- `schooltest-web/CLAUDE.md` laws 3 and 14 — never break existing logic; never `any`.
- `.qa/CONTRACTS.md` governing rules (Strapi v5 envelope, `documentId`, 1:1 mirror of
  `schooltest-api/src/contracts/`).
- `.qa/DECISIONS.md` **D-SCOPE-3** — the existing child-progress wiring is preserved and re-dressed,
  never deleted.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-child-result-history-contract.spec.ts` passes: live `200`,
  body parses, default pagination is `page:1 pageSize:10`, every row has a valid `createdAt`.
- Negative proof in Evidence: a live-body copy with `createdAt` removed, and one with an extra row
  key, both throw from `childResultHistoryResponseSchema.parse`.
- `grep -rn "score\|percent\|pct" src/modules/children/schemas/child-result-history.schema.ts` →
  zero hits (B-3/B-4 stay refused).
- `grep -rn "as any\|: any\|@ts-ignore\|\.passthrough()" src/modules/children/schemas/` → zero hits.
- `src/modules/children/queries/use-child-progress.query.ts` and
  `schemas/child-progress.schema.ts` are byte-identical to their pre-task state (`git diff` proves it).
- `pnpm exec playwright test tests/e2e/children-profile.spec.ts` still passes — the existing child
  profile surface is untouched.
- No user-facing string → six catalogs untouched, still key-identical.
- Non-UI slice: no motion / viewport / axe criteria.
- Playwright baseline unchanged (157 passed / 1 known W9 red).

## Assumptions

- W2 id **077** ships this endpoint. The W2 fragment did not exist when this file was authored; if the
  real id differs, retarget the edge to the W2 task whose title covers the child result-history route
  + grant.

## Evidence

<!-- filled in as the task runs -->
