---
id: "098"
title: Add `useChildResultHistoryQuery` — paginated, skill-filterable, with a real empty state
layer: data
kind: wire
slice: Real server pagination for a child's official results, replacing the ≤5-row hard cap the design cannot build on
target: src/modules/children/queries/use-child-result-history.query.ts · src/modules/children/constants/query-keys.constants.ts · src/modules/children/index.ts · tests/e2e/w3-child-result-history-contract.spec.ts
contract: C-CHILD-RESULT-HISTORY
design: .qa/design/spec/02-portal-children.md#B.6 Component: RecentResults (L58–72)
status: TODO
depends_on: ["097", "077"]
---

## Objective

One TanStack Query hook that reads a page of a child's official results through the typed axios
boundary, validates its own request params before sending them, parses the response, and keeps the
previous page visible while the next one loads — so W6's pager does not flash a skeleton on every
click.

## Contract

`.qa/CONTRACTS.md` → **C-CHILD-RESULT-HISTORY**:

- `GET /api/my/students/:documentId/results`, parent JWT.
- Query, all optional, **strictly validated — unknown keys ⇒ `400`**: `page` int ≥1 (default `1`),
  `pageSize` int 1..50 (default `10`, >50 ⇒ `400 ValidationError`), `skill` ∈
  reading|listening|speaking|writing.
