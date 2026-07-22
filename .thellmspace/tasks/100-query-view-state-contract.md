---
id: "100"
title: Add one typed loading / empty / ready / error view-state contract over TanStack results
layer: data
kind: build
slice: The shared, exhaustive state machine every redesigned data surface switches on — no more ad-hoc `isLoading ? … : isError ? …` ladders
target: src/modules/query-errors/types/query-error.types.ts · src/modules/query-errors/lib/to-query-view-state.ts · src/modules/query-errors/index.ts · tests/e2e/w3-query-view-state.spec.ts
contract: C-DASH-HOUSEHOLD · C-CHILD-RESULT-HISTORY · C-PARENT-RESULT-VIEW
design: .qa/design/screens/app--loading-skeleton.html · .qa/design/screens/app--empty-state.html · .qa/design/spec/06-auth-states-landing.md
status: TODO
depends_on: []
---

## Objective

Every W5/W6 surface needs the same four-way decision — skeleton, empty, content, error — and the
design supplies a skeleton screen and an empty screen but **no error screen and no per-surface state
logic**. Give the app one discriminated union plus one pure mapper so each screen's state handling is
exhaustive by the type checker, and so "empty" can never be mistaken for "broken".

## Contract

No new HTTP operation. This slice formalises the CLIENT side of three contracts that already exist:

- **C-DASH-HOUSEHOLD** — `200` with `children: []` is a legitimate EMPTY, not an error
  (`.qa/CONTRACTS.md`: `childCount` is "active + enrolled children of this parent"; zero is valid).
- **C-CHILD-RESULT-HISTORY** — `200` with `meta.pagination.total === 0` is EMPTY;
  `404` (unknown **or foreign** child) is one single indistinguishable "gone".
- **C-PARENT-RESULT-VIEW** — `404` covers unknown / foreign / transient, deliberately
  indistinguishable; `403` is role-only.

It reuses, and does not replace, the existing `classifyQueryError`
(`src/modules/query-errors/lib/classify-query-error.ts`) whose documented rules are already correct:
`ZodError → broken/contract`, `400|404 → gone`, `403 → forbidden`, everything else stays loud as
`broken`. **Do not rewrite that function.** This task wraps it.

## Design source

- `.qa/design/screens/app--loading-skeleton.html` — the loading state's real values:
  shimmer `background:linear-gradient(90deg,#F1F5F9 25%,#E9EEF6 50%,#F1F5F9 75%)`,
  `background-size:800px 100%`, `animation:st-shimmer 1.4s linear infinite`. Block radii `6px`
  (text lines), `8px` (headings), `10px` (rows/nav), `12px` (tiles), `999px` (avatars/pills);
  card chrome `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; padding:22px`;
  stacks `gap:8px`/`10px`/`14px`/`22px`. Tokens per `.qa/design/spec/04-ds-foundations.md`:
  `#F1F5F9 → --color-muted`, `#E9EEF6 → --color-shimmer-mid`, `#E3E8F0 → --color-border`.
- `.qa/design/screens/app--empty-state.html` — the empty state's real values: centred
  `flex:1; display:grid; place-items:center; padding:40px`; inner column `width:560px; gap:22px;
  text-align:center`; icon puck `96px × 96px; border-radius:999px; background:#EFF5FF`
  (`--color-brand-50`) with a `42px` stroke-1.8 glyph in `#2563EB` (`--color-brand-600`);
  `h1` `27px/700/-0.015em/#0E2350` (`--color-navy-900`); `p` `15px/1.6/#64748B`
  (`--color-muted-foreground`).
- **There is no designed error state anywhere in the export** (`.qa/design/spec/01-portal-dashboard.md`
  §11.5 and the UNKNOWNS of 01/02). The app already ships `QueryErrorFallback` with `QueryError.*`
  catalog keys; this task keeps that component as the error renderer and only routes to it.

This task ships NO markup. It ships the switch the markup hangs off.

## Files

Create:
- `src/modules/query-errors/lib/to-query-view-state.ts`
- `tests/e2e/w3-query-view-state.spec.ts`

Touch:
- `src/modules/query-errors/types/query-error.types.ts` — add the view-state union.
- `src/modules/query-errors/index.ts` — export the mapper and the types.

Do NOT touch `lib/classify-query-error.ts` or `components/QueryErrorFallback.tsx`.

## Depends on

- None inside W3. It depends only on code that already exists today.

## Steps

