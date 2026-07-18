---
id: 13
title: Sign-up page — register → parent role → dashboard
layer: frontend
kind: build
slice: /sign-up using the extended register endpoint
target: schooltest-web/src/app/sign-up/**, src/modules/auth/**, messages
contract: C-AUTH-REGISTER
status: TODO
depends_on: [08, 12]
---
## Objective
Sibling of the sign-in card per D10: username + email + password (+ confirm password
client-side match), same card layout/copy-family (en+de). Submit → existing
use-register.mutation (POST /api/auth/local/register) → writeClientToken → /dashboard.
Errors: 400 taken email/username → Auth.errors.taken; password <6 → field-level zod;
network → offline model from task 12. Link back to /sign-in ("Already have an
account?"). generateMetadata from Auth.meta.
## Files
- src/app/sign-up/page.tsx, src/modules/auth/components/{SignUpCard,SignUpForm}.tsx,
  schemas/sign-up.schema.ts, barrel, messages
## Done criteria
- REAL: register a fresh parent via the UI → lands on /dashboard; role.type=parent
  proven by a follow-up GET /api/users/me (assert in the verifier); taken email shows
  the styled error; tsc+lint zero; axe clean; parity.
## Evidence
(filled by builder/verifier)
