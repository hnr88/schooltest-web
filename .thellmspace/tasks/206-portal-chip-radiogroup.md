---
id: 206
title: Add the portal chip variant to ChoicePillGroup — wide, medium and square sizes at 44px
layer: ui
kind: build
slice: `PortalChip` single-select groups (gender, target entry term, test year band, contact channel)
target: src/modules/design-system/components/choice-pill-group.tsx, src/modules/design-system/types/choice.types.ts, src/modules/student-wizard/components/WizardChoiceField.tsx
contract: n/a — pure presentation over an existing radiogroup; the design spec section below is the contract
design: .qa/design/screens/portal--add-child-multi-step.html:39,58,65,85, .qa/design/spec/03-portal-forms.md#14-shared-portal-primitives
status: TODO
depends_on: [200]
---

## Objective
Give the wizard's chip groups the portal's navy-fill rectangle chips in all three size variants,
**without** rebuilding the roving radiogroup that `053-wizard-controls` pins (one tab stop, arrows
move the answer, Home/End, wrap-around, 44px pointer targets).

## Contract
n/a. `03-portal-forms.md` §1.4 `PortalChip`:

| State | background | color | border |
|---|---|---|---|
| selected | `#0E2350` | `#FFFFFF` | `1.5px solid #0E2350` |
| unselected | `#FFFFFF` | `#3D4A5C` | `1.5px solid #D8DFEA` |

| Variant | height | padding | radius | font-size | weight | Used by |
|---|---|---|---|---|---|---|
| Wide | `44px` | `0 18px` | `12px` | `13.5px` | `500` | Gender (1.5), Preferred contact channel (3.5) |
| Medium | `44px` | `0 15px` | `12px` | `13.5px` | `500` | Target entry term (2.5) |
| Square | `48px` wide × `44px` | — | `12px` | `13.5px` | `600` | Test year level (2.3) |

Row: `display:flex; flex-wrap:wrap;` gap `8px` — `7px` for the square test-year row (L56). No hover
state is declared on any chip; all are `cursor:pointer`.

## Design source
`portal--add-child-multi-step.html:39` (gender), `:58` (test year), `:65` (term), `:85` (channel).

Implementation: extend the EXISTING `ChoicePillGroup`
(`src/modules/design-system/components/choice-pill-group.tsx`) additively — a new
`variant?: 'pill' | 'portal-chip'` (default `'pill'`) and a widened
`ChoicePillSize = 'md' | 'sm' | 'wide' | 'medium' | 'square'` in `types/choice.types.ts`. The default
path must stay byte-identical in output: `school-search/components/SchoolFilterControls.tsx`,
`agent-search/components/AgentFilterControls.tsx` and
`settings/components/SearchPreferenceChoiceField.tsx` all render this component and are covered by
`unified-search`, `school-filter-panel`, `agent-search-polish` and `settings-tabs`. Rebuilding a
wizard-local copy is forbidden — the roving-radio hook, the ARIA and the pointer expansion already
live here.

Portal-chip classes:
- base `relative inline-flex items-center justify-center rounded-tile border-hairline text-body-sm
  transition-colors duration-150 ease-out-expo focus-visible:ring-2 focus-visible:ring-ring
  focus-visible:outline-none motion-reduce:transition-none`
- wide `h-11 px-4.5 font-medium` · medium `h-11 px-3.75 font-medium` · square `h-11 w-12 font-semibold`
- selected `border-navy-900 bg-navy-900 text-primary-foreground`
  (white on `#0E2350` = 15.27:1)
- unselected `border-portal-input bg-card text-portal-fg` (`#3D4A5C` on white = 9.0:1)
- group row `flex flex-wrap gap-2`, and `gap-1.75` when `size === 'square'`
- the `Check` glyph the DS pill appends on selection is NOT rendered in the portal variant (the design
  chip is fill-only) — `aria-checked` remains the state carrier
- no hover fill is added (the design declares none); focus-visible is the only added state, required
  by `.claude/rules/quality.md`

44px: the drawn chip is already 44px tall, so the `after:` pointer expansion is only needed
horizontally for the square variant (48px wide is fine) — verify with `053`'s `pointerBox` walk rather
than by computed geometry, exactly as that spec does.

Motion: `transition-colors` 150ms `ease-out-expo` on background/border/colour, plus
`motion-reduce:transition-none`. No transform on selection (the design has no chip transition at all —
`03-portal-forms.md` §A.4).

## Files
- `src/modules/design-system/components/choice-pill-group.tsx` — additive `variant` + sizes
- `src/modules/design-system/types/choice.types.ts` — widened `ChoicePillSize`, `variant` on
  `ChoiceGroupBase`
- `src/modules/student-wizard/components/WizardChoiceField.tsx` — accepts and forwards `size`

## Depends on
200 — `border-hairline`, `--color-portal-input`, `--color-portal-fg`.

## Steps
1. Widen the types; add the variant branch in `pillClass` + the group gap rule.
2. Forward `size` through `WizardChoiceField`.
3. Prove the default path is unchanged (run `unified-search`, `school-filter-panel`,
   `agent-search-polish`, `settings-tabs`), then prove the new variant.

## Project rules
`.claude/rules/module-pattern.md` (cross-module use goes through the barrel; never duplicate a shared
component) · `.claude/rules/tailwind.md` · `.claude/rules/quality.md` (44px, visible focus, keyboard) ·
`CLAUDE.md` §0 laws 1 and 3 (additive only — do not refactor the existing pill).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: with the gender group switched to `variant="portal-chip" size="wide"`, each option
  computes `height: 44px`, `border-radius: 12px`, `border-width: 1.5px`, `font-size: 13.5px`; the
  selected one computes `background-color` = `--color-navy-900` and `color` = white; the unselected
  ones `background-color` = card and `color` = `--color-portal-fg`.
- `053` passes unchanged: one tab stop, ArrowRight/Home/End/ArrowLeft-wrap move the ANSWER,
  `aria-checked` flips, all four options ≥44×44 by pointer walk at 1440 and 375, and
  `form [aria-pressed]` is still count 0.
- The search/settings pill call sites render with unchanged computed geometry (regression assertion in
  the existing specs).
- Reduced motion: computed `transition-property: none`.
- axe zero serious/critical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `unified-search`, `settings-tabs` green.

## Assumptions
No strings change. Chip contrast in both states clears AA by a wide margin, so no ink substitution is
needed here (unlike the muted portal inks).

## Evidence
