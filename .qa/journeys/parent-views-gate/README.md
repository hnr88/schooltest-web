# The parent-views gate: a masked product decision that reads as a spec bug

Measured 2026-09-11 by comms-claude-3ee8f1cd, read-only, at the orchestrator's request.
Not one of the environmental hazards — this is the product obeying a recorded decision
(st-mvp-pivot Task 46) while specs assert the behaviour that decision masked.

## The flag

`NEXT_PUBLIC_PARENT_VIEWS_ENABLED` — `src/lib/env.ts:16`,
`z.enum(['true','false']).default('false')`. It appears in **no** env file on this stack, so
the portal is masked by the SCHEMA DEFAULT. Nothing to grep in `.env`.

## Only TWO real mounts

`grep -rn "<ParentGuard"` — the JSX usage, not the imports or comments:

| file | line |
|---|---|
| `src/app/[locale]/dashboard/(portal)/layout.tsx` | 13 |
| `src/app/[locale]/onboarding/layout.tsx` | 11 |

**`dashboard/layout.tsx` does NOT mount it.** A plain grep for `ParentGuard` hits that file
because its comment *mentions* the guard ("role guards live per section"). That is the
prose-grep trap: match on `<ParentGuard`, never on the bare name.

## The masked URL set

Route groups in parentheses do not appear in the URL, so `(portal)/` serves:

    /dashboard   /dashboard/children*   /dashboard/notifications
    /dashboard/settings   /dashboard/reports*   /dashboard/search*

plus `/onboarding` from its own layout.

## The gate's full truth table

`src/modules/auth/hooks/use-parent-views-gate.ts`, read in branch order — **the reports
check comes FIRST, before the parent check**, which is easy to get backwards:

| who | where | gate |
|---|---|---|
| anyone | `/dashboard/reports*` | `pass` — staff keep the reports subtree, and a PARENT passes here too |
| parent | any other (portal) URL, or `/onboarding` | **`unavailable`** — the masked screen |
| non-parent | exactly `/dashboard` | `pass` |
| non-parent | any other (portal) URL | `redirect` -> `/dashboard`, **silently** |

## Why it presents as a timeout rather than an error

`ParentGuard.tsx:43` returns `<ParentViewsUnavailable />` and **never renders children**.
Anything nested inside therefore never mounts — including its effects. Worked example,
026-dashboard-onboarding-guard:

1. a pending parent signs in and lands on `/dashboard`;
2. ParentGuard short-circuits;
3. `DashboardOnboardingGuard` never mounts, so its `router.replace('/onboarding')` (:47)
   never runs;
4. the URL stays `/dashboard` and `waitForURL('**/onboarding')` burns its clock.

Measured verbatim:

    Error: page.waitForURL: Test timeout of 30000ms exceeded.
    waiting for navigation to "**/onboarding" until "load"
      navigated to "http://localhost:3002/dashboard"

**A short-circuit, not a redirect.** That distinction is what makes it diagnosable: nothing
errors, nothing logs, the URL simply never changes.

## Both reflexes are wrong

- Nothing to fix in product code — it is doing what Task 46 says.
- "Void the run" is also wrong — the spec is *permanently* red until re-pointed or gated.

## The remedy already exists — do not invent one

`tests/e2e/helpers/parent-portal.ts` exports `skipWhenParentPortalMasked()`, with a
docblock that already explains this situation. **17 spec files already call it.** Applying
it is the whole treatment; a new mechanism would be duplication.

Gate placement matters: put the call BEFORE any `beforeAll` that writes shared state. In
026 the hook rewrites the seeded parent to `pending`, and that file's own header notes other
dashboard specs need it left `skipped`. Verified after gating: 3 skipped, and the parent row
still reads `skipped` — the hook did not fire. With the flag exported all 3 collect again,
so the coverage is gated, not deleted.

## How to tell this apart from the other hazards

Three failure modes now share one symptom — a spec that cannot reach its surface and times
out at exactly its limit:

| tell | cause |
|---|---|
| snapshot shows a persona you never signed in as | the shared Browser tab's parked session |
| form renders correctly, locator does not match | retired `Auth.*` label keys (B10) |
| URL never changes, no error, nested guard never mounts | **this** — the parent-views gate |
