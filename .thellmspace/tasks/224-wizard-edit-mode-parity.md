---
id: 224
title: Carry the re-skinned wizard through edit mode without breaking the prefill or the PUT
layer: integration
kind: implement
slice: `/dashboard/children/[documentId]/edit` — the same wizard, in edit mode
target: src/modules/children/components/EditStudentScreen.tsx, src/modules/children/hooks/use-edit-student.ts, src/modules/student-wizard/components/{WizardScreen,WizardHeader,WizardNav}.tsx, src/i18n/messages/*.json
contract: C-STUDENT-UPDATE — `PUT /api/students/:documentId` (existing); see below
design: .qa/design/screens/portal--add-child-multi-step.html:4-8,138-144, .qa/design/spec/03-portal-forms.md#21-page-layout
status: TODO
depends_on: [203, 219]
---

## Objective
`WizardScreen` serves two routes. The re-skin must land on the edit route too — same rail, same card,
same footer — with the header copy, the final button and the exit target all correct for editing, and
with the prefill + PUT that `dashboard-students.spec.ts` proves untouched.

## Contract
`PUT /api/students/:documentId`, body `{ data }` from the SAME `buildStudentPayload` output
(`children/queries/use-update-student.mutation.ts`), prefilled by
`GET /api/my/students/:documentId` (`useStudentDetailQuery` → `lib/detail-to-initial-values.ts`).
Ownership: a foreign child is 404 at the API. `EditStudentScreen` passes `mode="edit"` and its own
`onSubmit`, which `useWizardSubmit` runs INSTEAD of the create mutation — that branch is preserved
exactly.

`dashboard-students.spec.ts:137-180` is the guard: open the row menu → `Children.edit` → land on
`/dashboard/children/{documentId}/edit` → the wizard is prefilled (passport empty) → click
`StudentWizard.continue` four times → click `StudentWizard.saveChanges` → PUT → back to the list.

## Design source
The export has one add-child screen and no edit screen, so the edit surface reuses it with three
substitutions, each named:

| Element | Create | Edit |
|---|---|---|
| Back link (§2.1) | `My children` → `/dashboard/children` | same target, so unchanged |
| `h1` (§2.1) | `Add a child` (`StudentWizard.title`) | `Edit {name}` (`StudentWizard.editTitle`), falling back to `StudentWizard.editTitleFallback` while the detail query is loading |
| Footer primary (§2.9) | `Confirm & add child` | `Save changes` (`StudentWizard.saveChanges`, existing key, existing behaviour) |
| Step 5 | summary table (task 219) | same table — it reads live form values, which are the prefilled ones |

Loading and error states for the prefill query keep whatever `EditStudentScreen`/`use-edit-student`
do today (they must not silently become a blank wizard); the skeleton is re-skinned to the portal card
footprint — `rounded-portal-card` at the same padding — so the layout does not jump when data lands.

Motion: identical to create; the prefilled first step still enters with the card transition.

## Files
- `src/modules/children/components/EditStudentScreen.tsx` — pass the edit title
- `src/modules/children/hooks/use-edit-student.ts` — unchanged unless the title needs the name
- `src/modules/student-wizard/components/WizardHeader.tsx` — `title` prop
- `src/modules/student-wizard/components/WizardScreen.tsx` — thread `mode` to the header
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `editTitle` (`Edit {name}`), `editTitleFallback`

## Depends on
203 — the footer whose label differs by mode. 219 — the review step edit mode also renders.

## Steps
1. Add the two catalog keys ×6.
2. Thread the title through the header; keep `mode` flowing to `WizardNav`.
3. Re-skin the prefill skeleton to the card footprint.
4. Run `dashboard-students.spec.ts` first — it is the only spec that drives this route — then the rest.

## Project rules
`.claude/rules/module-pattern.md` (cross-module use through the barrel: `children` imports
`WizardScreen` from `@/modules/student-wizard`) · `.claude/rules/i18n.md` ·
`.claude/rules/state-data.md` (query + mutation stay in `queries/`) · `.claude/rules/quality.md`
(one `h1`; the page's own `generateMetadata` stays).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `/dashboard/children/{documentId}/edit` renders the portal frame — vertical rail at
  1280, the 24px card, the footer — with the `h1` reading `Edit {name}`.
- `dashboard-students.spec.ts`'s edit test passes unchanged: prefilled fields (passport empty), four
  Continues, `Save changes`, a real `PUT /api/students/:documentId`, and the list showing the change.
- **Persistence**: change the guardian phone, save, reload the list, open edit again — the new value is
  read back from the API, not from client cache.
- While the detail query is loading, the skeleton occupies the same card footprint (no layout jump);
  on query error the existing error state still renders.
- 375px: the edit route composes exactly like the create route (task 223's assertions repeated once).
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students`, `children-profile` green.

## Assumptions
Edit mode keeps five steps (the design has one wizard, and `dashboard-students.spec.ts` clicks
Continue exactly four times). Collapsing edit into a single form would break that spec and is out of
scope.

## Evidence
