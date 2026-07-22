---
id: 215
title: Rebuild step 3 Parent or guardian — name, phone, email and WeChat ID in the design's row grouping
layer: ui
kind: build
slice: Wizard fields 3.1–3.4 — guardian contact details
target: src/modules/student-wizard/components/StepGuardian.tsx, src/i18n/messages/*.json
contract: n/a for transport — the field contract is the wizard Zod schema quoted below
design: .qa/design/screens/portal--add-child-multi-step.html:70-80, .qa/design/spec/03-portal-forms.md#26-step-3--parent-or-guardian
status: TODO
depends_on: [204, 207]
---

## Objective
Ship step 3's four text fields in the portal dialect with the design's exact labels, placeholders and
two-up rows, keeping the validation behaviour `051-step-guardian` proves end to end.

## Contract
n/a for transport. Field contract:

| Field | Zod rule | Required |
|---|---|---|
| `parent_guardian_name` | `trim().min(1, guardianNameRequired).max(200, guardianNameTooLong)` | yes |
| `parent_guardian_phone` | `trim().min(1, guardianPhoneRequired).max(50, guardianPhoneTooLong)` | yes |
| `parent_guardian_email` | `'' \| email(emailInvalid)`, optional | no |
| `parent_guardian_wechat` | `trim().max(100, wechatTooLong)`, optional | no |

Name and phone are always sent; the two optionals are omitted when empty.

## Design source
`03-portal-forms.md` §2.6 (`portal--add-child-multi-step.html:74-79`):

| # | Label | Req | Control | Placeholder |
|---|---|---|---|---|
| 3.1 | `Parent or guardian name` | **Yes** (`*` `#2563EB`) | `PortalInput` | `e.g. Maria Rodriguez` |
| 3.2 | `Phone` | **Yes** (`*`) | `PortalInput` | `0400 000 000` |
| 3.3 | `Email` | No | `PortalInput` | `guardian@example.com` |
| 3.4 | `WeChat ID` | No | `PortalInput` | `e.g. wei_chen88` |

Row grouping (§2.6): `[3.1 | 3.2]`, `[3.3 | 3.4]`, `[3.5 full-width]` — 3.5 is task 216; this task
ships all three row containers. §2.6 note: "guardian `Email` is **not** required here even though it is
the results-delivery address; only name and phone carry `*`." That matches the schema exactly — do not
add a requirement the contract does not have.

Copy changes (values only; keys unchanged): `namePlaceholder` `e.g. Wei Chen` → `e.g. Maria Rodriguez`,
`phonePlaceholder` `+44 7700 900000` → `0400 000 000` (the design's Australian mobile format).
`emailPlaceholder` and `wechatPlaceholder` already match. `type="tel"`/`inputMode="tel"` and the
`autoComplete` values (`name`, `tel`, `email`) are kept — they are behaviour, not styling.

Note for the phone placeholder change: `051`/`052`/`student-wizard-contrast` FILL the phone field with
`+44 7700 900000` / `+61400000000`; a placeholder is not a value, so those stay green. The schema
imposes no format — do not invent one.

Motion: inherited from tasks 202/204/207.

## Files
- `src/modules/student-wizard/components/StepGuardian.tsx`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — two placeholder values

## Depends on
204 — the portal field stack. 207 — the invalid state these four render.

## Steps
1. Update the two placeholder values in all six catalogs.
2. Rebuild the three rows (`grid gap-4 sm:grid-cols-2` for the first two).
3. Run `051` — it drives this step's full validation sequence — then the rest.

## Project rules
`.claude/rules/i18n.md` · `.claude/rules/tailwind.md` (`gap-*` for sibling spacing) ·
`.claude/rules/quality.md` (labelled inputs; required marked programmatically) ·
`.claude/rules/module-pattern.md` (component ≤120 lines).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: the four labels render as tabled; `Parent or guardian name` and `Phone` carry a `*`
  computing `--color-blue-600` and `aria-required="true"`; `Email` and `WeChat ID` carry neither.
- `051`'s validation block passes unchanged: Continue on an empty step 3 shows
  `guardianNameRequired` + `guardianPhoneRequired`, stays on step 3, and focuses the name input;
  filling both advances to step 4.
- `page.getByLabel('Parent or guardian name')` / `getByLabel('Phone')` still resolve (the locators
  `051`, `052`, `student-wizard-contrast` use).
- At 1280 both paired rows are two columns; at 375 one column, no horizontal scroll.
- ZH: `051`'s localized run still passes.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
The Australian phone placeholder is an example, not a validation rule; no phone-format validation is
added anywhere.

## Evidence