1. Add to `types/query-error.types.ts`:
   ```
   export type QueryViewState<TData> =
     | { status: 'loading' }
     | { status: 'paging'; data: TData }
     | { status: 'empty'; data: TData }
     | { status: 'ready'; data: TData }
     | { status: 'error'; error: QueryErrorState };
   ```
   `paging` exists because task 098 uses `keepPreviousData`: a page change must keep content on
   screen, and a component that cannot distinguish `paging` from `ready` will either flash a
   skeleton or leave the pager enabled during a fetch.
2. `lib/to-query-view-state.ts` — one pure function, no React import:
   ```
   export function toQueryViewState<TData>(
     result: { data: TData | undefined; isPending: boolean; isError: boolean;
               error: unknown; isPlaceholderData?: boolean },
     isEmpty: (data: TData) => boolean,
   ): QueryViewState<TData>
   ```
   Order of decisions, exactly: `isError` → `{ status:'error', error: classifyQueryError(result.error) }`;
   then `isPending || data === undefined` → `loading`; then `isPlaceholderData` → `paging`;
   then `isEmpty(data)` → `empty`; else `ready`.
   **Error precedes loading** on purpose: with `keepPreviousData` a refetch failure must surface as an
   error rather than as a silent stale render.
   The `isEmpty` predicate is a required argument, not a default — "empty" means something different
   per contract (`children.length === 0` vs `meta.pagination.total === 0`) and a shared guess would be
   wrong for one of them.
   Structural (not `UseQueryResult`) typing keeps this file free of a `@tanstack/react-query` import,
   so a Playwright Node spec can import it directly.
3. Barrel exports from `src/modules/query-errors/index.ts`.
4. `tests/e2e/w3-query-view-state.spec.ts` — TDD, red first. It imports the mapper via
   `@/modules/query-errors` and asserts the full truth table with real error objects, including:
   an `AxiosError` with `response.status = 404` → `{ status:'error', error:{ kind:'gone' } }`;
   a `ZodError` → `{ kind:'broken', cause:'contract' }`; `isPending:true` → `loading`;
   placeholder data → `paging`; `isEmpty` true → `empty`. To keep it a real end-to-end proof rather
   than a unit test in disguise, the spec ALSO drives the running app: it navigates to
   `/dashboard/children/nonexistentdoc000000000` while logged in as the seeded parent and asserts the
   existing `QueryErrorFallback` "gone" copy renders — proving the classification this mapper
   delegates to is the one the live app actually produces for a 404.

## Project rules

- `schooltest-web/.claude/rules/module-pattern.md` — pure utilities in `lib/`, types in `types/`,
  barrel exports; the mapper must stay component-free.
- `schooltest-web/.claude/rules/quality.md` — no `any`; 200-line cap; WCAG-relevant rendering stays
  in W5/W6 where the DOM is.
- `schooltest-web/CLAUDE.md` laws 1 and 4 — do exactly what is asked; do not touch
  `classify-query-error.ts` or `QueryErrorFallback.tsx`.
- `schooltest-web/.claude/rules/testing.md` + **D-VERIFY-1** — the proof is a Playwright run against
  the running app.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-query-view-state.spec.ts` passes, including the live
  `/dashboard/children/<unknown-id>` navigation asserting the real "gone" fallback copy from the
  `QueryError.*` catalog keys.
- Exhaustiveness proof: a deliberate `switch` over `QueryViewState['status']` missing one arm fails
  `pnpm tsc --noEmit` — recorded in Evidence with the compiler error text.
- `git diff --stat src/modules/query-errors/lib/classify-query-error.ts src/modules/query-errors/components/QueryErrorFallback.tsx`
  → empty.
- `grep -rn "as any\|: any\|@ts-ignore" src/modules/query-errors/lib/to-query-view-state.ts` → zero hits.
- No user-facing string added (existing `QueryError.*` keys are reused) → six catalogs untouched and
  still key-identical.
- Non-UI slice: no motion / viewport / axe criteria; the skeleton and empty markup with their
  `st-shimmer` motion and `prefers-reduced-motion` variants are W5/W6 tasks against the design values
  quoted above.
- Playwright baseline unchanged (157 passed / 1 known W9 red).

## Assumptions

- `/dashboard/children/<unknown-id>` already renders `QueryErrorFallback` today (the `children`
  module ships `profileGoneTitle` / `profileGoneDescription` keys). If the live app instead 404s at
  the route level, the spec targets whichever existing surface does exercise `classifyQueryError`,
  and Evidence records the substitution.

## Evidence

<!-- filled in as the task runs -->
