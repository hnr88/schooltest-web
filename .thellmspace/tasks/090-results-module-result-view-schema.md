---
id: "090"
title: Create the `results` module and mirror the C-PARENT-RESULT-VIEW body as a strict Zod schema
layer: data
kind: scaffold
slice: The typed client boundary for a single parent-readable official result (`GET /api/results/:documentId`)
target: src/modules/results/schemas/result-view.schema.ts · src/modules/results/types/result.types.ts · src/modules/results/index.ts · tests/e2e/w3-result-view-contract.spec.ts
contract: C-PARENT-RESULT-VIEW
design: .qa/design/spec/02-portal-children.md#B.5 Component: SkillsCard (L43–55) · .qa/design/screens/portal--child-detail.html
status: TODO
depends_on: ["071"]
---

## Objective

Stand up the new `src/modules/results/` module and give the web app ONE strict Zod mirror of the
`ResultView` body that `GET /api/results/:documentId` returns to a parent, so the per-attribute
mastery map the design's "Skills" section needs arrives type-checked instead of cast. No UI, no
hook, no helper in this slice — schema + types + barrel only.

## Contract

`.qa/CONTRACTS.md` → **C-PARENT-RESULT-VIEW — GET /api/results/:documentId (parent branch)**:

- Transport: `GET /api/results/:documentId` (route already exists; no new route file).
- Auth: parent JWT. Grant `result.getResult` → `parent`.
- Ownership: the result's `student.parent.documentId` MUST equal the caller's `documentId`
  **and** `destination` MUST be `official`. Anything else ⇒ `404 NotFoundError` (never 403 — a
  parent must not be able to probe which result ids exist).
- Success `200` with the EXISTING `ResultView` shape from `schooltest-api/src/contracts/results.ts`
  — no new shape, no parent-specific variant. Fields the UI consumes: `scope`, `skill`,
  `attributes` (`{status, prob, prob_se?, items, delta}` per attribute code), `display_label`,
  `acara_phase`, `cefr_band`, `readiness`, `low_confidence`, `effort_valid`, `supplementary`,
  `productive_scores`, `status`, `published_at`.
- Errors: `401` no/invalid JWT · `403` role not permitted · `404` unknown id, foreign child, or
  `destination='transient'`.
- Persistence effect: none (read-only).

**Envelope gotcha — read this before writing the schema.** Unlike every other endpoint this app
consumes, `getResult` does NOT return `{ data, meta }`. `schooltest-api/src/api/result/controllers/result.ts:23-28`
sets `ctx.body = await view.getResultView(...)` directly and its own docblock states: *"returns the
BARE ResultView body (not the { data, meta } entity envelope), so core sanitizeOutput/transformResponse
do not apply"*. The web schema therefore parses the **top-level object**, not `.data`.
(`.qa/DECISIONS.md` **D-CONTRACT-1**: the code is authoritative.)

**Field-for-field source of truth** — `schooltest-api/src/contracts/results.ts`, `resultViewSchema`.
Note the wire keys are **snake_case** (`document_id`, `display_label`, `cefr_band`, `acara_phase`,
`low_confidence`, `effort_valid`, `productive_scores`, `published_at`,
`previous_result_document_id`, `session_document_id`) — do NOT camelCase them in the schema; the
mirror must be 1:1 or the parse is a lie. Camel-casing, if any, happens in a view-model helper
(task 093), never at the boundary.

## Design source

`.qa/design/spec/02-portal-children.md` §B.5 **SkillsCard** (`portal--child-detail.html` L43–55) is
the surface this data feeds; it is BUILT in W6, not here. The values this task must respect from it:

- The card renders one row per skill with `grid-template-columns:76px 1fr 38px; gap:14px`, a `6px`
  track (`#EEF1F6` → W0's portal-hairline token) and a fill tinted `#0E2350`
  (`--color-navy-900`) for normal skills, `#2563EB` (`--color-brand-600`) for the focus skill.
- The design's bar `pct` (`78%`, `70%`, `52%`, `64%`) is **not in this contract and must never be
  synthesised** — see `.qa/CONTRACTS.md` B-3/B-4/B-5. What IS in this contract is `attributes[code].prob`
  (per-attribute mastery probability), sanctioned by `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:45`
  and named in `.qa/intake/docs-constraints.md` as the primary datum. This task only types it.
- `sk.grade` in the design (`B1+`, `A2+`) has no `+` variant in the API's `cefr_band` enum. The
  schema types the real enum (`pre_A1|A1|A2|B1|B2|C1`); the design↔data conflict is recorded in
  task 091, not reconciled here.

## Files

Create:
- `src/modules/results/schemas/result-view.schema.ts`
- `src/modules/results/types/result.types.ts`
- `src/modules/results/index.ts`
- `tests/e2e/w3-result-view-contract.spec.ts`

Touch: none. (Do not edit `src/modules/children/**` in this task.)

## Depends on

- **071** — the W2 task that adds the parent branch + `result.getResult` → `parent` grant to
  `GET /api/results/:documentId`. Until it lands a parent gets `403 'role may not read results (C-4)'`
  (gap **G2**, `.qa/intake/api-inventory.md:798`) and the round-trip proof below cannot pass.

## Steps

1. Create the module folders per `.claude/rules/module-pattern.md`: `schemas/`, `types/`, and the
   barrel `index.ts`. Nothing else yet (`constants/`, `lib/`, `queries/` arrive in 091–093).
2. Write `schemas/result-view.schema.ts` mirroring `schooltest-api/src/contracts/results.ts` exactly:
   - Local enums, matching `schooltest-api/src/contracts/vocab.ts`:
     `skillSchema = z.enum(['reading','listening','speaking','writing'])`,
     `cefrBandSchema = z.enum(['pre_A1','A1','A2','B1','B2','C1'])`,
     `readinessSchema = z.enum(['met','approaching','not_yet','not_assessed'])`,
     `resultStatusSchema = z.enum(['scoring','partial_pending','complete'])`,
     `resultDestinationSchema = z.enum(['official','transient'])`,
     `attributeStatusSchema` — mirror the api enum verbatim; read it from
     `schooltest-api/src/contracts/vocab.ts` rather than guessing.
   - `resultSupplementarySchema = z.strictObject({ vocab_band_a2_accuracy: z.number().min(0).max(1).nullable(), vocab_band_b1_accuracy: z.number().min(0).max(1).nullable(), dprime: z.number().nullable().optional() })`.
   - `resultAttributeEntrySchema = z.union([ z.strictObject({ status: attributeStatusSchema, prob: z.number().nullable(), prob_se: z.number().optional(), items: z.number().int().min(0), delta: z.number().nullable() }), z.literal('not_assessed') ])`
     — the literal string branch is load-bearing (api CT-7: a zero-administered attribute is the
     literal `"not_assessed"`, never `null`, never `0.5`).
   - `resultViewBaseSchema = z.strictObject({...})` with all 18 keys from the api contract, in the
     same order, same nullability: `document_id`(min 1), `scope: z.enum(['skill','combined'])`,
     `skill: skillSchema.nullable()`, `status`, `attributes: z.record(z.string().min(1), resultAttributeEntrySchema).nullable()`,
     `provisional: z.literal('field_test').nullish()`, `display_label: z.string().nullable()`,
     `acara_phase: z.string().nullable()`, `cefr_band: cefrBandSchema.nullable()`,
     `readiness: readinessSchema.nullable()`, `low_confidence: z.boolean().nullable()`,
     `effort_valid: z.boolean().nullable()`, `productive_scores: z.record(z.string(), z.unknown()).nullable()`,
     `supplementary: resultSupplementarySchema.nullable()`, `destination: resultDestinationSchema`,
     `published_at: z.iso.datetime().nullable()`, `previous_result_document_id: z.string().min(1).nullable()`,
     `session_document_id: z.string().min(1).nullable()`.
   - `resultViewSchema = resultViewBaseSchema.extend({ combined_children: z.array(resultViewBaseSchema).optional() })`.
   - `z.strictObject` everywhere — an unexpected key must FAIL the parse. That is the contract-drift
     alarm this whole wave exists for.
3. `types/result.types.ts`: `export type ResultView = z.infer<typeof resultViewSchema>` plus
   `ResultViewBase`, `ResultAttributeEntry`, `ResultSupplementary`, `ResultSkill`, `ResultCefrBand`,
   `ResultReadiness`, `ResultAttributeStatus`. `import type { z } from 'zod'` only — no runtime
   import in a types file.
4. `index.ts` barrel exports the schemas and the types (values and types separately; `export type {…}`).
5. TDD: write `tests/e2e/w3-result-view-contract.spec.ts` FIRST, red before green. It must:
   - `POST http://localhost:5500/api/auth/local` as the seeded parent
     (`parent@schooltest.local` / `Parent1234!`, `tests/e2e/helpers/auth.ts` `SEEDED_PARENT`) for a real JWT;
   - `GET /api/my/students` → first child → `GET /api/my/students/:documentId/progress` →
     take `recentResults[0].documentId` (the only parent-reachable source of a real official
     result id — do not hardcode an id);
   - `GET /api/results/:documentId` with the parent Bearer token, expect `200`;
   - `import { resultViewSchema } from '@/modules/results/schemas/result-view.schema'` and assert
     `resultViewSchema.parse(await response.json())` does not throw, then assert the parsed object's
     `destination === 'official'` and `document_id` matches the requested id.
   - Skip-with-a-loud-message (`test.skip`) only if the seeded parent genuinely has zero official
     results; never make the assertion conditional on shape.

## Project rules

- `schooltest-web/.claude/rules/module-pattern.md` — Zod `z.object(...)` lives ONLY in
  `schemas/x.schema.ts`; `type`/`interface` ONLY in `types/x.types.ts`; every module has a barrel
  `index.ts`; cross-module imports go through the barrel, never into internals.
- `schooltest-web/.claude/rules/imports.md` — `@/` alias always; never import your own module's barrel.
- `schooltest-web/.claude/rules/quality.md` — 200 lines max per file; no `any` (CLAUDE.md law 14 —
  use `unknown` and narrow, which is exactly what `z.record(z.string(), z.unknown())` does here).
- `schooltest-web/.claude/rules/testing.md` + `.qa/DECISIONS.md` **D-VERIFY-1** — TDD red→green; the
  proof is a real Playwright run against the running app/API.
- `.qa/CONTRACTS.md` governing rule "Single source of truth": the api contract is defined once in
  `schooltest-api/src/contracts/` and mirrored 1:1 here. Neither side re-types a shape by hand.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-result-view-contract.spec.ts` passes against the running
  app + API: real `200`, and the LIVE body parses through `resultViewSchema` with no thrown ZodError.
- Deliberate negative proof recorded in Evidence: mutating one key name in a copy of the live body
  (e.g. `cefr_band` → `cefrBand`) makes `resultViewSchema.parse` throw. Strictness is real, not decorative.
- `grep -rn "as any\|: any\|@ts-ignore\|@ts-expect-error\|z.any()\|\.passthrough()\|\.optional()\.optional()" src/modules/results/` → zero hits.
- No existing spec turns red: `pnpm exec playwright test` still reports the 157-passed baseline
  (`.qa/PLAN.md` "Regression baseline"), with the single known W9-owned red unchanged.
- Non-UI slice: no motion, viewport or axe criteria — this task ships zero DOM. The consuming
  surfaces in W6 carry those.
- No i18n change (no user-facing string in this task), so the six catalogs are untouched and
  therefore still key-identical.

## Assumptions

- W2 id **071** is the task that ships the C-PARENT-RESULT-VIEW parent branch and its grant. The W2
  fragment (`.qa/fragments/w2.json`) was not yet written when this file was authored; if the real id
  differs, retarget `depends_on` to the W2 id whose title covers "parent branch + `result.getResult`
  grant" — the edge itself (this task cannot pass until a parent gets `200`) is not in doubt.
- The seeded parent (`.qa/DECISIONS.md` D-AUTH-1) has at least one official result reachable via
  `recentResults`. If not, the verifier seeds one through the API's normal flow — never by SQL insert.

## Evidence

<!-- filled in as the task runs: status codes, request/response, DB rows, e2e output, screenshots -->
