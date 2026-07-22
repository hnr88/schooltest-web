---
id: "095"
title: Add `useHouseholdProgressQuery` with an explicit loading / no-children / error contract
layer: data
kind: wire
slice: The dashboard's single aggregate read — one request instead of the 1+N the design would otherwise need
target: src/modules/dashboard/queries/use-household-progress.query.ts · src/modules/dashboard/constants/query-keys.constants.ts · src/modules/dashboard/index.ts · tests/e2e/w3-household-contract.spec.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#3. THE HERO PANEL · .qa/design/spec/01-portal-dashboard.md#4. THE STATS STRIP / METRIC CARDS
status: TODO
depends_on: ["094", "065"]
---

## Objective

One TanStack Query hook over `GET /api/my/progress`, parsing through
`householdProgressResponseSchema` at the boundary, with a named query key the mutations in task 103
can invalidate, and a written-down contract for what the dashboard renders while loading, when the
parent has no children, and on each failure class.

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD**. The parts that bind this hook:

- `GET /api/my/progress`, parent JWT (attached by the `strapi` request interceptor,
  `src/lib/axios/strapi.ts:32-43`).
- **Query: none accepted — any query key ⇒ `400 ValidationError`.** So the hook passes NO `params`
  object to axios. Not an empty one, not `{}` with conditional spreads — none. A stray `?` kills the
  whole dashboard with a 400.
- `200 { data: { household, children }, meta: {} }`; read-only, no persistence effect.
- `401 UnauthorizedError` absent/invalid JWT · `403 ForbiddenError` non-parent role
  (`'Only parents can view household progress'`).
- Reason this endpoint exists (quoted): *"`/my/students/:documentId/progress` is strictly per-child
  (gap G1), so the design's dashboard would otherwise need 1+N requests against a 120 req/min/IP
  limiter."* Therefore the dashboard must issue exactly ONE household request — a per-child loop is
  a contract violation, not an implementation detail.

**Client state contract this hook declares:**

| State | Condition | Caller behaviour (W5 renders it) |
|---|---|---|
| loading | `isPending` | design's shimmer skeleton (`st-shimmer 1.4s linear infinite`) for hero + chart + child rows |
| ready | `200`, `children.length > 0` | full dashboard |
| empty | `200`, `children.length === 0` **and** `household.childCount === 0` | the "no children linked yet" surface (`.qa/design/screens/app--empty-state.html`) — NOT an error, NOT a spinner |
| ready-no-practice | `200`, children exist, `strongestDay === null` and every `practiceByDay[].seconds === 0` | chart renders 7 zero bars with no highlight and the caption is suppressed — never a fabricated "strongest day" |
| forbidden | `403` | `classifyQueryError → { kind:'forbidden' }` |
| broken | 5xx / transport / `ZodError` | `{ kind:'broken', cause }` |

`401` is not a rendered state: the axios response interceptor clears the token
(`src/lib/axios/strapi.ts:45-53`) and the existing `ParentGuard`
(`src/app/[locale]/dashboard/layout.tsx:22`) sends the user to `/sign-in`. Preserve that; do not add
a second redirect.

## Design source

`.qa/design/spec/01-portal-dashboard.md` §3–§4 (`portal--main.html`), the surface this hook feeds
(built in W5, not here). Values recorded so the payload's sufficiency is provable:

- Hero stat cell: value `font-size:24px; font-weight:700; letter-spacing:-0.02em; color:#FFFFFF`;
  label `font-size:12px; font-weight:400; color:#8FA3C7; margin-top:3px`. Cells separated by
  `width:1px; background:rgba(255,255,255,.12)`.
- Hero stats left→right: `7 / tests completed`, `2 / coming up` (**BLOCKED B-1 — no field, task 102**),
  `4h 20m / practice this week`.
- Practice card: `background:#FFFFFF; border-radius:24px; padding:28px 30px; box-shadow:0 1px 2px rgba(14,35,80,.04)`;
  header `h2` "Practice minutes" `16px/600/#0E2350` (`--color-navy-900`), range "last 7 days"
  `12.5px/#7C8698`; plot `flex:1; display:flex; align-items:flex-end; gap:14px; margin-top:20px; min-height:120px`.

## Files

Create:
- `src/modules/dashboard/queries/use-household-progress.query.ts`
- `src/modules/dashboard/constants/query-keys.constants.ts`

Touch:
- `src/modules/dashboard/index.ts` — export the hook and the key.
- `tests/e2e/w3-household-contract.spec.ts` — add two `test()` cases (see step 4).

## Depends on

- **094** — `householdProgressResponseSchema` and the `HouseholdProgress` type.
- **065** (W2) — the endpoint itself.

## Steps

1. `constants/query-keys.constants.ts` (pure; no runtime imports, so a Playwright Node spec can
   import it without booting axios/env):
   ```
   export const HOUSEHOLD_PROGRESS_QUERY_KEY = ['dashboard', 'household-progress'] as const;
   ```
   Resource-name-first array per `.claude/rules/state-data.md`, and it sits under the same
   `['dashboard', …]` prefix the existing student queries use
   (`['dashboard','students',{…}]`, `['dashboard','search-students',q]`) so prefix invalidation in
   task 103 is coherent.
