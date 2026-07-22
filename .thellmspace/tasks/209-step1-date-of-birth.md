---
id: 209
title: Ship step 1's Date of birth field and resolve the design's DD/MM/YYYY text input against the ISO wire format
layer: ui
kind: build
slice: Wizard field 1.3 — date of birth
target: src/modules/student-wizard/components/StepPersonal.tsx, src/modules/student-wizard/schemas/student-wizard.schema.ts, src/i18n/messages/*.json
contract: n/a for transport — the field contract is the wizard Zod schema quoted below
design: .qa/design/screens/portal--add-child-multi-step.html:36, .qa/design/spec/03-portal-forms.md#24-step-1--personal-details
status: TODO
depends_on: [204, 207]
---

## Objective
Put the date-of-birth control in the portal box and settle, visibly, the one conflict this field
carries: the design draws a plain text input with a `DD/MM/YYYY` placeholder, while the field's value
must reach Strapi as an ISO date and the app ships six locales.

## Contract
n/a for transport. Field contract (`schemas/student-wizard.schema.ts`):

```ts
date_of_birth: z.string()
  .refine((v) => v === '' || isValidDateOfBirth(v), t('dobInvalid'))
  .optional()
// isValidDateOfBirth: /^\d{4}-\d{2}-\d{2}$/, parseable, year >= DOB_MIN_YEAR (1900), <= today
```

`buildStudentPayload` omits the key entirely when the string is empty. The wire value is
`YYYY-MM-DD`; `student.date_of_birth` is a Strapi date field, and `dashboard-students.spec.ts`'s edit
test round-trips it through `GET /api/my/students/:documentId` → prefill → `PUT`.

## Design source
`03-portal-forms.md` §2.4 row 1.3 and § UNKNOWNS 2:

| # | Label | Req | Control | Placeholder | Note |
|---|---|---|---|---|---|
| 1.3 | `Date of birth` | No | `PortalInput` (text) | `DD/MM/YYYY` | "a **plain text input** with a `DD/MM/YYYY` placeholder, not `<input type=date>` (L36). Format is day-first." § UNKNOWNS 2: "Whether a date picker is intended, and what the min/max age bounds are, is not specified." |

**Decision this task must implement and record**: keep `type="date"` with `max={todayIso()}`
(the current control) and apply the portal box. Reasons, all citable: (a) the schema and the API both
require `YYYY-MM-DD` and a free-text day-first field would need an invented parser plus an invented
locale rule for zh/ko/ms/vi/th — `D-SCOPE-1` rule 4 forbids inventing; (b) a native date input is
keyboard- and screen-reader-operable out of the box, where the design's text field has no format
enforcement at all; (c) the design itself marks this an UNKNOWN. The DEVIATION is recorded in the
task's Evidence and in the component's header comment, not silently taken.

What is adopted from the design: the label `Date of birth`, no required marker, the 48px portal box
(task 204), and the field's position in row `[1.3 | 1.4]`. `type="date"` renders its own format hint,
so no placeholder is invented.

## Files
- `src/modules/student-wizard/components/StepPersonal.tsx` — the 1.3 cell
- `src/modules/student-wizard/schemas/student-wizard.schema.ts` — unchanged unless the DOM proof shows
  the browser emits a non-ISO value (it does not; assert it)
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — no new key expected; `dateOfBirth` already exists

## Depends on
204 — the portal input box. 207 — the `dobInvalid` display.

## Steps
1. Apply the portal box to the existing date input; keep `max={todayIso()}`.
2. Write the deviation into the component's header comment with the three reasons above.
3. e2e: value format, future-date rejection, and the edit-mode round trip.

## Project rules
`.claude/rules/quality.md` (keyboard-reachable, labelled) · `.claude/rules/i18n.md` (no locale-specific
hardcoding) · `.claude/rules/state-data.md` (one schema, client and server) ·
`CLAUDE.md` §0 law 5 (in doubt, record the gap — here the design's own UNKNOWN).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: filling `2013-03-14` leaves `input.value === '2013-03-14'`; the control computes
  `height: 48px`, `border-radius: 12px`, `border-width: 1.5px`.
- Entering a future date and pressing Continue shows the localized `dobInvalid` message and does not
  advance; clearing the field advances (optional).
- The created student's `date_of_birth` column in Postgres reads `2013-03-14` after a real submit
  (proved in task 221; here assert the request body carries `"date_of_birth":"2013-03-14"`).
- `dashboard-students.spec.ts`'s edit prefill still shows the stored date.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
The deviation is deliberate and documented. If a future product decision wants the day-first text
field, it needs a parser task plus a locale-format decision — neither is invented here.

## Evidence
