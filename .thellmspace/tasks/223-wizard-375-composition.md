---
id: 223
title: Compose the whole wizard at 375px — horizontal rail, stacked rows, reachable footer
layer: ui
kind: build
slice: Add-child wizard phone composition
target: src/modules/student-wizard/components/{WizardScreen,WizardStepRail,WizardStepCard,WizardNav}.tsx
contract: n/a — pure presentation; the design has no answer here and the spec says so
design: .qa/design/spec/03-portal-forms.md#responsive, .qa/design/screens/portal--add-child-multi-step.html:8,26,31
status: TODO
depends_on: [201, 202, 203, 217, 219]
---

## Objective
Make the wizard correct on a 375px phone. The design cannot be ported here: it has zero media queries
and a hard `230px 1fr` grid, and its own spec says so.

## Contract
n/a. `03-portal-forms.md` § RESPONSIVE, verbatim:

> | Wizard (L8) | `grid-template-columns: 230px 1fr` | **fixed** — no fallback. Below ≈`1000px` the
> step card is crushed. Needs a stacked/horizontal-rail treatment that does not exist in the design. |
> | Wizard step card (L26) | `max-width:760px` + `overflow-y:auto` | Card never exceeds 760px; scrolls
> internally rather than growing the page. |
> | Wizard rows (L31,35,40,50,63,73,77,99) | `grid-template-columns:1fr 1fr; gap:16px` | **fixed** —
> no `auto-fit`. Needs a single-column stack below ≈`640px`. |
> | All chip rows | `display:flex; flex-wrap:wrap` | the wizard's only built-in narrow-width tolerance |
>
> **There is not a single `@media` query in either source export.** All breakpoints are an engineering
> decision.

## Design source
Authored breakpoints, stated once so every W7 component uses the same two:

| Width | Rail | Two-up rows | Card | Footer |
|---|---|---|---|---|
| `< 640px` (`base`) | horizontal strip above the card | single column | `rounded-portal-card px-5 py-6`, no `max-w` | Back + counter on one line, primary full-width below |
| `640-1023px` (`sm`) | horizontal strip | two columns | `px-7 py-7` | design row |
| `>= 1024px` (`lg`) | 230px vertical rail | two columns | `max-w-190 px-9.5 py-8.5` | design row |

Horizontal rail below `lg`: the five dots in a row with `flex items-center gap-2`, connectors becoming
`h-0.5 flex-1` horizontal segments with the same three fills, the CURRENT step's title + subtitle
visible and the rest `sr-only` (the idiom the outgoing `WizardStepper` already used and which keeps
the accessible name of every rail button intact for task 201's assertions). Dots stay 30px, and their
44px pointer target comes from the `after:` expansion, never from growing the dot.

Card at 375: `overflow-y-auto` is dropped below `lg` — an internally scrolling card inside a scrolling
page is a double-scroll trap on a phone; the page scrolls instead. The footer stays in normal flow at
the end of the card (not fixed), so the browser chrome never covers the primary.

Footer at 375: `flex-col gap-3` with the primary `w-full` first in DOM order after the counter, Back
below; every control keeps ≥44px. The counter keeps its `data-slot="wizard-step-counter"` so `051`'s
retargeted assertion works at any width.

Step 4's dropzone grid and step 5's summary table both go single-column/full-width; the summary row's
`justify-between` becomes `flex-col items-start gap-1` below `sm` so a long composed value never
collides with its key.

Motion is unchanged at every width, including reduced-motion behaviour.

## Files
- `src/modules/student-wizard/components/WizardScreen.tsx` — the grid breakpoints
- `src/modules/student-wizard/components/WizardStepRail.tsx` — the horizontal variant
- `src/modules/student-wizard/components/WizardStepCard.tsx` — padding + overflow per width
- `src/modules/student-wizard/components/WizardNav.tsx` — the stacked footer
- (step components need no change — their rows already use `sm:grid-cols-2`)

## Depends on
201, 202, 203 — the three chrome pieces being made responsive. 217, 219 — the two step bodies with
their own grids.

## Steps
1. Add the `lg` rail switch and the horizontal rail variant.
2. Card padding/overflow per breakpoint; footer stack.
3. Step 4 grid + step 5 row stacking below `sm`.
4. Playwright at 375 across all five steps, then axe at 375, then 1280 regression.

## Project rules
`.claude/rules/tailwind.md` (mobile-first; no arbitrary values) · `.claude/rules/quality.md` (44px
targets at every width; no horizontal scroll; visible focus) · `.claude/rules/module-pattern.md`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright at 375×812 on every one of the five steps: `document.documentElement.scrollWidth <=
  window.innerWidth` (zero horizontal scroll) — the `a11y-responsive.spec.ts` idiom.
- At 375 the rail is horizontal (its computed `flex-direction` is `row`), exactly one step title is
  visible, and every rail button still measures ≥44×44 by pointer walk.
- At 375 every paired row computes one column; the step-4 dropzones stack; each summary row stacks.
- At 375 the footer's primary is full width and both controls measure ≥44×44; the counter is still
  found by `[data-slot="wizard-step-counter"]`.
- At 1280 the rail is vertical, the grid's first track is `230px`, and the card is `760px` wide.
- axe zero serious/critical at 375 on all five steps (the sweep in task 225 repeats this).
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students`, `shell-a11y` green.
- Zero banned-pattern grep hits; no catalog change expected (verify parity anyway).

## Assumptions
`lg` (1024px) is chosen because the spec puts the crush point at ≈1000px; `sm` (640px) because it puts
the two-up collapse at ≈640px. Both are authored decisions, recorded here so the whole wave uses the
same two numbers.

## Evidence
