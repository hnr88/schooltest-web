# CONTRACTS.md — mission 2 contract surface (single source of truth)

All endpoints are Strapi v5 on `http://localhost:5500`. Envelope: v5 flat entities
(documentId at top level, no .attributes), `{ data, meta }` collections, typed error
`{ error: { status, name, message, details? } }`. Frontend parses via shared Zod schemas.

## Schema changes (api)
- `student` gains: `email` (string, optional), `parent` (manyToOne →
  plugin::users-permissions.user, inversedBy students). Student shape returned by parent
  endpoints: `{ documentId, given_name, family_name, year_level: number|null,
  email: string|null, createdAt, updatedAt }`.
- New content-type `student-magic-link`: `{ email (req), token (private, sha256 hash),
  used (bool, default false), expiresAt (datetime, req), usedAt (datetime|null),
  ipAddress, userAgent, student (manyToOne → api::student.student, req),
  parent (manyToOne → plugin::users-permissions.user, opt) }`.

## AUTH (parent)

### C-AUTH-LOGIN — POST /api/auth/local (stock users-permissions)
- Body: `{ identifier: string (email), password: string }`
- 200: `{ jwt: string, user: { id, documentId, username, email, confirmed, blocked,
  role: { type: "parent" } } }`
- 400: `{ error: { status:400, name:"ValidationError", message:"Invalid identifier or
  password" } }` — SAME message for unknown email AND wrong password (no enumeration).

### C-AUTH-REGISTER — POST /api/auth/local/register (extended, D4)
- Body: `{ username: string (3..20), email: string, password: string (>=6) }`
- 200: `{ jwt, user }` with role type `"parent"` (extension assigns it server-side).
- 400: taken email/username → `{ error: { status:400, message:"Email or Username are
  already taken" } }`.

### C-AUTH-ME — GET /api/users/me (Bearer parent JWT)
- 200: `{ id, documentId, username, email, role: { type } }` (flat user object).
- 401: `{ error: { status:401, message:"Unauthorized" } }` when no/invalid token.

### C-AUTH-GOOGLE (env-gated, D5) — GET /api/connect/google
- Enabled only when GOOGLE_CLIENT_ID/SECRET set. 302 → Google consent; callback
  GET /api/auth/google/callback → 302 → FRONTEND_URL/auth/google/callback with
  `?id_token=<jwt>` (users-permissions grant flow). Web callback stores jwt → /dashboard.
- Without credentials the route responds with the plugin's provider error (not wired) —
  e2e BLOCKED (D5), documented.

## STUDENTS (parent-scoped; custom route 01-custom-parent-students.ts)

### C-STUDENT-LIST — GET /api/students (Bearer parent JWT)
- Query: standard Strapi (`pagination[page]`, `pagination[pageSize]≤100`, `sort`).
- Controller force-merges `filters[parent][documentId][$eq]=<caller>` (re-applied after
  sanitizeQuery — schoolgo anti-leak pattern). Parent sees ONLY own students.
- 200: `{ data: Student[], meta: { pagination } }`. 401 unauth.

### C-STUDENT-CREATE — POST /api/students (Bearer parent JWT)
- Body: `{ data: { given_name: string(1..), family_name: string(1..),
  year_level: int 7..12, email?: valid-email } }`
- Controller strips client-supplied `parent/teacher/class/user/student_key`, sets
  `parent=<caller>` server-side. 200: `{ data: Student }`. 400 Zod validation envelope.
- Teacher/admin callers: allowed to set nothing extra here (this route is the parent
  write path; teacher flows keep their existing core routes).

### C-STUDENT-SEARCH — GET /api/search/students?q= (Bearer parent JWT)
- `q` optional (empty → recent 10). Matching: `$or[$containsi given_name, family_name,
  email]`, ALWAYS parent-scoped, sort createdAt desc, limit 10.
- 200: `{ data: Student[], meta: { query: { q, count } } }`. 401 unauth.

## MAGIC LINK (student passwordless; custom API api::student-magic-link)

### C-ML-REQUEST — POST /api/auth/student/magic-link/request (PUBLIC, auth:false)
- Body: `{ email: valid-email }`
- Looks up a student by `email` (field) OR by its linked UP user's email. On match:
  creates the token row (64-hex, sha256 stored, 30-min expiry) and SENDS the email
  (SMTP) with link `<APP_WEB_BASE>/auth/student/verify?token=<hex>` AND the desktop
  deep link `schooltest://auth/student/verify?token=<hex>`.
- 200 ALWAYS `{ ok: true }` (no account enumeration — generic success). 429 after
  5 requests/email/60min `{ error: { status:429, message:"Too many requests" } }`.
- 400 invalid email shape `{ error: { status:400, message } }`.

### C-ML-VERIFY — GET /api/auth/student/magic-link/verify?token=<64hex> (PUBLIC)
- 200: `{ jwt: <student-jwt>, student: { documentId, firstName, lastName, email,
  parentDocumentId, gradeYear } }` — marks token used (single-use).
- 400: malformed token `{ error: { status:400, message:"Invalid sign-in link" } }`.
- 401: `{ error: { status:401, message, reason: "used" | "expired" } }` (matches the
  app's existing error model). 429 rate-limited.

### C-ML-ME — GET /api/auth/student/me (Bearer student JWT)
- Validates the student JWT (HS256, secret STUDENT_JWT_SECRET||JWT_SECRET, payload
  `{ type:'student', studentDocumentId, parentDocumentId, iat, exp }`).
- 200: `{ payload: StudentJwtPayload, student: <same student shape as verify> }`.
- 401: `{ error: { status:401, message:"Unauthorized" } }`.

### C-ML-ISSUE — POST /api/students/:documentId/magic-link (Bearer parent JWT)
- Parent must own the student (else 403). Requires student.email set (else 400).
- Creates + sends the link to the student's email. 200: `{ ok: true }`.

## FRONTEND ROUTES (schooltest-web)
- `/sign-in` — DS sign-in card: Google button (D5-gated: hidden when provider off),
  divider, email+password form, inline error model, forgot-password link, sign-up link.
- `/sign-up` — register card (username/email/password) → lands on /dashboard.
- `/auth/google/callback` — reads `?id_token`, stores JWT, redirects /dashboard (or
  /sign-in with error state when absent).
- `/dashboard` — client-guarded; students list + add-student dialog + search bar.
- schooltest-app (desktop, untouched): `/auth/student/verify?token=` consumes C-ML-VERIFY;
  `/home` requires the student session.

## SEED (code only, D9)
- Parent user `parent@schooltest.local` (role parent, confirmed) + students
  `Mia Keller (year_level 8, mia.keller@schooltest.local)` and `Jonas Keller
  (year_level 10, jonas.keller@schooltest.local)` linked to the parent.
