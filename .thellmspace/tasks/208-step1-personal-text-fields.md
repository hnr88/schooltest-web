---
id: 208
title: Rebuild step 1 Personal — given/family name, email and passport in the design's row grouping
layer: ui
kind: build
slice: Wizard step 1 text fields + row grouping
target: src/modules/student-wizard/components/StepPersonal.tsx, src/i18n/messages/*.json
contract: n/a for transport — the field contract is the wizard Zod schema quoted below
design: .qa/design/screens/portal--add-child-multi-step.html:28-44, .qa/design/spec/03-portal-forms.md#24-step-1--personal-details
status: TODO
depends_on: [204, 207]
---

## Objective
Ship step 1's four text fields in the portal dialect with the design's exact labels, placeholders,
help text and two-up row grouping, keeping every `register()` binding and message key.

## Contract
n/a for transport. Field contract, from
`src/modules/student-wizard/schemas/student-wizard.schema.ts` (the same schema whose output
`buildStudentPayload` sends to `POST /api/students`):

| Field | Zod rule | Required |
|---|---|---|
| `given_name` | `z.string().trim().min(1, givenNameRequired).max(100, givenNameTooLong)` | yes |
| `family_name` | `z.string().trim().max(100, familyNameTooLong).optional()` | no — mononyms must enrol |
| `email` | `'' \| z.string().trim().pipe(z.email(emailInvalid))`, optional | no |
| `passport_number` | `z.string().trim().max(50, passportTooLong).optional()` | no |

Empty optionals are OMITTED from the payload, never sent as `''` (`lib/build-student-payload.ts`).

## Design source
`03-portal-forms.md` §2.4 (`portal--add-child-multi-step.html:32-33,37,42`):

| # | Label | Req | Control | Placeholder | Help text |
|---|---|---|---|---|---|
| 1.1 | `Given name` | **Yes** (`*` `#2563EB`) | `PortalInput` | `e.g. Minh` | — |
| 1.2 | `Family name` | No | `PortalInput` | `e.g. Nguyen` | `Optional — many students go by one name only.` |
| 1.4 | `Email` | No | `PortalInput` | `student@example.com` | — |
| 1.7 | `Passport number` | No | `PortalInput` | `e.g. E12345678` | `Optional — schools use this for enrolment paperwork.` |

Row grouping (§2.4): `[1.1 | 1.2]`, `[1.3 | 1.4]`, `[1.5 full-width]`, `[1.6 | 1.7]` — two-up rows are
`grid gap-4 sm:grid-cols-2` (16px). 1.3 is task 209, 1.5 task 210, 1.6 task 211; this task ships the
grid skeleton for all four rows so those tasks only fill their cell.

Copy: the existing catalog already carries `familyNameHelper` and `passportHelper` with the design's
exact sentences (em dash `—`, U+2014). Placeholders change value only:
`givenNamePlaceholder` `e.g. Mia` → `e.g. Minh`, `familyNamePlaceholder` `e.g. Chen` → `e.g. Nguyen`.
`emailPlaceholder` and `passportPlaceholder` already match the design. `autoComplete`
(`given-name`, `family-name`, `email`) and `inputMode="email"` are kept.

Motion is inherited from the card (task 202) and the field (task 204); this task adds none.

## Files
- `src/modules/student-wizard/components/StepPersonal.tsx`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — two placeholder values

## Depends on
204 — the portal field stack. 207 — the invalid state these fields render.

## Steps
1. Update the two placeholder values in all six catalogs.
2. Rebuild `StepPersonal`'s grid to the four design rows, with cells for 209/210/211.
3. Run `051`, `052`, `student-wizard-contrast` (all three type into Given name / Family name by
   label), then axe.

## Project rules
`.claude/rules/module-pattern.md` (component ≤120 lines — `StepPersonal` is 115 today, so the row
grid must not grow it past the limit; split into `PersonalNameRow` if it does) ·
`.claude/rules/i18n.md` (no hardcoded strings; six catalogs) · `.claude/rules/tailwind.md`
(`gap-*`, never margin, for sibling spacing) · `.claude/rules/state-data.md` (RHF + zodResolver).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: the four labels render exactly as tabled; `Given name`'s label ends with a `*` whose
  computed colour is `--color-blue-600` and whose input carries `aria-required="true"`; the two help
  sentences render at `font-size: 12px`.
- `page.getByLabel('Given name').fill('Mia')` and `page.getByLabel('Family name')` still work — the
  locators `051`, `052`, `053` and `student-wizard-contrast` use.
- At 1280 the name row computes two columns; at 375 it computes one, with no horizontal scroll.
- A real submit later in the flow (task 221) sends `given_name` trimmed and omits an empty
  `family_name` — assert the request body in that task; here assert only that an empty family name
  produces no validation error and Continue advances.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
The design's `e.g. Minh` / `e.g. Nguyen` placeholders are adopted verbatim; they are examples, not
data, and are translated per locale like every other string.

## Evidence
