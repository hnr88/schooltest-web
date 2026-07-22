---
id: 139
title: Dashboard zero-children state — honest hero, add-a-child CTA, suppressed child sections
layer: ui
kind: implement
slice: The whole dashboard when household.childCount === 0
target: src/modules/dashboard/components/DashboardEmptyState.tsx, src/modules/dashboard/components/DashboardScreen.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/06-auth-states-landing.md (empty states) · .qa/design/spec/01-portal-dashboard.md#UNKNOWNS
status: TODO
depends_on: ["133", "134", "144"]
---

## Objective
A parent with no children must get a real first-run screen, not a hero full of zeros beside three
empty cards. The design has no zero-children state (spec §UNKNOWNS: "No zero-children, zero-results,
zero-schools, or error state exists in these files"), so this is authored from the design system's
empty-state pattern and the app's existing `EmptyState` primitive.

## Contract
`C-DASH-HOUSEHOLD` → `data.household.childCount === 0`. In that case the contract also guarantees
`children: []`, `practiceByDay` = 7 zero-second entries and `strongestDay: null`.

## Design source
- Reuse `EmptyState` from `@/modules/design-system` (barrel line 20) — do not build a second one.
- The hero panel (133) STILL renders: navy card, eyebrow, and the
  `Dashboard.hero.headlineNoChildren` sentence from 134 ("Add a child to start following their
  progress."). It renders **no stat row** — with no children, `testsCompletedThisWeek` and
  `practiceSecondsThisWeek` are structurally zero and a row of zeros reads as a broken screen.
- Primary action inside the hero: `Button` (design-system) linking to `/dashboard/children/new` —
  the route already exists (`src/app/[locale]/dashboard/children/new`). Copy
  `Dashboard.empty.addChild`. Styling: the design's navy-panel CTA precedent is the teal button in
  `app--parent-overview.html:13` — `bg-accent-500` … but that variant belongs to the OTHER
  composition. Use the design-system `Button variant="secondary"` so the CTA reads on navy without
  inventing a variant; contrast must be ≥4.5:1 against `#0E2350`, asserted.
- Suppressed on this branch: the practice chart (140-143), "My children" (144-149), the school note
  (150). Rendering empty shells of all three is noise. The page is: greeting → hero (with CTA).
- Motion: the CTA gets `transition-colors duration-150 ease-out-expo motion-reduce:transition-none`
  and a visible `focus-visible:ring-2 focus-visible:ring-ring` (the design declares no focus state
  anywhere — PLAN finding 2 — so it is authored from `--ring`).
- 375px: the CTA goes full width (`w-full sm:w-auto`); the hero keeps `p-8`→`p-6` at `max-sm`.

## Files
- CREATE `src/modules/dashboard/components/DashboardEmptyState.tsx` — the zero-children branch.
- EDIT `src/modules/dashboard/components/DashboardScreen.tsx` — branch on `status === 'empty'`.
- i18n: `Dashboard.empty.addChild`, `Dashboard.empty.title`, `Dashboard.empty.description`.
  Reuse `Dashboard.addStudent` if its copy fits — check before adding a near-duplicate key.

## Depends on
- **133** (hero shell), **134** (the no-children headline branch), **144** (so the section it
  suppresses exists and the suppression is a real branch, not a not-yet-built section).

## Steps
1. Branch `DashboardScreen` on the `empty` state from 130's hook.
2. Compose greeting + hero + CTA; assert nothing else mounts.
3. Add keys to all six catalogs.

## Project rules
- `.claude/rules/state-data.md` — shadcn/design-system first: reuse `EmptyState` and `Button`.
- `.claude/rules/quality.md` — WCAG AA contrast on the CTA over navy; keyboard reachable; visible
  focus ring.
- `.claude/rules/i18n.md` — six catalogs; no duplicate near-identical keys.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `page.route('**/api/my/progress', …)` fulfilling a real-shaped body with
  `childCount: 0`, `children: []` ⇒ the hero renders the no-children sentence, the CTA link has
  `href="/dashboard/children/new"`, and `[data-slot="dashboard-hero-stats"]`,
  `[data-slot="dashboard-practice-chart"]`, `[data-slot="dashboard-profile-roster"]` all have
  count 0.
- Clicking the CTA lands on `/dashboard/children/new` and the wizard's first step is visible
  (existing `WizardScreen` behaviour preserved).
- Contrast: computed CTA foreground vs background ≥ 4.5:1, measured in the test.
- Keyboard: `Tab` from the h1 reaches the CTA and `focus-visible` produces a non-zero
  `outline-width` or `box-shadow`.
- 375px: CTA is full width; no horizontal overflow. axe clean.
- Six catalogs key-identical; zero banned-pattern hits.

## Assumptions
- The seeded parent HAS children, so this branch is proven with a route stub of a real-shaped body;
  the `ready` branch is proven against live data elsewhere. Both are required.

## Evidence
<filled in as the task runs>
