---
id: 207
title: Author the wizard's per-field invalid state — border, message, icon and ARIA — that the design omits
layer: a11y
kind: build
slice: Field-level validation display for every wizard control (input, select, combobox, chip group)
target: src/modules/student-wizard/components/PortalFieldShell.tsx, src/modules/student-wizard/constants/wizard-control.constants.ts, src/modules/student-wizard/components/Wizard{TextField,SelectField,ChoiceField}.tsx, src/i18n/messages/*.json
contract: n/a — presentation of an existing Zod contract; see the schema quoted below
design: .qa/design/spec/03-portal-forms.md#unknowns (item 1), .qa/design/spec/04-ds-foundations.md#unknowns (item 6)
status: TODO
depends_on: [204]
---

## Objective
The export has **no** error state anywhere (`03-portal-forms.md` § UNKNOWNS 1: "no error state, no
error message component, no error border colour, no inline error text style, no field-level
`aria-describedby`"), yet `createStudentWizardSchema` produces 18 real messages today. Author the
invalid state in the portal dialect, so the re-skin does not silently lose the validation feedback
`051` proves.

## Contract
n/a for transport; the validation contract is
`src/modules/student-wizard/schemas/student-wizard.schema.ts` — the SAME schema the payload builder
feeds to `POST /api/students` (server whitelist mirror). Messages resolved from the
`StudentWizardSchema` namespace, unchanged by this task:

| Field | Rule | Message key |
|---|---|---|
| `given_name` | `min(1)`, `max(100)` | `givenNameRequired`, `givenNameTooLong` |
| `family_name` | `max(100)` optional | `familyNameTooLong` |
| `email`, `parent_guardian_email` | `''` or valid email | `emailInvalid` |
| `date_of_birth` | `''` or ISO date ≤ today, year ≥ 1900 | `dobInvalid` |
| `nationality` | `min(1)`, `max(100)` | `nationalityRequired`, `nationalityTooLong` |
| `passport_number` | `max(50)` | `passportTooLong` |
| `current_school` | `max(255)` | `currentSchoolTooLong` |
| `year_level` | int 7..12, nullable | `yearLevelInvalid` |
| `target_entry_year` | required, 4-digit, 2000..currentYear+10 | `targetYearRequired`, `targetYearInvalid` |
| `target_entry_term` | enum `Term 1..4` | `termRequired` |
| `parent_guardian_name` | `min(1)`, `max(200)` | `guardianNameRequired`, `guardianNameTooLong` |
| `parent_guardian_phone` | `min(1)`, `max(50)` | `guardianPhoneRequired`, `guardianPhoneTooLong` |
| `parent_guardian_wechat` | `max(100)` | `wechatTooLong` |

Validation mode stays `onBlur` with the Continue-time `form.trigger(STEP_FIELDS[step],
{ shouldFocus: true })` gate. `WizardSelectField`'s deliberate non-wiring of RHF `onBlur` (its header
comment explains the layout-shift bug it prevents) is preserved verbatim.

## Design source
No design source exists — this is an authored state, and that is recorded, not hidden. It is built
from values the design DOES define elsewhere: `--destructive` `#DC2626`
(`03-portal-forms.md` §1.2, 4.83:1 on white) and `--shadow-ring-error`
`0 0 0 3px oklch(0.5771 0.2152 27.33 / 0.10)` (`04-ds-foundations.md` §F).

- invalid control: `aria-invalid="true"` + `border-destructive` replacing `border-portal-input`,
  focus ring switching to the error ring; nothing else about the box changes (no size jump).
- message: `mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive` with a
  `size-3.5` aria-hidden lucide `CircleAlert` — 12px matches `PortalHelpText`, so an appearing error
  never re-flows the field by more than its own line.
- wiring: `describedBy(id, helper, error)` from the DS field shell already composes
  `aria-describedby`; the error node keeps the `${id}-error` id it expects. Keep both.
- the layout reserves the message line's height only while a message exists (matching today's
  behaviour); the select's known mid-interaction shift stays fixed by the `onBlur` decision above.
- chip groups: the group takes `aria-invalid` (already supported via `ChoicePillGroup`'s `invalid`
  prop) and the message is rendered by the same shell, so a radiogroup never gets a `<label for>`.

Motion: the message enters with `animate-in fade-in slide-in-from-top-1 duration-150 ease-out-expo
motion-reduce:animate-none`; the border change is a 150ms colour transition. `transform`/`opacity`
only.

## Files
- `src/modules/student-wizard/components/PortalFieldShell.tsx` — error slot + icon
- `src/modules/student-wizard/constants/wizard-control.constants.ts` — `WIZARD_CONTROL_INVALID`
- `src/modules/student-wizard/components/WizardTextField.tsx`, `WizardSelectField.tsx`,
  `WizardChoiceField.tsx` — apply the invalid class
- no catalog change (all 18 messages already exist in all six locales — verify parity, do not add)

## Depends on
204 — the field shell and the box this state modifies.

## Steps
1. Add the invalid class + error slot to the portal field shell.
2. Apply it in the three field wrappers.
3. Confirm all 18 `StudentWizardSchema` keys exist in all six catalogs.
4. e2e: the exact `051` validation sequence, plus focus and ARIA proof.

## Project rules
`.claude/rules/quality.md` (WCAG AA 4.5:1; errors must be programmatically associated;
`aria-invalid` + `aria-describedby`) · `.claude/rules/state-data.md` (RHF + `zodResolver`; the same
Zod schema validates client and server) · `.claude/rules/tailwind.md` · `.claude/rules/i18n.md`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright, on step 3 with empty name/phone, pressing Continue: both messages render, the two
  inputs compute `aria-invalid="true"` and a `border-color` equal to `--color-destructive`, each
  input's `aria-describedby` resolves to a node containing its message, and focus lands on the
  guardian-name input — this is `051-step-guardian`'s existing assertion block, which must still pass.
- Filling both and pressing Continue advances to step 4 and both messages disappear.
- The error text measures ≥4.5:1 against the card fill (canvas ratio, the
  `student-wizard-contrast.spec.ts` method).
- Reduced motion: the message's computed `animation-name` is `none`.
- axe zero serious/critical while errors are displayed; six catalogs key-identical.
- Zero banned-pattern grep hits; `051`, `052`, `053`, `student-wizard-contrast`,
  `dashboard-students` green.

## Assumptions
No new validation rules are invented — the design defines none, and the schema is already the API
mirror. Only the DISPLAY of the existing rules is authored here.

## Evidence