- `200 { data: Row[], meta: { pagination: { page, pageSize, pageCount, total } } }`.
- Sort `published_at_field:desc, createdAt:desc`; `destination='official'` only.
- `400` bad/unknown query · `401` no JWT · `403` non-parent role · **`404` unknown or foreign child**
  (indistinguishable, by design — a parent may not enumerate other families' children).
- Persistence effect: none.

**Client state contract this hook declares:**

| State | Condition | Caller behaviour (W6 renders it) |
|---|---|---|
| loading | `isPending` (first page only) | shimmer rows |
| paging | `isPlaceholderData` | previous page stays on screen, pager disabled, no layout jump |
| ready | `200`, `data.length > 0` | result rows + pager |
| empty | `200`, `total === 0` | the existing `Children.emptyResults` copy — this child has no official results yet. **NOT an error.** |
| empty-filtered | `200`, `total === 0` **and** a `skill` filter is set | "no results for this skill" + a clear-filter affordance; distinct from `empty` because the action differs |
| gone | `400`/`404` | `classifyQueryError → { kind:'gone' }` — one message for unknown/foreign, per the contract |
| forbidden | `403` | `{ kind:'forbidden' }` |
| broken | 5xx / transport / `ZodError` | `{ kind:'broken', cause }` |

## Design source

`.qa/design/spec/02-portal-children.md` §B.6 (`portal--child-detail.html` L58–72). Concrete values
already enumerated in task 097; the ones this task is responsible for enabling:

- The design renders a fixed placeholder count of **3** rows and a dead "All reports →" link
  (`13.5px/500/#7C8698`, hover `#2563EB` = `--color-brand-600`, "No handler bound"). Real pagination
  replaces it — `pageSize` default `10` per the contract, not 3.
- Row order on screen must be the server's order; the hook must not re-sort. `publishedAt` can be
  `null`, which is exactly why the server sorts on `published_at_field:desc, createdAt:desc` and why
  the client trusting that order is the correct behaviour (gap **G5**).

## Files

Create:
- `src/modules/children/queries/use-child-result-history.query.ts`
- `src/modules/children/constants/query-keys.constants.ts`

Touch:
- `src/modules/children/index.ts` — export the hook and key factory.
- `tests/e2e/w3-child-result-history-contract.spec.ts` — add two `test()` cases (step 4).

`src/modules/children/constants/` already holds `child-metrics` and `child-profile`; add the new
file beside them, do not merge into either.

## Depends on

- **097** — `childResultHistoryParamsSchema` / `childResultHistoryResponseSchema` and the types.
- **077** (W2) — the endpoint.

## Steps

1. `constants/query-keys.constants.ts` — pure, no runtime imports:
   ```
   export const CHILD_RESULTS_QUERY_KEY_ROOT = ['children', 'results'] as const;
   export const childResultHistoryQueryKey = (
     documentId: string,
     params: { page: number; pageSize: number; skill?: string },
   ) => [...CHILD_RESULTS_QUERY_KEY_ROOT, documentId, params] as const;
   ```
   Resource-first array (`.claude/rules/state-data.md`) under the existing `['children', …]` prefix
   that `useChildProgressQuery` already uses (`['children','progress',documentId]`), so task 103 can
   invalidate `['children']` coherently.
2. `queries/use-child-result-history.query.ts`:
   - `'use client'` literal first line.
   - `fetchChildResultHistory(documentId, params)`:
     `const query = childResultHistoryParamsSchema.parse(params);` — **parse the request first**, so
     `pageSize: 200` fails locally with a ZodError instead of a wasted `400` round trip;
     then `const res = await strapi.get(`/api/my/students/${documentId}/results`, { params: query });`
     Only send `skill` when it is defined — an explicit `skill: undefined` must not become
     `?skill=` (axios drops `undefined`, but build the object conditionally so the intent is
     legible and the "unknown/blank key ⇒ 400" rule can never be tripped).
     `return childResultHistoryResponseSchema.parse(res.data);`
   - `export function useChildResultHistoryQuery(documentId: string | undefined, params: ChildResultHistoryParams)`
     → `useQuery({ queryKey: childResultHistoryQueryKey(documentId ?? '', resolved),
     queryFn: () => fetchChildResultHistory(documentId!, params), enabled: Boolean(documentId),
     placeholderData: keepPreviousData, retry: false, staleTime: 30_000 })`.
   - `keepPreviousData` (imported from `@tanstack/react-query`) is what makes the `paging` state in
     the table above real; `retry: false` matches the by-id read style already used by
     `useChildProgressQuery` (a `404` here is terminal).
   - No `select`, no client-side sort, no client-side filter. The server owns order and filtering.
3. Barrel exports.
4. e2e cases in `tests/e2e/w3-child-result-history-contract.spec.ts`:
   - `'result history rejects an out-of-range page size'` — `childResultHistoryParamsSchema.parse({ pageSize: 51 })`
     throws client-side, AND the live `GET …/results?pageSize=51` answers `400 ValidationError`
     (both sides of the same rule).
   - `'result history query key is stable'` — `childResultHistoryQueryKey('abc', { page: 2, pageSize: 10 })`
     deep-equals `['children','results','abc',{ page: 2, pageSize: 10 }]`.

## Project rules

- `schooltest-web/.claude/rules/state-data.md` — one hook per query in `queries/`; array keys
  starting with the resource name; never axios in a component; invalidate after mutations (task 103).
- `schooltest-web/.claude/rules/nextjs-patterns.md` — `'use client'` literal first line.
- `schooltest-web/.claude/rules/module-pattern.md` — components stay dumb; no `useQuery` in a component.
- `schooltest-web/CLAUDE.md` law 9 (typed axios only), law 14 (no `any`), law 3 (never break
  existing logic — `useChildProgressQuery` keeps its ≤5-row read for the surfaces that use it today).
- `.qa/CONTRACTS.md` C-CHILD-RESULT-HISTORY 404 rule — unknown and foreign are one state on the client.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-child-result-history-contract.spec.ts` passes including
  both new cases against the running API.
- Evidence records a live two-page walk: `?page=1&pageSize=1` and `?page=2&pageSize=1` return
  different `documentId`s and consistent `meta.pagination.total`, proving real server pagination
  rather than a client slice. (If the seeded child has <2 official results, Evidence says so and the
  verifier creates a second official result through the normal API flow — never by SQL insert.)
- `grep -rn "\.sort(\|\.filter(" src/modules/children/queries/use-child-result-history.query.ts` →
  zero hits (order and filtering stay server-side).
- `grep -rn "as any\|: any\|@ts-ignore" src/modules/children/queries/use-child-result-history.query.ts` → zero hits.
- Every state in the contract table is either exercised by the spec or recorded in Evidence as
  unreachable with the current data, with the reason.
- No user-facing string → six catalogs untouched, still key-identical.
- Non-UI slice: no motion / viewport / axe criteria; W6's pager carries them.
- `pnpm exec playwright test tests/e2e/children-profile.spec.ts` still passes; Playwright baseline unchanged.

## Assumptions

- `keepPreviousData` is available from the installed TanStack Query v5
  (`.claude/rules/state-data.md` mandates v5). If the installed minor predates it, use
  `placeholderData: (prev) => prev` — same semantics, no new dependency.

## Evidence

<!-- filled in as the task runs -->
