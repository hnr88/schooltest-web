---
id: 159
title: Rewrite the dashboard e2e suite for the redesign, keeping every functional assertion green
layer: regression
kind: verify
slice: Independent proof of the whole W5 dashboard against the running app
target: tests/e2e/dashboard.spec.ts, tests/e2e/dashboard-metrics.spec.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#10 (the full metric inventory)
status: TODO
depends_on: ["135", "136", "137", "139", "141", "142", "145", "146", "147", "149", "150", "154", "155", "156", "157", "158"]
---

## Objective
One suite that proves every servable dashboard metric against live API data and live Postgres rows,
proves the blocked ones are absent, and carries forward every functional assertion the pre-redesign
suite made — so the redesign is not paid for with a regression.

## Contract
`C-DASH-HOUSEHOLD` — every metric assertion recomputes its expected value from the live
`GET /api/my/progress` response inside the test. **A hardcoded expected metric value is a fail**;
seeded data changes and a frozen expectation would either rot or be tautological.

## What must be PRESERVED from the current `tests/e2e/dashboard.spec.ts`
These are functional and stay, with selectors updated only where the redesign genuinely moved them:
1. Incognito `/dashboard` ⇒ redirect to `/sign-in`, `app.auth.token` is `null`.
2. Real login via `POST http://localhost:5500/api/auth/local` with the seeded
   `parent@schooltest.local` / `Parent1234!` — never a synthetic token.
3. `page` title matches `Dashboard.meta.title`; `meta[name=description]` matches
   `Dashboard.meta.description`.
4. The `<h1>` carries the LIVE username from `GET /api/users/me` (the copy changes to the 132
   greeting; the *liveness* assertion is the point and stays).
5. `[data-slot="dashboard-overview"][data-surface="parent-overview"]` still exists.
6. `[data-slot="dashboard-profile-roster"] a[href^="/dashboard/children/"]` exists and the same
   `href` survives `page.reload()` (144 deliberately kept this slot name).
7. Sign-out from the topbar user chip clears the JWT and returns to a guarded route.
8. Mobile: `[data-slot="dashboard-profile-roster"] a[href="/dashboard/children"]` navigates to
   `/dashboard/children` and `[data-surface="children-roster"]` renders; no horizontal scroll.
9. Zero console errors (`watchErrors`); axe zero serious/critical.

## What must be REMOVED and why (these assert the superseded composition, per D-SCOPE-3)
- `[data-slot="dashboard-family-summary"]`, `[data-slot="dashboard-plan-board"]`,
  `[data-slot="dashboard-activity-feed"]`, `[data-slot="navy-promo-card"]` — those blocks are gone.
- `a[href="/dashboard/search?mode=schools"]` and the promo's `?mode=agents` link — the redesigned
  dashboard has no search links; Search is a sidebar item (W4). If W4's sidebar provides them,
  re-assert them there, not here.
- The `Dashboard.addStudent` header link — the add-child CTA now lives in the zero-children state
  (139). Re-assert it inside the zero-children test instead of deleting the coverage.
- The literal `Welcome back, parent!` heading regex — replaced by the greeting pattern.
Each removal must be replaced by an equivalent assertion elsewhere in this suite; deleting coverage
outright is not allowed.

## New coverage — `tests/e2e/dashboard-metrics.spec.ts`
Against live data, with the API response fetched in-test and used as the oracle:
- Hero: exactly 2 stat cells; `[data-metric="coming-up"]` count 0 (B-1).
- Metric 1: `tests-completed` value === `household.testsCompletedThisWeek`, cross-checked against a
  `psql` count on `127.0.0.1:5540`.
- Metric 3: `practice-week` value === `formatPracticeDuration(household.practiceSecondsThisWeek)`.
- Metric 4: 7 bars; each bar's height ratio === the normalised percentage; the tallest bar is the
  argmax day; **explicitly assert px ≠ minutes** with a stubbed known week.
