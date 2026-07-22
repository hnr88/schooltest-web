---
id: 212
title: Rebuild step 2's Current school and Current year level row in the portal dialect
layer: ui
kind: build
slice: Wizard fields 2.1 + 2.2 — current school, current year level
target: src/modules/student-wizard/components/StepEducation.tsx, src/i18n/messages/*.json
contract: n/a for transport — the field contract is the wizard Zod schema quoted below
design: .qa/design/screens/portal--add-child-multi-step.html:47-53, .qa/design/spec/03-portal-forms.md#25-step-2--education
status: TODO
depends_on: [204, 205]
---

## Objective
Ship the first row of step 2 to the design — a text input beside a 13-option select — in the portal
box, keeping the enum and the localized option labels `053-wizard-controls` pins.

## Contract
n/a for transport. Field contract:

```ts
current_school: z.string().trim().max(255, t('currentSchoolTooLong')).optional()
current_year_level: z.enum(CURRENT_YEAR_LEVEL_VALUES).optional()
CURRENT_YEAR_LEVEL_VALUES = ['Prep','Year 1','Year 2', … ,'Year 12']   // 13 members
```

Both optional; both omitted from the payload when empty (`lib/build-student-payload.ts`).
D-C8, recorded in `StepEducation.tsx`'s header: `current_year_level` is the school-year STRING enum
and `year_level` is the SchoolTest testing band INT — never one field.

## Design source
`03-portal-forms.md` §2.5 (`portal--add-child-multi-step.html:51-52`):

| # | Label | Req | Control | Options | Default |
|---|---|---|---|---|---|
| 2.1 | `Current school` | No | `PortalInput` | placeholder `e.g. Oakwood Primary` | empty |
| 2.2 | `Current year level` | No | `PortalSelect` | `Foundation`, `Year 1` … `Year 12` (13 options) | design marks **`Year 7`** `selected` |

Row grouping `[2.1 | 2.2]` → `grid gap-4 sm:grid-cols-2`. Portal boxes from tasks 204/205.

Two design↔data reconciliations, both recorded:
1. The design's first option is `Foundation`; the shipped enum's first member is `Prep` (the value the
   API accepts). Keep the enum value `Prep`; the LABEL is the catalog string
   `StudentWizard.education.prep`, so if the product wants "Foundation" it is a one-word catalog edit,
   not a schema change. Do not add a 14th option.
2. The design preselects `Year 7`. `WIZARD_DEFAULT_VALUES.current_year_level` is `undefined` and the
   field is optional — a preselected school year would write a fact nobody stated. Keep `undefined`
   with the placeholder `currentYearLevelPlaceholder`; record the deviation.

Placeholder value `currentSchoolPlaceholder` already reads `e.g. Oakwood Primary` — verify, do not
duplicate.

Motion: inherited from tasks 202/204/205.

## Files
- `src/modules/student-wizard/components/StepEducation.tsx` — row `[2.1 | 2.2]`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — only if a value must change (verify first)

## Depends on
204 — the input box. 205 — the select box and popup rules.

## Steps
1. Rebuild the row as `grid gap-4 sm:grid-cols-2`.
2. Confirm the placeholder/label values against the design table; change values only where they differ.
3. e2e: geometry, localized options, and the 13-option count.

## Project rules
`.claude/rules/module-pattern.md` (enum tuples in `constants/`; component ≤120 lines —
`StepEducation.tsx` is 114 today, so split if the row grid pushes it over) · `.claude/rules/i18n.md` ·
`.claude/rules/tailwind.md` · `.claude/rules/state-data.md`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `Current school` computes the 48px portal input; `Current year level` computes the 48px
  portal trigger; the open popup lists exactly 13 options and shows `Year 7` as a LOCALIZED label
  (assert the `Year {n}` ICU render, and a non-English render under `/zh`).
- Nothing is preselected on a fresh mount; the placeholder is visible.
- At 1280 the row is two columns; at 375 one column, no horizontal scroll.
- Typing 256 characters into `Current school` shows `currentSchoolTooLong` and blocks Continue.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
`Foundation` vs `Prep` is a label question, not a data question, and is left to the catalog. The
design's preselected `Year 7` is not adopted — deviation recorded.

## Evidence
