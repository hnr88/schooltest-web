---
id: "092"
title: Add `useParentResultQuery` — the TanStack hook for one parent-readable official result
layer: data
kind: wire
slice: Reading a single official result through the typed axios boundary, with an explicit loading / not-found / error contract
target: src/modules/results/queries/use-parent-result.query.ts · src/modules/results/constants/query-keys.constants.ts · src/modules/results/index.ts · tests/e2e/w3-result-view-contract.spec.ts
contract: C-PARENT-RESULT-VIEW
design: .qa/design/spec/02-portal-children.md#B.5 Component: SkillsCard (L43–55) · .qa/design/spec/02-portal-children.md#B.6 Component: RecentResults (L58–72)
status: TODO
depends_on: ["090", "071"]
---

## Objective

One TanStack Query hook that reads `GET /api/results/:documentId` through the existing `strapi`
axios instance, parses the response with `resultViewSchema` before it can reach any caller, and
declares its loading / empty / error semantics explicitly. This is the only sanctioned way any
component will ever obtain a `ResultView`.

## Contract

`.qa/CONTRACTS.md` → **C-PARENT-RESULT-VIEW**:

- `GET /api/results/:documentId`, `Authorization: Bearer <parent JWT>` (attached automatically by
  the `strapi` request interceptor, `src/lib/axios/strapi.ts:32-43`).
- `200` → the BARE `ResultView` body (no `{ data, meta }` envelope —
  `schooltest-api/src/api/result/controllers/result.ts:23-28`).
- `401` no/invalid JWT — the axios response interceptor already clears the stored token on 401
  (`src/lib/axios/strapi.ts:45-53`); this hook must NOT duplicate or override that.
- `403` role not permitted.
- `404` unknown id **or foreign child** **or `destination='transient'`** — deliberately
  indistinguishable so a parent cannot probe which result ids exist. The client must therefore
  treat 404 as ONE state ("this report is not available to you") and must never render a
  different message for the three causes.
- Read-only: no persistence effect, so nothing to invalidate on success.

**Client state contract this hook declares:**

| State | Condition | What the caller gets |
|---|---|---|
| loading | first fetch in flight | `isPending === true`, `data === undefined` |
| ready | `200` + parse OK | `data: ResultView` |
| gone | `400`/`404` | `classifyQueryError(error) → { kind: 'gone' }` |
| forbidden | `403` | `{ kind: 'forbidden' }` |
| broken | 5xx, transport failure, or `ZodError` | `{ kind: 'broken', cause: 'http' \| 'network' \| 'contract' \| 'unknown' }` |

There is **no empty state**: a successful read always yields exactly one result object. "No results
at all" is a list-level state and belongs to task 098.

## Design source

`.qa/design/spec/02-portal-children.md` §B.6 **RecentResults** row (`portal--child-detail.html` L64)
is the entry point that will call this hook in W6: each row's `Report` affordance
(`font-size:13px; font-weight:600; color:#2563EB` → `--color-brand-600`) opens the result. §B.5
**SkillsCard** consumes the `attributes` map this hook returns. Neither is built here.

The design has **no loading, empty or error rendering for this surface at all**
(`.qa/design/spec/02-portal-children.md` UNKNOWNS, and `.qa/design/spec/01-portal-dashboard.md` §11.5).
The states above are therefore authored, and their DOM lands in W6 using the existing
`QueryErrorFallback` (`src/modules/query-errors/index.ts`) plus the design's own shimmer skeleton
(`.qa/design/screens/app--loading-skeleton.html`: `st-shimmer 1.4s linear infinite`, gradient
`#F1F5F9 25% → #E9EEF6 50% → #F1F5F9 75%`, `background-size:800px 100%`).

## Files

Create:
- `src/modules/results/queries/use-parent-result.query.ts`
- `src/modules/results/constants/query-keys.constants.ts`

Touch:
- `src/modules/results/index.ts` — export the hook and the key factory.
- `tests/e2e/w3-result-view-contract.spec.ts` — add one `test()`
  (`'parent result query key and live parse agree'`).

## Depends on

- **090** — `resultViewSchema` and `ResultView`.
- **071** (W2) — the parent branch/grant that makes the endpoint answer `200` for a parent.

