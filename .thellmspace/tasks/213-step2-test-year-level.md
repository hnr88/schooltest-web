---
id: 213
title: Ship step 2's Test year level field with the design's help text, and resolve the square-chip conflict
layer: ui
kind: build
slice: Wizard field 2.3 — SchoolTest testing band (7–12)
target: src/modules/student-wizard/components/StepEducation.tsx, src/modules/student-wizard/components/WizardSelectField.tsx
contract: n/a for transport — the field contract is the wizard Zod schema quoted below
design: .qa/design/screens/portal--add-child-multi-step.html:54-62, .qa/design/spec/03-portal-forms.md#25-step-2--education
status: TODO
depends_on: [205]
---

## Objective
Ship field 2.3 with the design's label, help text and full-width row — and decide, in the open,
between the design's square chip row and the localized select that `053-wizard-controls` pins.

## Contract
n/a for transport. Field contract:

```ts
year_level: z.number().int().min(7, t('yearLevelInvalid')).max(12, t('yearLevelInvalid'))
             .nullable().optional()
YEAR_LEVEL_VALUES = [7, 8, 9, 10, 11, 12]
```

Optional; included in the payload only when it is a number. The value is an INT on the wire — the
label is `Year {n}`, the value is `9`.

## Design source
`03-portal-forms.md` §2.5 row 2.3 (`portal--add-child-multi-step.html:55-61`):

| # | Label | Req | Control | Options | Help text |
|---|---|---|---|---|---|
| 2.3 | `Test year level (7–12)` (en dash U+2013) | No | Chip group, **Square**, single-select | `7` `8` `9` `10` `11` `12` | `The SchoolTest testing band — separate from the school year.` at `margin-top:8px` |

Square chip = `width:48px; height:44px; border-radius:12px; font-size:13.5px; font-weight:600`; the
row is the ONLY chip row at `gap:7px` (all others are 8px). Field occupies a full-width row
(`[2.3 full-width]`).

**Conflict and decision.** `053-wizard-controls.spec.ts` asserts this field is a `combobox` whose
options carry the localized `Year {n}` label ("`year_level` submits the INT 9 but must display
'Year 9'") and pointer-measures an option row. A square chip radiogroup exposes `role="radio"`, not
`role="combobox"`, so the two cannot both be true. The wave's mandate is to re-skin **and** keep every
one of those assertions green, so the SELECT stays and the square-chip visual is not adopted.
Recorded as a deviation with this exact reason — not silently dropped, and not "fixed" by editing the
spec.

What IS adopted from the design: the label string with the en dash, the full-width row, the help
sentence at 12px with the `8px` top margin (`helperGap="lg"` from task 204 — every other help text is
6px), and the portal select box from task 205.

Motion: inherited.

## Files
- `src/modules/student-wizard/components/StepEducation.tsx` — the 2.3 full-width row
- `src/modules/student-wizard/components/WizardSelectField.tsx` — `helperGap` pass-through if task 204
  put it on the shell

## Depends on
205 — the portal select box and popup rules.

## Steps
1. Verify the label and helper catalog values match the design exactly (en dash, em dash) in `en`, and
   that the other five locales carry the same keys.
2. Ship the full-width row with the 8px helper gap.
3. Write the deviation into the component header comment.
4. Run `053` first, then the rest.

## Project rules
`.claude/rules/i18n.md` · `.claude/rules/tailwind.md` · `.claude/rules/testing.md` (a passing spec is
a constraint, not an obstacle) · `.claude/rules/module-pattern.md`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: the label renders `Test year level (7–12)` with the en dash (assert the codepoint); the
  help sentence renders at `font-size: 12px` with `margin-top: 8px`.
- `053`'s block passes unchanged: the `yearLevel` combobox opens, its `Year 9` option measures
  ≥44×44 by pointer walk, clicking it leaves `Year 9` in the trigger, and the submitted value is the
  int `9` (assert on the request body in task 221).
- The field is a full-width row at 1280 and at 375.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
The square-chip visual is deferred, not lost: if a later wave retires `053`'s combobox assertion by
agreement, task 206's `size="square"` variant is already built and this field flips in one line.

## Evidence
