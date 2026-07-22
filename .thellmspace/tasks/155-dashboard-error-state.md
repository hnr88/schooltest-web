---
id: 155
title: Dashboard page error state — real classification, real retry, no stale metrics
layer: frontend
kind: implement
slice: The dashboard when GET /api/my/progress fails
target: src/modules/dashboard/components/DashboardErrorState.tsx, src/modules/dashboard/components/DashboardScreen.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/06-auth-states-landing.md · .qa/design/spec/01-portal-dashboard.md#UNKNOWNS
status: TODO
depends_on: ["130", "154"]
---

## Objective
When the household aggregate fails, the parent gets a specific, recoverable message — never a blank
page, never a hero full of zeros, never yesterday's numbers beside an error banner.

## Contract
`C-DASH-HOUSEHOLD` error table, verbatim:
> | `400` | `ValidationError` | any query parameter present |
> | `401` | `UnauthorizedError` | absent/invalid JWT |
> | `403` | `ForbiddenError` | caller role is not `parent` (message: `'Only parents can view household progress'`) |

Plus transport failures (offline, timeout — the axios instance has a 60s timeout) and `429` from the
120 req/min/IP limiter.

Per-status behaviour:
- **401** — the axios response interceptor (`src/lib/axios/strapi.ts:45-53`) already clears the
  token; `ParentGuard`/`useRequireParent` then redirects to `/sign-in`. This screen must NOT also
  render an error card in that window — it renders nothing and lets the guard win. Preserve that
  existing behaviour exactly.
- **403** — "This account is not a parent account." No retry button (retrying cannot help).
- **400** — an implementation bug (the client must send no query params). Show the generic error
  WITH retry, and the e2e must prove the client never sends a query string to this endpoint.
- **429** — "Too many requests. Try again in a moment." Retry enabled.
- **5xx / network** — generic message, retry enabled.

## Design source
Spec §UNKNOWNS: no error state exists in the design. Authored from the existing, already-shipped
primitives — **reuse, do not rebuild**:
- `QueryErrorFallback` + `classifyQueryError` from `@/modules/query-errors` (barrel) — this module
  exists precisely for this and already classifies query errors.
- If `QueryErrorFallback`'s shape does not carry a retry action, use the design-system `Alert
  variant="error"` + `Button` pair that `DashboardScreen` uses today, so the visual language does
  not fork.
- Placement: replaces the hero grid, the children section and the note grid — i.e. everything below
  the greeting. **The greeting row stays**, so the page still has its `<h1>` and does not look
  crashed. `data-slot="dashboard-error"`, `role="alert"`.
- Card shell matches the page: `rounded-portal bg-card p-8 shadow-sm`.
- Retry: a real `Button` bound to the query's `refetch()`, `loading={isFetching}` so the button
  shows the design-system spinner (`st-spin`) rather than double-firing.
- Motion: `animate-in fade-in duration-200 ease-out-expo motion-reduce:animate-none`.
- 375px: full width, `p-6`, button full width.

## Files
- CREATE `src/modules/dashboard/components/DashboardErrorState.tsx` (≤100 lines).
- EDIT `DashboardScreen` — branch on `status === 'error'`; keep the greeting mounted.
- i18n: `Dashboard.error.title`, `.description`, `.forbidden`, `.rateLimited`, `.retry` (reuse the
  existing `Dashboard.retry` if the copy fits — check before adding).

## Depends on
- **130** (the state), **154** (so loading and error are mutually exclusive branches).

## Steps
1. Classify with `classifyQueryError`; map to the five messages above.
2. Render the card; keep the greeting; bind retry to `refetch()`.
3. Prove no stale data leaks into the error branch.

## Project rules
- `.claude/rules/state-data.md` — reuse the `query-errors` module; never re-implement error
  classification.
- `.claude/rules/module-pattern.md` — cross-module import through the barrel only.
- `.claude/rules/nextjs-patterns.md` — `error.tsx` boundaries recover with `unstable_retry()`, not
  `reset()`; this in-page state is a query error, not a render error, and must not throw to the
  boundary.
- `.claude/rules/quality.md` — `role="alert"`, focus management, keyboard-operable retry.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright, each proven separately with `page.route` on `**/api/my/progress`:
  - `500` ⇒ `[data-slot="dashboard-error"]` visible with retry; hero/chart/children/note slots all
    count 0; the `<h1>` is still present.
  - `403` with the real error envelope ⇒ the forbidden copy renders and **no** retry button exists.
  - `429` ⇒ the rate-limit copy renders with retry.
  - `401` ⇒ the page redirects to `/sign-in` and `app.auth.token` is `null` (existing behaviour,
    unchanged).
- Retry works for real: first response `500`, second `200` ⇒ clicking retry renders the real
  dashboard with live numbers, with no reload.
- No stale data: load successfully, then force the next refetch to `500` ⇒ the error state shows and
  no metric value from the previous render is on screen.
- Query-string proof: assert every observed request to `/api/my/progress` has an empty search string
  (guarding the contract's `400 ValidationError` rule).
- axe clean in the error state; 375px no overflow.
- Six catalogs key-identical; zero banned-pattern hits.

## Assumptions
- `classifyQueryError` exposes the HTTP status; if not, read it from the axios error and extend that
  module rather than branching on strings in the component.

## Evidence
<filled in as the task runs>
