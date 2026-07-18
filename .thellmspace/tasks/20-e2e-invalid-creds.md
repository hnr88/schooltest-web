---
id: 20
title: E2E — invalid credentials show the styled error
layer: integration
kind: verify
slice: bulletproof error model on the styled login page
target: tests/e2e/parent-auth.spec.ts (extend)
contract: C-AUTH-LOGIN
status: TODO
depends_on: [12]
---
## Objective
Same spec file: wrong password → stays on /sign-in, styled Alert error with the
translated invalid-credentials message (NO Strapi page, NO "Invalid identifier" English
leak — assert the translated key from messages); unknown email → SAME message
(enumeration-safe); empty submit → field-level zod messages (translated). ONE attempt
per case (never loop logins per zero-tolerance).
## Done criteria
- Both cases assert the translated error from de+en? — assert en catalog value; axe on
  the errored page still clean.
## Evidence
(filled by builder/verifier)