2. `queries/use-household-progress.query.ts`:
   - `'use client'` as the literal first line.
   - `async function fetchHouseholdProgress(): Promise<HouseholdProgress> { const res = await strapi.get('/api/my/progress'); return householdProgressResponseSchema.parse(res.data).data; }`
     — **no second argument to `strapi.get`.**
   - `export function useHouseholdProgressQuery() { return useQuery({ queryKey: HOUSEHOLD_PROGRESS_QUERY_KEY, queryFn: fetchHouseholdProgress, staleTime: 30_000 }); }`
     — `staleTime: 30_000` matches the existing `useStudentsQuery`
     (`src/modules/dashboard/queries/use-students.query.ts:52-57`) so the dashboard's two reads do not
     refetch on different rhythms. Default retry is kept here (unlike task 092): there is no id to
     be wrong about, so a transient 5xx is worth retrying.
   - Do not add `select`, `placeholderData` or derived fields — derivations are task 096.
3. Barrel export.
4. e2e cases in `tests/e2e/w3-household-contract.spec.ts`:
   - `'household progress query key is stable'` — `HOUSEHOLD_PROGRESS_QUERY_KEY` deep-equals
     `['dashboard','household-progress']` (imported from the constants file).
   - `'household read rejects query parameters and non-parents'` — live requests:
     `GET /api/my/progress?page=1` with the parent token ⇒ `400 ValidationError`;
     `GET /api/my/progress` with no token ⇒ `401` (or the project-standard `403` if that is what the
     running API answers — assert what the RUNNING API does and record it in Evidence, per
     `.qa/DECISIONS.md` D-CONTRACT-1, flagging any divergence from the contract text rather than
     silently accepting it).
   - Client↔server drift alarm (deferred here from task 091, corrected by AMENDMENT A1 — there is
     no per-child `cefrBand`/`cefrStageIndex` to compare anymore): for every child in the live
     payload and every one of its **`skills[]`** entries, assert
     `getCefrStageIndex(skill.cefrBand)` is consistent with `CEFR_LADDER.indexOf(skill.cefrBand)`
     (both `null` together), importing `getCefrStageIndex` from `@/modules/results` (barrel —
     cross-module import rule). Also assert no child object exposes a `cefrBand`, `cefrStageIndex`
     or `acaraPhase` key at all (`Object.keys(child)` excludes all three — B-9 stays refused on the
     wire).

## Project rules

- `schooltest-web/.claude/rules/state-data.md` — one hook per query in `queries/use-x.query.ts`;
  array keys starting with the resource name; always invalidate after a successful mutation (task 103
  wires that side); never axios in a component.
- `schooltest-web/.claude/rules/nextjs-patterns.md` — `'use client'` literal first line.
- `schooltest-web/.claude/rules/module-pattern.md` — cross-module import (`@/modules/results`) goes
  through the barrel; never reach into another module's internals.
- `schooltest-web/CLAUDE.md` law 9 (typed axios only) and law 14 (no `any`).
- `.qa/CONTRACTS.md` C-DASH-HOUSEHOLD "Implementation constraints" — one grouped read; the client
  side of that rule is: exactly one request, never a per-child loop.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-household-contract.spec.ts` passes: live `200` parses,
  key is `['dashboard','household-progress']`, `?page=1` ⇒ `400 ValidationError`, unauthenticated ⇒
  the running API's documented rejection, and the client ladder lookup agrees with the server's
  per-skill `cefrBand` for every skill of every child (no per-child `cefrStageIndex` exists to
  compare — AMENDMENT A1).
- `grep -n "params" src/modules/dashboard/queries/use-household-progress.query.ts` → zero hits
  (proves no query string can ever be sent).
- `grep -rn "as any\|: any\|@ts-ignore" src/modules/dashboard/queries/use-household-progress.query.ts` → zero hits.
- Every one of the six client states in the table above is either exercised by the spec or recorded
  in Evidence as unreachable with the current seed data, with the reason.
- No user-facing string → six catalogs untouched, still key-identical.
- Non-UI slice: no motion / viewport / axe criteria; W5 renders these states and carries them.
- Playwright baseline unchanged (157 passed / 1 known W9 red).

## Assumptions

- W2 id **065** ships the endpoint (see task 094's Assumptions for the reconciliation rule).
- The seeded parent has ≥1 child, so `empty` cannot be exercised with the primary account. The
  spec uses the existing `tests/e2e/helpers/throwaway-parent.ts` fixture (`registerParent` →
  real `C-AUTH-REGISTER` + real Mailpit confirmation, never a UI signup loop — D-AUTH-1) to get a
  childless parent and assert `children.length === 0 && household.childCount === 0` with
  `strongestDay === null`. Its `afterAll` deletes the `auth_email_requests` rows the helper documents.

## Evidence

<!-- filled in as the task runs -->
