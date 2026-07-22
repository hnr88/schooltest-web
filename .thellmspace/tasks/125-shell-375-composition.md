---
id: 125
title: The shell at 375 — one composition pass over the frame, row and drawer with real measurements
layer: ui
kind: verify
slice: The whole re-skinned shell's phone composition (375×812) and its 1280 counterpart
target: src/app/[locale]/dashboard/layout.tsx, src/modules/shell/components/AppTopbar.tsx, tests/e2e/shell.spec.ts
contract: n/a — the design has zero media queries; every mobile value here is authored and named
design: .qa/design/spec/01-portal-dashboard.md#9-responsive-hints-present-in-the-markup, .qa/design/screens/portal--main.html:7-22
status: TODO
depends_on: ["118", "119", "120", "121", "122"]
---

## Objective

Make the shell correct at 375 as a COMPOSITION, not control by control: the frame's gutter, the top
row's wrap behaviour, what is hidden, what stays reachable, and the absence of horizontal scroll —
measured in the running app at 375×812 and re-checked at 1280×800.

## Contract

n/a. `.qa/design/spec/01-portal-dashboard.md` §9, verbatim:

> There are **zero `@media` queries** in `Parent Portal.dc.html`, `portal--main.html`,
> `portal--detached-sidebar.html`, or `app--parent-overview.html` (verified by grep). All
> adaptivity is intrinsic.

and its table of the intrinsic mechanisms this task must rely on: `flex-wrap:wrap` on the greeting
row, `min-width:0` on `<main>` and every flex text stack, and the fixed non-responsive values
(sidebar `248px`, dashboard search pill `240px`).

## Design source

The authored 375 composition, value by value (each is a decision, because the design has none):

| Element | 1280 | 375 | Mechanism |
|---|---|---|---|
| frame padding | `24px` (`p-6`) | `16px` (`max-md:p-4`) | 110 |
| frame gap | `24px` (`gap-6`) | `0` (`max-md:gap-0`) — the rail is off-canvas | 110 |
| sidebar card | visible, 248px | hidden (`max-md:hidden` guard + primitive `isMobile`) | 111 |
| nav | rail | Sheet, 288px | 122 |
| top row | `toggle · breadcrumb · ⟶ · search · bell` | `toggle · breadcrumb · ⟶ · bell` | 118/120 |
| row padding | `px-2 pt-2` | `max-md:px-1` | 118 |
| search pill | 240×44 | hidden (`max-lg:hidden`); search reachable from the Sheet's Search link | 120 |
| first breadcrumb | `Dashboard ›` | hidden (`max-sm:hidden`) | 119 |
| user chip | rail card | inside the Sheet | 117 |
| every pointer target | ≥44px | ≥44px | 114/117/118/121/124 |

Hard rules for this pass:
1. **No horizontal scroll at 375** — `document.documentElement.scrollWidth <= clientWidth`, and the
   same for `[data-slot="dashboard-content"]`.
2. **No content under 320px** — re-check at 320×640 as a stress width and record the result even
   though 375 is the contracted target.
3. **Long-label safety** — repeat the measurement in `zh` (cookie-mode locale switch, the idiom
   `design-system-zh.spec.ts` already uses); a longer catalog string must truncate, never widen.

Motion is 126's; this task only asserts that nothing animates layout at 375 (no width/height/margin
transitions on any shell element — read `transitionProperty` on each and fail on
`width|height|margin|padding`, excluding the vendored rail's own `width` transition, which is
desktop-only).

## Files

- `src/app/[locale]/dashboard/layout.tsx`, `src/modules/shell/components/AppTopbar.tsx` — only if a
  measurement fails; the point of this task is to measure first and fix second.
- `tests/e2e/shell.spec.ts` — a composition test inside the existing mobile describe.

## Depends on

- **118, 119, 120, 121, 122** — every element of the row and the drawer must be final before the
  composition can be judged.

## Steps

1. Run the app at 375×812 as the seeded parent and capture `.qa/screenshots/125-shell-375.png`
   (full page) and `125-shell-375-sheet.png` (drawer open, animations settled via
   `getAnimations().finished`).
2. Measure: frame padding, row padding, row height, every visible control's bounding box, the
   scroll widths, and the target size of every focusable element (reuse `logSmallTargets`'s idiom
   from `a11y-auth.spec.ts`).
3. Fix only what fails, at the smallest scope (a `max-md:` variant, not a new breakpoint system).
4. Repeat at 1280×800 to prove nothing regressed there; capture `125-shell-1280.png`.
5. Repeat the 375 pass in `zh`.
6. `pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `.claude/rules/tailwind.md` — no arbitrary values; 4pt scale; `gap-*` not margins.
- `.claude/rules/quality.md` — ≥44px targets, AA contrast at every width, no content clipped.
- `.claude/rules/testing.md` — a real Playwright run against the running app is the proof.
- `CLAUDE.md` §0 law 1 — this is a composition pass, not a licence to redesign a control that
  already passed its own task.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts tests/e2e/dashboard.spec.ts tests/e2e/a11y-responsive.spec.ts`
  green.
- At 375: `scrollWidth <= clientWidth` on `<html>` AND on `[data-slot="dashboard-content"]`, with
  the Sheet closed and open, in `en` and `zh`.
- At 375: every focusable shell control measures ≥44×44 via `elementFromPoint` (list them in
  Evidence with their real numbers; a pre-existing vendored shortfall is LOGGED with its reason,
  never silently passed — the `D22` precedent).
- At 320: recorded, with any failure named explicitly rather than hidden.
- At 1280: the frame is 24px-guttered, the rail is 248px, the row carries all five controls.
- No shell element transitions a layout property (assertion above).
- Four screenshots written under `.qa/screenshots/`.
- axe serious/critical = 0 at 375 (closed + Sheet open) and 1280.
- No new strings → six catalogs unchanged.

## Assumptions

- 375×812 and 1280×800 are the mission's two contracted widths (PLAN.md "Definition of done");
  320 is measured as a courtesy and is not a gate.

## Evidence

_(filled in as the task runs: the full measurement table, screenshot paths, e2e output)_
