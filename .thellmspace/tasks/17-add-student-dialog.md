---
id: 17
title: Dashboard — add-student dialog + create mutation
layer: frontend
kind: build
slice: DS Dialog form persisting via C-STUDENT-CREATE with list refresh
target: src/modules/dashboard/{components/AddStudentDialog.tsx,queries/use-create-student.mutation.ts,schemas/add-student.schema.ts}
contract: C-STUDENT-CREATE
status: TODO
depends_on: [16]
---
## Objective
"Add student" flow from the dashboard header + empty state:
- AddStudentDialog (client): DS Dialog with translated title/description; RHF+zod form
  (given_name, family_name, year_level number input or Select 7-12, email optional);
  submit → use-create-student.mutation (POST /api/students, typed axios, zod-parsed
  response) → on success: close, toast.success(Dashboard.students.addedToast via
  sonner), invalidate the students query (list shows the new row); on 400: surface the
  typed message; offline → offline error model.
- The mutation invalidates ['dashboard','students'] (prefix per state-data rules).
## Files
- the above + StudentsSection header button wiring + messages keys
## Done criteria
- REAL: parent adds "Testa Rig" (year 9, email) via the dialog → the row appears
  WITHOUT manual reload (query invalidation) AND persists after a full page reload;
  year_level 5 blocked client-side (zod) and server-side (400) — assert both in e2e
  later; tsc+lint zero; axe clean (dialog focus management from the primitive); parity.
## Evidence
(filled by builder/verifier)
