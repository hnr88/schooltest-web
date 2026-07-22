---
id: 060
title: Author the C-DASH-HOUSEHOLD Zod contract module and prove it against real Postgres rows
layer: backend
kind: scaffold
slice: GET /api/my/progress — the single shared shape definition for the household dashboard aggregate
target: schooltest-api/src/contracts/parent-household-progress.ts · schooltest-api/src/contracts/index.ts · schooltest-web/tests/e2e/household-progress-contract.spec.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#10-metric-inventory (rows 1,3,4,5,6,7) · .qa/design/screens/portal--main.html:26-57 · .qa/design/spec/02-portal-children.md#a5-component-childcard
status: TODO
depends_on: []
---

## Objective

Define, once, the wire shape of `GET /api/my/progress` as a strict Zod module in
`schooltest-api/src/contracts/`, so the service, the controller and (in W3) the web module all
consume ONE definition and nobody re-types the shape by hand. Prove the definition actually
describes the data that exists in the real database — not the data we wish existed.

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD — GET /api/my/progress**. This task lands the schema
only; the endpoint arrives in 062. The module must express EXACTLY the addendum's shape:

```jsonc
{ "data": {
    "household": {
      "childCount": 3, "testsCompleted": 41, "testsCompletedThisWeek": 7,
      "resultsPublished": 18, "practiceSecondsThisWeek": 15600,
      "practiceByDay": [ { "date": "2026-07-16", "weekday": "M", "seconds": 2040 } ],  // EXACTLY 7
      "strongestDay": { "date": "2026-07-19", "weekday": "T", "seconds": 5280 }        // nullable
    },
    "children": [ {
      "documentId": "abc123…", "givenName": "Emma", "familyName": "Chen"|null,
      "yearLevel": 7|null, "status": "active"|"archived"|"enrolled",
      "testsCompleted": 14, "practiceSecondsThisWeek": 5400, "practiceDayStreak": 12,
      "lastActivityAt": "2026-07-22T08:28:04.544Z"|null,
      "focusSkill": "speaking"|null,
      "skills": [ { "skill": "reading", "cefrBand": "B2"|null, "readiness": "met"|"not_assessed",
                    "acaraPhase": "Consolidating"|null, "displayLabel": "Critical Reader"|null,
                    "publishedAt": "…"|null, "resultDocumentId": "amkb…"|null } ]  // ALWAYS 4 entries — one per skill, "not_assessed" when no official result
    } ] },
  "meta": {} }
```

