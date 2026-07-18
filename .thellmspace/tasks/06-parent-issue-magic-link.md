---
id: 06
title: Parent-issued magic link — POST /api/students/:documentId/magic-link
layer: backend
kind: build
slice: parent sends their student a login link (ownership-enforced)
target: schooltest-api/src/api/student-magic-link/{controllers,routes}/ (extend), policies
contract: C-ML-ISSUE
status: DOING
depends_on: [03, 04]
---
## Objective
Add the parent-issued path (schoolgo pattern):
- Route (in 01-custom-student-magic-link.ts): POST /api/students/:documentId/magic-link
  → issueMagicLink, policy global::is-authenticated (built-in plugin policy ref — check
  how existing routes reference it; use the repo's convention).
- Controller action: caller must be role type 'parent'; load student with populate
  parent; 403 when student.parent.documentId !== caller documentId; 400 when
  student.email unset (parent must add an email first); else createToken (with parent)
  + sendMagicLinkEmail; ctx.body = { ok: true }.
## Files
- extend controllers/student-magic-link.ts + routes/01-custom-student-magic-link.ts
## Done criteria (REAL)
- With the seeded parent JWT: POST against their own student → 200 {ok:true} + Mailhog
  message to the student's email. Against another user's student → 403. Against their
  student with email unset → 400. With no JWT → 401. tsc zero.
## Evidence
(filled by builder/verifier)