## Steps

1. `constants/query-keys.constants.ts` — pure, ZERO runtime imports (it must be importable from a
   Node Playwright spec without dragging in `axios`/`@/lib/env`):
   ```
   export const RESULTS_QUERY_KEY_ROOT = 'results' as const;
   export const parentResultQueryKey = (documentId: string) =>
     [RESULTS_QUERY_KEY_ROOT, documentId] as const;
   ```
   The array starts with the resource name, matching `.claude/rules/state-data.md` "Query keys:
   arrays starting with resource name". Putting it in `constants/` (rather than inline in the query
   file as `notifications` does) is deliberate: task 103 needs one importable invalidation source and
   the e2e proof needs to read the key without booting the axios layer. This is the
   `module-pattern.md` folder law applied strictly, not a new convention.
2. `queries/use-parent-result.query.ts`:
   - `'use client'` as the literal first line.
   - `async function fetchParentResult(documentId: string): Promise<ResultView>` →
     `const response = await strapi.get(`/api/results/${documentId}`); return resultViewSchema.parse(response.data);`
     — note: `response.data` IS the ResultView (bare body), NOT `response.data.data`.
   - `export function useParentResultQuery(documentId: string | undefined)` returning `useQuery({
     queryKey: parentResultQueryKey(documentId ?? ''), queryFn: () => fetchParentResult(documentId!),
     enabled: Boolean(documentId), retry: false, staleTime: 30_000 })`.
   - `retry: false` is required, not stylistic: a 404 here is a legitimate terminal answer
     (foreign/transient/unknown) and retrying it three times triples the load against the
     120 req/min/IP limiter for no information gain. Mirror `useChildProgressQuery`
     (`src/modules/children/queries/use-child-progress.query.ts:16-20`), which already does this.
   - No `onError`, no toast, no redirect inside the hook — classification is the caller's job via
     the existing `classifyQueryError`.
3. Barrel export from `src/modules/results/index.ts`.
4. e2e case: assert `parentResultQueryKey('abc') ` deep-equals `['results','abc']`, and — reusing the
   live result id resolved in task 090's spec — assert the live `200` body parses and that a request
   for a syntactically valid but unknown id (`'nonexistentdoc000000000'`, the same shape
   `tests/e2e/notification-api-security.spec.ts:6` uses) returns `404` with
   `error.name === 'NotFoundError'`, proving the "gone" branch is reachable.

## Project rules

- `schooltest-web/.claude/rules/state-data.md` — one hook per query in `queries/use-x.query.ts`;
  array query keys starting with the resource name; never call axios directly in a component;
  all axios instances live in `src/lib/axios/`.
- `schooltest-web/CLAUDE.md` law 9 — never `fetch` from a client component; use the typed axios instance.
- `schooltest-web/.claude/rules/nextjs-patterns.md` — `'use client'` must be the literal first line.
- `schooltest-web/.claude/rules/module-pattern.md` — components stay dumb; this logic may not be
  inlined into a component later.
- `.qa/CONTRACTS.md` C-PARENT-RESULT-VIEW security note — the three 404 causes stay indistinguishable.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-result-view-contract.spec.ts` passes, including the new
  case: live `200` parses, unknown id returns `404 NotFoundError`, key shape is `['results', id]`.
- `grep -rn "strapi\.\(get\|post\|put\|delete\)" src/modules/results/components/ src/modules/results/hooks/ 2>/dev/null` → zero hits (no network call outside `queries/`).
- `grep -rn "as any\|: any\|@ts-ignore\|response.data.data" src/modules/results/` → zero hits.
- No user-facing string → six catalogs untouched, still key-identical.
- Non-UI slice: no motion / viewport / axe criteria; W6 owns the rendering of these states.
- Playwright baseline unchanged (157 passed / 1 known W9 red).

## Assumptions

- W2 id **071** ships the parent branch (see task 090's Assumptions for the reconciliation rule).
- `retry: false` matches the established house style for parent reads by id
  (`use-child-progress.query.ts`), so no reviewer decision is pending on it.

## Evidence

<!-- filled in as the task runs -->