- Metric 5: caption weekday+minutes === `strongestDay`; null branch renders `practice.noPractice`.
- Metric 6: 6 ticks per child, `data-band` sequence `pre_A1,A1,A2,B1,B2,C1`, reached count ===
  `cefrStageIndex + 1`, **no `C2` anywhere in the DOM**.
- Metric 7: focus pill present iff `focusSkill !== null`, `data-skill` matches, no `%` in the row.
- Metric 8 (headline): the sentence equals the branch recomputed from the response; no
  "on track for"/"since May" anywhere.
- Note card: body === the live newest notification `title`; `unread-count` unchanged after viewing.
- Blocked absences: no "Coming up" heading, no "Full calendar", no "Recommended this week", no
  "Assign", no "Reply", no "Ms. Alvarez" (B-1, B-2, 151, 152, 153).
- States: loading (delayed route), zero-children (stubbed `childCount: 0`), error 500/403/429,
  each asserted per its task's Done criteria.
- Motion: `document.getAnimations()` settles < 600ms; empty under `reducedMotion: 'reduce'`;
  no animated property outside transform/opacity.
- Responsive: the full 375px sweep from 157 plus the 1280px no-regression check.
- axe with `wcag2a, wcag2aa, wcag22aa` at both viewports, in the loaded AND loading states.

## Files
- EDIT `tests/e2e/dashboard.spec.ts` — preserve/remove per the two lists above.
- CREATE `tests/e2e/dashboard-metrics.spec.ts` — the metric oracle suite.
- EDIT `tests/e2e/a11y-responsive.spec.ts` only if it asserts a removed dashboard slot.

## Depends on
Every W5 build task: 135, 136, 137, 139, 141, 142, 145, 146, 147, 149, 150, 154, 155, 156, 157, 158.

## Steps
1. Rewrite `dashboard.spec.ts` against the new composition, preserving list A.
2. Write `dashboard-metrics.spec.ts` with the API response as the oracle.
3. Run the FULL suite, not just these two files, and compare against the recorded baseline.

## Project rules
- `.claude/rules/testing.md` + `.qa/DECISIONS.md` **D-VERIFY-1** — proof is a real Playwright run
  against the running app; unit tests do not count; the builder never passes its own task.
- `.qa/PLAN.md` regression baseline — "157 passed / 1 failed / 2 skipped / 2 did not run of 162.
  The single red is pre-existing and owned by W9: `notification-preference-controls.spec.ts:75`.
  **Any additional red at any point in this mission is a regression this mission caused, and is a
  stop-and-fix.**"
- `CLAUDE.md` §0 law 12 — never run `pnpm dev`/`build`/`start`; `pnpm exec playwright test` is the
  allowed command and reuses the running server.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test` full run: **≥ 157 passed, exactly the one known pre-existing red**
  (`notification-preference-controls.spec.ts:75`), zero new failures. The run output is pasted into
  Evidence.
- `tests/e2e/dashboard.spec.ts` and `tests/e2e/dashboard-metrics.spec.ts` both green at 1280 and
  375.
- Every metric assertion demonstrably recomputes from the live response — reviewer greps the two
  spec files for hardcoded metric literals and finds none.
- Postgres cross-checks for metrics 1 and 3 recorded in Evidence with the exact SQL and result.
- Screenshots written to `.qa/screenshots/`: `dashboard-en-1280.png`, `dashboard-en-375.png`,
  `dashboard-loading.png`, `dashboard-empty.png`, `dashboard-error.png`.
- Blocked-metric greps all return zero hits.
- axe zero serious/critical at both viewports in both states.
- Verified by an agent that did not build any W5 task (D-VERIFY-1).

## Assumptions
- The seeded parent has ≥1 child with ≥1 official result; if not, the CEFR/focus assertions run
  against the null branches and that is recorded rather than worked around by writing seed data.

## Evidence
<filled in as the task runs>
