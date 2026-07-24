---
id: 005
title: Wizard e2e — gating + mandatory media specs
layer: integration
kind: build
slice: e2e proof for wizard gating and mandatory uploads
target: schooltest-web/tests/e2e
contract: n/a
status: TODO
depends_on: [002, 003, 004]
---
## Objective
tests/e2e/020-wizard-skip-e2e.spec.ts currently ASSERTS the old broken behavior (advance
with empty step 1). Rewrite it to assert gating, and add coverage for the mandatory-upload
validation. Also reconcile 051/052/053 specs with the new required fields.
## Spec flows (mission-mandated)
- Complete step 1 of add student form and verify step 2 cannot be accessed until step 1 is submitted/valid.
- Attempt to submit without the required audio upload -> validation blocks submission.
- Attempt to submit without the required photo upload -> validation blocks submission.
## Files
- tests/e2e/020-wizard-skip-e2e.spec.ts (invert to gating assertions)
- tests/e2e/052-step-media.spec.ts (adjust optional -> required expectations)
- tests/e2e/053-wizard-controls.spec.ts, 051-step-guardian.spec.ts (fix assumptions)
- New spec if cleaner: tests/e2e/054-wizard-gating.spec.ts
## Done criteria
- All wizard specs pass against the real stack (E2E_PORT=3110, api :5510);
  full create with real small audio + image files persists a student visible after reload.
