---
id: 071
title: Enforce the strict query contract on /api/my/students/:documentId/results — page, pageSize, skill, unknown keys
layer: backend
kind: implement
slice: GET /api/my/students/:documentId/results — the request-validation boundary
target: schooltest-api/src/api/student/controllers/parent-results.ts · services/parent-results.ts · schooltest-web/tests/e2e/child-result-history-query.spec.ts
contract: C-CHILD-RESULT-HISTORY
design: .qa/design/spec/02-portal-children.md#b5-component-skillscard · #b6-component-recentresults
status: TODO
depends_on: [070]
---

## Objective

Make the query surface exactly as wide as the contract says and not one key wider. An
over-permissive query on a parent-scoped read is how ownership filters get re-pointed and how
`pageSize=100000` becomes a denial of service, so this is a validation slice, not a polish slice.

## Contract

`.qa/CONTRACTS.md` → **C-CHILD-RESULT-HISTORY**, request query — "all optional, strictly validated,
unknown keys ⇒ `400`":

| Param | Type | Default | Rule |
|---|---|---|---|
| `page` | int ≥ 1 | `1` | |
| `pageSize` | int 1..50 | `10` | `> 50` ⇒ `400 ValidationError` |
| `skill` | enum `reading\|listening\|speaking\|writing` | — | filters to that skill |

Error: `400` `ValidationError` with the repo's Zod→400 details shape —
`{ fields: string[], issues: string[] }`, exactly as
`src/api/search-preference/controllers/search-preference.ts:25-31` and
`src/api/student/services/student.ts:27-35` produce it. Message: `'invalid child results query'`.

Note the deliberate divergence from the sibling surface: `/my/students/:documentId/progress` accepts
**no** query at all (`400 'child progress does not accept query parameters'`), while this endpoint
accepts exactly three keys. Both are strict; neither silently ignores input.

## Design source

- `.qa/design/spec/02-portal-children.md` §B.6 — the `All reports →` link is the paging affordance;
  `pageSize` default `10` serves both the 3-row card and the first screen of the full list.
- §B.5 SkillsCard — each SkillRow (`grid-template-columns:76px 1fr 38px; gap:14px`; name
  `13px/#7C8698`; grade `12px/600`) is a per-skill entry point. `?skill=speaking` is what lets W6
  drill from a skill row into that skill's history without client-side filtering of a truncated
  page. The focus skill's `#2563EB` tint (`--color-brand-600`) marks which row a parent is most
  likely to click.
- No UI ships in this task.

## Files

- EDIT `schooltest-api/src/api/student/controllers/parent-results.ts`
- EDIT `schooltest-api/src/api/student/services/parent-results.ts` (only if the skill filter needs
  to move into the Document Service filter — it should already be there from 070)
- CREATE `schooltest-web/tests/e2e/child-result-history-query.spec.ts`

## Depends on

- **070** — the live endpoint and its controller.

## Steps

1. Parse `ctx.query` with `parentChildResultsQuerySchema` (069) **before**
   `this.validateQuery(ctx)` / `this.sanitizeQuery(ctx)`, so an unknown key is rejected by the
   contract rather than silently stripped by Strapi's sanitiser. Order matters: `sanitizeQuery`
   would remove `filters[student]` and the caller would get a 200 with unfiltered semantics.
2. On `safeParse` failure, throw the repo's typed 400 via a local `throwValidationError(error)`
   helper copied in shape from `search-preference.ts:25-31`:
   `fields = [...new Set(issues.map(i => String(i.path[0] ?? '(root)')))]`,
   `issues = issues.map(i => \`${i.path.join('.') || '(root)'}: ${i.message}\`)`.
3. Confirm the parsed `skill` reaches the Document Service filter as
   `skill: { $eq: parsed.skill }` and that `scope='combined'` rows (whose `skill` is `null`) are
   therefore excluded when the filter is present — that is correct and must be asserted, not
   accidental.
4. Confirm `page`/`pageSize` reach `start`/`limit` and that **no** clamping-instead-of-rejecting
   happens: `pageSize=51` is a `400`, NOT a silent clamp to 50. (`GET /api/my/students` clamps to
   100; this endpoint deliberately rejects — the contract says `> 50 ⇒ 400`.)
5. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rule 10 (never skip sanitization), rule 21 (`@strapi/utils` typed
  errors — a bare throw becomes an unusable 500), rule 22 (never mutate `ctx.request.body`), rule 23.
- `.claude/rules/controllers.md` — "Enforce max pageSize inside replaced find actions"; the
  sanitize triad.
- `.claude/rules/rest-api.md` — the `{ data: null, error: { status, name, message, details } }`
  envelope.
- `.qa/CONTRACTS.md` C-CHILD-RESULT-HISTORY request-query table, verbatim.

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/child-result-history-query.spec.ts` passes, every case a
  real request against the running API with a parent JWT and the parent's own child:
  - `?` (none) → `200`, `meta.pagination.page === 1`, `pageSize === 10`;
  - `?page=2&pageSize=1` → `200`, `pageSize === 1`, `page === 2`;
  - `?pageSize=50` → `200`; `?pageSize=51` → **`400`** `ValidationError`, `error.details.fields`
    contains `pageSize`;
  - `?pageSize=0`, `?pageSize=-1`, `?page=0`, `?page=-3`, `?page=abc`, `?pageSize=1.5` → **`400`**
    each;
  - `?skill=reading` → `200` and **every** returned row has `skill === 'reading'`;
    cross-checked against `runSql` count for that (child, skill, official) triple;
  - `?skill=combined`, `?skill=maths`, `?skill=` → **`400`**;
  - `?sort=createdAt:asc`, `?filters[destination][$eq]=transient`, `?populate=*`,
    `?fields[0]=attributes`, `?pagination[page]=2` → **`400`** each (unknown keys). The
    `filters[destination]` case is the security-relevant one: a caller must not be able to widen
    the official-only scope;
  - every `400` body is the Strapi v5 envelope with `data: null`, `error.name === 'ValidationError'`,
    `error.message === 'invalid child results query'`, and non-empty `details.fields` +
    `details.issues`;
  - a valid query still returns `documentId`-keyed rows with no numeric `id`.
- Regression: `?skill=…` combined with `page`/`pageSize` behaves (assert `total` for the filtered
  set differs from the unfiltered `total` when the child has more than one skill).
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression: 157 passed / 1 pre-existing fail.

## Assumptions

- Koa delivers repeated keys as arrays (`?page=1&page=2` → `['1','2']`); the coerced-int schema will
  reject that as a `400`. Assert it rather than assuming a first-wins coercion.
- The seeded parent's children have at most one official result each today, so some filtered-vs-
  unfiltered assertions may compare `1` against `0`. That is still a real inequality; if a child
  with two skills is needed, read one from the wider `results` table with `runSql` and use its
  owning parent only if that parent's credentials are already known — never create data by hand.

## Evidence

<!-- filled in as the task runs -->
