---
id: 04
title: student-magic-link content-type + service (token lifecycle)
layer: backend
kind: build
slice: content-type + service: hashed token create, rate limit, verify, student JWT, email
target: schooltest-api/src/api/student-magic-link/**, src/utils/
contract: C-ML-REQUEST, C-ML-VERIFY, C-ML-ME
status: DONE
depends_on: [01, 02]
---
## Objective
Borrow schoolgo-api/src/api/student-magic-link/ into our api, adapted to our contracts:
1. content-types/student-magic-link/schema.json per CONTRACTS.md (email req, token
   private string, used bool default false, expiresAt datetime req, usedAt datetime,
   ipAddress, userAgent, student manyToOne→api::student.student req, parent
   manyToOne→UP user opt). UID api::student-magic-link.student-magic-link.
2. services/student-magic-link.ts (+ controllers in task 05): crypto-only helpers —
   createToken(student, {ipAddress,userAgent,parent}) → raw 64-hex + row (sha256 stored,
   expiresAt +30min); checkRateLimit(email, max 5/60min); verifyToken(raw) → student |
   throws typed {status,message,reason used|expired|invalid}; signStudentJwt(student)
   HS256 payload {type:'student', studentDocumentId, parentDocumentId, iat, exp} TTL
   env STUDENT_JWT_TTL_SECONDS default 28800, secret STUDENT_JWT_SECRET||JWT_SECRET;
   authenticateStudentToken(raw) → payload | null;
   sendMagicLinkEmail({to, link, deepLink}) via strapi.plugins.email.services.email.send
   (HTML + text; link base from env APP_WEB_BASE default http://localhost:3002;
   deep link schooltest://auth/student/verify?token=).
3. toStudentDto(student) → {documentId, firstName: given_name, lastName: family_name,
   email: student.email ?? user.email, parentDocumentId: parent?.documentId ?? null,
   gradeYear: year_level ?? null} — matches the app's Student type EXACTLY (CONTRACTS.md).
## Files
- src/api/student-magic-link/content-types/student-magic-link/schema.json
- src/api/student-magic-link/services/student-magic-link.ts (createCoreService wrap or plain)
- regenerate types after schema (ts:generate-types)
## Project rules
schooltest-api rules: documents() only, documentId, @strapi/utils errors, no populate '*',
ts:generate-types after schema change.
## Done criteria
- Types regenerated; service functions work via strapi console: create a token for a
  seeded student, verify it once (200 path returns student + signable JWT), second verify
  throws used; rate limit trips on the 6th create in the same hour; email row has sha256
  NOT the raw token; tsc zero errors.
## Evidence
PASS (independent verifier, 2026-07-18): schema contract-exact with private token; createToken stores sha256 only, +30min expiry; single-use verified (2nd call → UnauthorizedError reason=used); malformed + unknown tokens → ValidationError(400); rate limit RateLimitError on 6th; JWT round-trip {type:student, exp-iat 28800}, tamper → null; toStudentDto exact 6-key shape with UP-user email fallback; findStudentByEmail case-insensitive; email template contains both the locale-prefixed http link and the schooltest:// deep link; tsc 0, lint 0 errors; committed as 23f2b54. Note for task 05: controller must map err.reason into the 401 body (core does not serialize custom props).
(filled by builder/verifier)
