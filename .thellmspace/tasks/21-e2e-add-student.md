---
id: 21
title: E2E — parent adds a student; persists after reload
layer: integration
kind: verify
slice: C-STUDENT-CREATE through the dialog with DB-truth reload
target: tests/e2e/dashboard-students.spec.ts
contract: C-STUDENT-CREATE
status: TODO
depends_on: [17]
---
## Objective
Login as parent → open Add student → fill (unique email per run:
e2e+<timestamp>@schooltest.local, year 9) → submit → row appears in the list without
manual reload → HARD reload the page → row still there (persistence proof) → ALSO
prove via a direct api GET /api/students with the parent JWT (fetch inside the test
with the stored token? — read localStorage app.auth.token from the page and call the
api directly: the row exists with parent=<the parent user>).
Validation: a second student with year_level 5 is blocked by the form (no request
fired).
## Done criteria
- Spec green; the api-direct assertion proves parent ownership on the row.
## Evidence
(filled by builder/verifier)
