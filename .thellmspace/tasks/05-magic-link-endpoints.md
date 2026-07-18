---
id: 05
title: Magic-link endpoints — request / verify / me
layer: backend
kind: build
slice: the three public auth routes the desktop app already calls
target: schooltest-api/src/api/student-magic-link/{controllers,routes}/
contract: C-ML-REQUEST, C-ML-VERIFY, C-ML-ME
status: DONE
depends_on: [04]
---
## Objective
Implement the exact contract the schooltest-app client already calls:
1. routes/01-custom-student-magic-link.ts:
   - POST /api/auth/student/magic-link/request → requestMagicLink (auth: false)
   - GET /api/auth/student/magic-link/verify → verifyMagicLink (auth: false)
   - GET /api/auth/student/me → me (auth: false — controller authenticates the student
     JWT itself via authenticateStudentToken)
2. controllers/student-magic-link.ts (direct default export, thin):
   - requestMagicLink: Zod-validate {email}; checkRateLimit (429); find student by
     email field OR its user's email (documents().findFirst with populate user,parent);
     on match createToken + sendMagicLinkEmail (catch send failures — log, still 200);
     ALWAYS ctx.body = { ok: true } (enumeration-safe). 400 on invalid email shape.
   - verifyMagicLink: token query param required (400); verifyToken → single-use flip;
     signStudentJwt; ctx.body = { jwt, student: toStudentDto } ; 401 {error:{status:401,
     message, reason}} for used/expired; 400 malformed.
   - me: Bearer header → authenticateStudentToken → 401 if null; load student by
     payload.studentDocumentId (populate user,parent); ctx.body = { payload, student }.
## Files
- controllers/student-magic-link.ts, routes/01-custom-student-magic-link.ts
## Project rules
schooltest-api rules: auth omitted except these three `auth:false`; typed @strapi/utils
errors; thin controllers; no `auth:true`.
## Done criteria (REAL requests against :5500)
- POST request with a seeded student email → 200 {ok:true} AND a Mailhog message lands
  containing `schooltest://auth/student/verify?token=` AND `/auth/student/verify?token=`.
- POST request with an unknown email → 200 {ok:true} and NO new Mailhog message.
- Extract the token from the Mailhog message → GET verify → 200 {jwt, student} with the
  app-shaped student dto; second GET verify same token → 401 {reason:"used"}.
- GET me with that JWT → 200 {payload, student}; without header → 401.
- POST request ×6 same email within the hour → last one 429.
- tsc zero errors.
## Evidence
PASS (independent verifier, 2026-07-18): POST request → 200 {ok:true} byte-exact + OUR mailpit message (both locale-prefixed + schooltest:// links); unknown email → 200, zero messages (enumeration-safe); malformed → 400 typed envelope; verify → 200 exact {jwt, student{documentId,firstName,lastName,email,parentDocumentId,gradeYear}}; JWT payload {type:student, exp-iat 28800}; token reuse → 401 {error:{status:401,message,reason:used}}; missing/bad token → 400; me → 200 {payload,student} and 401 without header; rate limit: 5×200 then 429 (exactly 5 rows + 5 emails); tsc 0, lint 0 errors.
(filled by builder/verifier)
