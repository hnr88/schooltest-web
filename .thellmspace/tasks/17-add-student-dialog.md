---
id: 17
title: Dashboard — add-student dialog + create mutation
layer: frontend
kind: build
slice: DS Dialog form persisting via C-STUDENT-CREATE with list refresh
target: src/modules/dashboard/{components/AddStudentDialog.tsx,queries/use-create-student.mutation.ts,schemas/add-student.schema.ts}
contract: C-STUDENT-CREATE
status: DONE
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
Independently verified 2026-07-18 (independent explore verifier, evidence gathered
personally against the real live app — not from the builder's self-report):

- **Backend contract (curl, seeded parent JWT)**: `POST /api/students` success →
  exact CONTRACTS.md shape `{data: Student}` (created "VerifyCurl Testcase" year 9
  with email); server injects `parent={caller documentId}` server-side and silently
  strips a client-supplied `parent`/`student_key` ownership-override attempt (separate
  probe curl confirmed). Three 400 paths curl-proven with the exact typed envelope
  `{error:{status:400,details:{fields,issues}}}` that `classify-add-student-error.ts`
  reads: `year_level:5` → `"year_level: Too small: expected number to be >=7"`, missing
  `given_name`, invalid `email`. Unauthenticated → 403 masked-forbidden (pre-existing
  D15/D16 install quirk, non-blocking — the dialog only mounts behind ParentGuard).
- **Cleanup/no pollution**: the parent role has no DELETE grant on `/api/students`
  (403 confirmed), so both curl-created throwaway students were removed via direct
  Postgres delete (`students` + `students_parent_lnk` rows, ids 847/848). Re-curled
  `GET /api/my/students` afterward: exactly Mia (8) + Jonas (10), zero residue.
- **Client-side year_level guard**: source-confirmed the Select renders ONLY
  `YEAR_LEVEL_OPTIONS = [7,8,9,10,11,12]` (5 cannot be selected through the UI at all);
  the zod schema still carries `.min(7).max(12)` as defense-in-depth for a tampered
  submit.
- **E2E, run live**: `pnpm exec playwright test tests/e2e/add-student-dialog.spec.ts` →
  4/4 passed (real create via the empty-state action → toast → dialog closes → row
  appears with NO manual reload via query invalidation → survives a real
  `page.reload()`; axe scan on the open dialog has zero serious/critical violations
  and focus lands inside the dialog content; required-field block; invalid-email
  block; Cancel discards without a request reaching the api). Full suite re-run:
  `pnpm exec playwright test` → 52/52 passed across all 12 spec files, including
  `students-list.spec.ts`'s own "seeded parent sees exactly Mia+Jonas" assertion
  (proves the curl testing above left no residue).
- **Static checks**: `pnpm tsc --noEmit` → clean, zero output. `pnpm lint` → 0 errors,
  1 pre-existing unrelated warning in `CreateArticleForm.tsx` (confirmed untouched by
  this task's diff — same warning task 16 already logged). `pnpm exec prettier --check`
  on every touched file → clean.
- **i18n**: independently recomputed key parity (own flatten script) → 360 keys × 6
  locales (en/ko/ms/th/vi/zh), zero missing/extra; all new `addStudent*`/dialog keys
  present in every locale.
- **No fixtures**: `grep -rniE "mock|fake|stub|dummy|placeholder|hardcoded"` across
  every touched source/test file → zero fixture/mock hits (only legitimate JSX
  `placeholder=` props and an honest "no mocks" code comment).
- **Module-pattern compliance**: schema in `schemas/`, types re-exported from `types/`,
  mutation in `queries/`, form/submit logic extracted to `hooks/` (component stays
  presentational), direct intra-module imports (not via barrel), barrel exports only
  the public surface.

Full raw evidence recorded in `.qa/STATE.json` task 17's `verify` object.