**AMENDMENT A1 supersedes v1 of this contract** (`.qa/CONTRACTS.md` "AMENDMENT A1 —
`C-DASH-HOUSEHOLD` v2"). v1 put a single per-child `cefrBand` / `cefrStageIndex` / `acaraPhase`
directly on `children[]`; that is a cross-skill composite, forbidden by
`docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:304` and `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:46`.
**Those three per-child fields are DELETED — do not author them.** A band exists ONLY inside
`skills[]`, one entry per skill, and `skills[]` MUST cover all four skills always (a skill with no
official result gets `readiness: "not_assessed"` and a null band — never omitted). This also closes
BLOCKED row **B-9** (per-child `Level {band}` pill).

Errors are the controller's job (067); this module only exports the DATA schema plus the two
shared constants below.

**Staging rule (binding for 060-066).** The Zod module is grown key-by-key alongside the service
so every intermediate state is a truthful description of what the endpoint actually returns.
This task lands ONLY the keys task 062 computes — `household.{childCount,testsCompleted,
resultsPublished}` and `children[].{documentId,givenName,familyName,yearLevel,status}` — as
`z.strictObject`s. Tasks 063-066 add their own keys, and none of them may reintroduce a per-child
`cefrBand`/`cefrStageIndex`/`acaraPhase`. Task 066 asserts the finished key set equals AMENDMENT
A1's key set byte-for-byte — NOT v1's superseded shape above it in `.qa/CONTRACTS.md`. No key is
ever present in the schema before the service computes it.

## Design source

- `.qa/design/spec/01-portal-dashboard.md` §10 metric inventory rows **1** (`tests completed`,
  integer, example `7`), **3** (`practice this week`, duration `{H}h {MM}m`, example `4h 20m`),
  **4** (`Practice minutes` / `last 7 days`, **7** bars, weekday letters `M T W T F S S`),
  **5** (strongest-day caption), **6** (six CEFR ticks), **7** (`Focus: {skill}`).
- `.qa/design/spec/02-portal-children.md` §A.5 ChildCard metric strip — cell 2 value `{{k.streak}}`
  label `day streak` (`12` / `5`) IS servable from `children[].practiceDayStreak`. The same cell's
  level pill copy `Level {{k.level}}` → `Level B1` is **BLOCKED B-9** (per-child single level is a
  cross-skill composite, AMENDMENT A1) — this schema exports no field for it.
- The design draws **six** ticks labelled `A1 A2 B1 B2 C1 C2`
  (`.qa/design/spec/01-portal-dashboard.md:335-336`). `C2` does not exist in this system and
  `pre_A1` does. This module exports the REAL ladder and nothing else:

  ```ts
  export const CEFR_LADDER = ['pre_A1', 'A1', 'A2', 'B1', 'B2', 'C1'] as const;  // 6 entries
  ```
  Source: `schooltest-api/src/api/result/content-types/result/schema.json` `cefr_band` enum and
  `src/contracts/vocab.ts:58`. `cefrStageIndex` is the **0-based** index into this array, computed
  PER SKILL client-side from a skill's `cefrBand` (`results` module, task 091) — AMENDMENT A1
  removed the per-child `cefrStageIndex` field this module used to export; the ladder itself is
  unchanged and still the single source of truth for that lookup.
- `export const READINESS_RANK = { not_yet: 0, approaching: 1, met: 2 } as const;` — the
  focus-skill ordering from the addendum (`not_assessed` excluded, never ranked).
- No colour, size or spacing value is in scope here: this task ships no UI. The navy `#0E2350`
  (`--color-navy-900`) / blue `#2563EB` (`--color-brand-600`) treatment of these numbers is
  W5/W6's, per `.qa/design/spec/04-ds-foundations.md#tailwind-v4-mapping`.

## Files

- CREATE `schooltest-api/src/contracts/parent-household-progress.ts`
- EDIT `schooltest-api/src/contracts/index.ts` — add `export * from './parent-household-progress';`
  (the barrel's stated purpose: "imported by server validation AND Playwright e2e")
- CREATE `schooltest-web/tests/e2e/household-progress-contract.spec.ts`

## Depends on

Nothing. W2 has no dependency on W0/W1 (`.qa/PLAN.md` wave table).

## Steps

1. Read `schooltest-api/src/contracts/parent-child-progress.ts` end to end — this module mirrors
   its conventions exactly: `z.strictObject`, `const text = z.string().min(1)`, `z.iso.datetime()`
   for timestamps, enums imported from `./vocab` (`skillSchema`, `cefrBandSchema`,
   `readinessSchema`), an exported `…DataSchema`, an exported `…ResponseSchema` with
   `meta: z.record(z.string(), z.unknown())`, and one `z.infer` type export.
2. Author `CEFR_LADDER` and `READINESS_RANK` as `as const` tuples/objects, with a comment citing
   `result/schema.json` and `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`.
3. Author the stage-1 schemas: `householdProgressHouseholdSchema` (3 non-negative ints),
   `householdProgressChildSchema` (documentId `text`; `givenName` string; `familyName`,
   `yearLevel` nullable; `status` `z.enum(['active','archived','enrolled'])`),
   `householdProgressDataSchema` = `{ household, children: z.array(child) }`,
   `householdProgressResponseSchema`.
4. Add the barrel export. Run `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.
5. Write the Playwright spec. It imports the schema module directly from
   `../../../schooltest-api/src/contracts/parent-household-progress` (the barrel's documented
   dual-use), reads real rows with the existing `runSql` helper
   (`tests/e2e/helpers/auth-db.ts`), and asserts:
   - every distinct `students.status` value in the database parses against the status enum
     (`select distinct status from students`);
   - every distinct `results.cefr_band` value parses against `cefrBandSchema` AND is a member of
     `CEFR_LADDER` (guards the `C2` design/data conflict);
   - `CEFR_LADDER.length === 6` and `CEFR_LADDER[0] === 'pre_A1'`;
   - a household object built from a real SQL count triple parses;
   - a MUTATED object (extra key `avgScore`, or `childCount: -1`) is REJECTED — the strictness is
     the whole point of the module.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rule 7 (TypeScript only), rule 19 (a UID/const declared once),
  rule 23 (`pnpm tsc --noEmit` before done); `.claude/rules/typescript.md` (no `any`; strict).
- `schooltest-web/.qa/RULES.md` [schooltest-api] — "Single source of truth: every shape is defined
  once as a Zod schema in `schooltest-api/src/contracts/`".
- `.qa/CONTRACTS.md` governing rules: Strapi v5 envelope, flat entities carrying `documentId`,
  **no numeric `id`**, no `attributes` wrapper, **no composite scores**.
- `schooltest-web/.claude/rules/testing.md` — the spec is written before/with the module, red first.

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` both clean.
- `cd schooltest-web && pnpm exec playwright test tests/e2e/household-progress-contract.spec.ts`
  passes against the running stack, including the reject-a-mutation assertion.
- The SQL-backed assertions above pass against the live dev database on 127.0.0.1:5540 (real rows,
  not fixtures) and survive a re-run after an API reload.
- `grep -n "id:" schooltest-api/src/contracts/parent-household-progress.ts` returns no numeric-`id`
  field; `grep -nE "\bany\b|populate: '\*'" ` on the new file returns nothing.
- No user-facing string is added → no i18n catalog change in this task (W3 owns the six catalogs
  for these surfaces). No UI is added → motion / 375px / axe are **n/a** and stated as such.
- Baseline regression: `pnpm exec playwright test` still 157 passed / 1 pre-existing fail.

## Assumptions

- The spec may import from `schooltest-api/src/` because `src/contracts/index.ts:3` states these
  contracts are "imported by server validation AND Playwright e2e". If the web tsconfig `include`
  refuses the cross-package path, fall back to a `zod`-only copy of the ladder constants inside the
  spec and assert equality by reading the api file as text — never by re-typing the shape.
- `strongestDay`, `practiceByDay`, and every per-child metric are DELIBERATELY absent from the
  stage-1 schema (tasks 063-066).

## Evidence

<!-- filled in as the task runs -->
