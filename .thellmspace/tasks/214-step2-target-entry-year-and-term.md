---
id: 214
title: Ship step 2's required Target entry year select and Target entry term medium-chip row
layer: ui
kind: build
slice: Wizard fields 2.4 + 2.5 — target entry year, target entry term
target: src/modules/student-wizard/components/StepEducation.tsx, src/modules/student-wizard/constants/student-wizard.constants.ts
contract: n/a for transport — the field contract is the wizard Zod schema quoted below
design: .qa/design/screens/portal--add-child-multi-step.html:63-66, .qa/design/spec/03-portal-forms.md#25-step-2--education
status: TODO
depends_on: [205, 206]
---

## Objective
Ship the last row of step 2 — the two REQUIRED fields of this step — as a portal select beside a
medium-chip radiogroup, keeping the term radiogroup that three specs drive.

## Contract
n/a for transport. Field contract:

```ts
target_entry_year: z.string().min(1, t('targetYearRequired')).refine(isValidTargetYear, t('targetYearInvalid'))
// isValidTargetYear: /^\d{4}$/ and 2000 <= year <= currentYear + 10
target_entry_term: z.enum(TERM_VALUES, { error: t('termRequired') })
TERM_VALUES = ['Term 1','Term 2','Term 3','Term 4']
TARGET_ENTRY_YEARS = 7 options, currentYear … currentYear + 6
```

Both are always sent: `buildStudentPayload` writes `target_entry_year: values.target_entry_year.trim()`
and `target_entry_term: values.target_entry_term` unconditionally.

## Design source
`03-portal-forms.md` §2.5 rows 2.4/2.5 (`portal--add-child-multi-step.html:64-65`):

| # | Label | Req | Control | Options | Default |
|---|---|---|---|---|---|
| 2.4 | `Target entry year` | **Yes** (`*` `#2563EB`) | `PortalSelect` | `2026`, `2027`, `2028`, `2029` | design marks `2027` `selected` |
| 2.5 | `Target entry term` | **Yes** (`*`) | Chip group, **Medium**, single-select | `Term 1` · `Term 2` · `Term 3` · `Term 4` | design preselects `Term 1` |

Medium chip = `height:44px; padding:0 15px; border-radius:12px; font-size:13.5px; font-weight:500`;
row `flex flex-wrap gap-2`. Row grouping `[2.4 | 2.5]` → `grid gap-4 sm:grid-cols-2`.

Reconciliations, recorded:
- The design's four years are a mock of a rolling window; `TARGET_ENTRY_YEARS` already computes
  `currentYear … currentYear+6`, which is a superset and needs no yearly edit. Keep it. Narrowing to
  four hard-coded years would break in 2030.
- The design preselects `2027` and `Term 1`. Both fields are REQUIRED, and pre-answering a required
  question defeats its own validation; `051`, `052` and `student-wizard-contrast` all explicitly
  choose a year and a term before advancing. Keep both unset; record the deviation.

Term renders through `WizardChoiceField` → `ChoicePillGroup variant="portal-chip" size="medium"`
(task 206), keeping `aria-labelledby` on the group. `053` asserts the group holds 4 radios and that
the first measures ≥44×44; `051`/`052`/`student-wizard-contrast` click
`getByRole('radiogroup', { name: 'Target entry term' }).getByRole('radio', { name: 'Term 1' })`.

Motion: inherited (150ms chip colour transition, select popup enter).

## Files
- `src/modules/student-wizard/components/StepEducation.tsx` — row `[2.4 | 2.5]`, `size="medium"`
- `src/modules/student-wizard/constants/student-wizard.constants.ts` — unchanged; cited for the year
  window

## Depends on
205 — the portal select box. 206 — the portal chip variant.

## Steps
1. Rebuild the row; pass `size="medium"`; keep both `Controller`s, including
   `triggerRef={field.ref}` on the year select (RHF's `shouldFocus` lands on it).
2. Run `051`, `052`, `053`, `student-wizard-contrast` — all four drive this row.

## Project rules
`.claude/rules/quality.md` (44px, radiogroup semantics, required fields programmatically marked) ·
`.claude/rules/tailwind.md` · `.claude/rules/state-data.md` · `.claude/rules/i18n.md`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: both labels carry a `*` computing `--color-blue-600`; the year trigger is the 48px
  portal box; each term chip computes `height: 44px`, `padding-left: 15px`, `border-radius: 12px`,
  `font-size: 13.5px`, and the selected one the navy fill with white text.
- Continue with neither set shows `targetYearRequired` and `termRequired`, does not advance, and
  focuses the year trigger.
- The year popup lists 7 options starting at the current year.
- `053`'s term block (4 radios, ≥44×44 pointer walk) passes unchanged.
- Reduced motion: computed `transition-property: none` on the chips.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
The design's rolling-window years and preselected answers are mock data, not product rules — both
deviations recorded with reasons.

## Evidence
