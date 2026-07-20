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
- Enabled only when GOOGLE_ENABLED=true + GOOGLE_CLIENT_ID/SECRET set (validate-env
  requires the pair). Without credentials it answers 400
  {error:{status:400,message:"This provider is disabled"}} (never a 500).
- Flow (verified against installed grant@5.4.24 + users-permissions 5.50.1):
  1. GET /api/connect/google → 302 to Google consent (redirect_uri =
     <server>/api/connect/google/callback — register that in the Google console).
  2. Post-consent, grant 302s the browser to providers.google.callback =
     <FRONTEND_URL>/auth/google/callback with GOOGLE tokens in the query
     (?access_token=<google-token>&id_token=<google-OIDC-token>&raw[...]).
  3. The web callback FORWARDS that query to GET /api/auth/google/callback,
     which answers JSON {jwt, user} — THE STRAPI JWT comes from the API response,
     NOT from the query id_token (that one belongs to Google). The web stores the
     API-returned jwt (writeClientToken) → /dashboard.
  4. OAuth-registered users' role: defaults apply today; assigning the parent role
     to OAuth registrations is a follow-up after credentials land (DECISIONS D5/D18).


## STUDENTS (parent-scoped; custom route 01-custom-parent-students.ts)

### C-STUDENT-LIST — GET /api/my/students (Bearer parent JWT)
- Query: standard Strapi (`pagination[page]`, `pagination[pageSize]≤100`, `sort`).
- Controller forces `filters[parent][documentId][$eq]=<caller>` server-side (the /my/*
  convention — no core-route shadowing). Parent sees ONLY own students.
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

---

# UI polish + parent notifications contract addendum (2026-07-20)

Existing endpoints retain their established contract; the UI consumes them through the
existing typed Axios + TanStack Query boundary. New operation IDs below are owned by tasks
34 and 39. Error envelopes are Strapi's existing `{ error: { status, name, message,
details? } }` shape.

### C-PARENT-CHILD-PROGRESS — GET /api/my/students/:documentId/progress

- Auth: users-permissions parent JWT only. The requested student must belong to the caller;
  unknown and foreign records both return 404 to avoid ownership disclosure. Missing or
  non-parent authentication returns the project-standard 403.
- Request: path `documentId`, a 24-character alphanumeric Strapi document id. No body or query
  parameters are accepted.
- 200: Strapi's single-response envelope `{ data, meta }`; `data` is
  `{ student, metrics, recentResults }`. `student` is the explicit parent-safe projection
  `{ documentId, given_name, family_name, year_level, nationality, current_year_level,
  target_entry_year, target_entry_term, status, createdAt, updatedAt }` (all scalar profile
  fields except `documentId`/`status`/timestamps may be null; no passport, guardian, parent,
  user, teacher, class, or numeric id). `metrics` is `{ totalSessions: nonnegative integer,
  completedSessions: nonnegative integer, activeSessions: nonnegative integer,
  officialResults: nonnegative integer }`. `recentResults` is at most five newest official,
  parent-owned test summaries `{ documentId, skill: reading|listening|speaking|writing|null,
  displayLabel: string|null, cefrBand: pre_A1|A1|A2|B1|B2|C1|null,
  readiness: met|approaching|not_yet|not_assessed|null,
  status: scoring|partial_pending|complete, publishedAt: ISO datetime|null }`.
- Persistence: read-only Document Service queries over the caller's child, sessions and
  official results; no record is created or changed.
- Errors: 400 malformed path or any query parameter; 403 unauthenticated/non-parent; 404 absent
  or foreign child.

### C-SEARCHPREF-GET — GET /api/search-preferences/me

- Auth: users-permissions parent JWT only. There is no request body, path parameter or query
  parameter; the owning user is always derived server-side from the JWT.
- 200: `{ data }`, without a `meta` member. `data` is the parent-safe strict view
  `{ documentId, default_states: AU-state[], default_school_types:
  combined|primary|secondary[], default_sectors: government|non-government|catholic[],
  default_sort: relevance|name-asc|name-desc|fee-asc|fee-desc, default_page_size: integer
  1..50, default_fee_min: integer 0..1000000|null, default_fee_max: integer
  0..1000000|null, createdAt: ISO datetime, updatedAt: ISO datetime }`.
- Persistence: get-or-create the caller's single `search_preferences` row through the real
  Document Service. First read returns the persisted defaults (empty arrays, `relevance`, page
  size `12`, null fees); it never returns the `user` relation.
- Errors: project-standard 403 for unauthenticated/non-parent callers.

### C-SEARCHPREF-UPDATE — PUT /api/search-preferences/me

- Auth/ownership: same parent-only JWT and server-derived row as C-SEARCHPREF-GET.
- Request: a strict, flat partial object using only C-SEARCHPREF-GET's seven
  `default_*` setting fields. Arrays have the same enum vocabulary and maximum cardinality
  (states 8, school types/sectors 3); duplicates are persisted once. `default_page_size` is
  1..50; fee values are integers 0..1000000 or null; when both fee bounds are non-null,
  minimum must not exceed maximum. Owner/id/timestamp or other unknown fields are rejected.
- 200: the exact `{ data: SearchPreferenceView }` response above after the durable update.
- Persistence: partial update of only supplied whitelisted fields; an empty object returns the
  current persisted row unchanged. Errors: 400 typed `ValidationError` for invalid/unknown
  input; 403 for unauthenticated/non-parent callers.

### C-PUSH-VAPID-CONFIG — GET /api/push-subscriptions/vapid-public-key

- Auth: users-permissions parent JWT only; no object parameter.
- 200: `{ data: { publicKey: string|null } }`. `null` honestly reports an unavailable
  server configuration; the endpoint never exposes a VAPID private key or any user data.
- Persistence: read-only server configuration. Errors: project-standard 403 for
  unauthenticated/non-parent callers.

### Existing notification operations consumed by the web UI

- `C-NOTIF-LIST`: `GET /api/notifications?page=&pageSize=&read=&category=` → owner-scoped
  `{ data, meta: { pagination, unreadCount } }`; no token or foreign data leaks.
- `C-NOTIF-READ`: `PUT /api/notifications/:documentId/read` → `200 { data }`; foreign 403,
  unknown 404. `C-NOTIF-READ-ALL`: `POST /api/notifications/read-all` →
  `200 { data: { updated } }`.
- `C-PREF-GET`/`C-PREF-UPDATE`: `GET`/`PUT /api/notification-preferences/me`, each
  parent-owned and runtime-validated.
- `C-PUSH-SUBSCRIBE`/`C-PUSH-UNSUBSCRIBE`: `POST`/`DELETE /api/push-subscriptions` with
  the browser PushSubscription shape / `{ endpoint }`; owner is server-derived. SMS stays
  the existing honest Twilio-prepared server channel and is exercised through its real API
  dispatch path rather than a fabricated browser control.

### C-UI-SHELL-NAV — sidebar and contextual dashboard header

- Transport/persistence: no new HTTP operation. The existing `SidebarProvider` owns the
  session-local expanded/collapsed state; navigation continues to use locale-aware links.
- Desktop: the dark primary sidebar is `collapsible="icon"`, so an explicit desktop trigger
  and the documented Ctrl/Cmd+B shortcut toggle it between full navigation and accessible
  icon navigation. Mobile remains an off-canvas sheet controlled by the same trigger.
- Header: the left region always renders a semantic breadcrumb ending in the current route plus
  an H1-equivalent page title sourced from the locale catalog. The user menu remains on the
  right. No route title, breadcrumb label, or navigation target may be hard-coded.
- Errors: route metadata has an explicit dashboard fallback rather than an empty or broken
  header. There is no persistence effect.

### C-SEARCH-SCHOOLS — cover-media amendment

- Transport/auth/request/pagination/error behavior remain unchanged for `POST /api/search/schools`.
- Additive 200 item field: `coverImage` is either `null` or the strict media view
  `{ url: non-empty string, alternativeText: string|null, width: positive integer|null,
  height: positive integer|null }`. `url` is returned by the configured Strapi upload provider
  and is populated explicitly from `school.coverImage`; no client path or stock-photo fallback
  is permitted.
- Persistence: `school.coverImage` is an optional single Strapi media relation. An absent
  verified media relation remains `null`; the client then renders an honest metadata-based
  identity tile, never a false photo. Existing real cover media is stored/read through the
  upload plugin and survives a live API reload.

### C-UI-CHILD-LEARNING-SURFACE — child list and individual learning dashboard

- Transport: consumes the existing typed `C-STUDENT-LIST` and
  `C-PARENT-CHILD-PROGRESS` operations without a client-side shape rewrite.
- Presentation: the child list is a navigable profile collection. The individual route is a
  distinct learning-progress surface, not a visual duplicate of the parent overview: profile
  context, an activity/completion summary derived only from real session metrics, and a
  chronological assessment-result stream. When no metrics or results exist, the UI states that
  honestly rather than synthesizing a score, chart, or recommendation.
- Errors/ownership/persistence: inherited unchanged from the two source contracts; the route
  must retain foreign/not-found protection and show the same real data after reload.

### C-UI-DASHBOARD-OVERVIEW — parent overview redesign

- Transport: reads only the existing typed parent-owned student list/query. All totals, plan
  readiness, and profile rows are derived from returned persisted student fields.
- Presentation: the parent overview uses a distinct action-oriented composition from the child
  learning route, with a contextual header, real profile summary, and links to the existing
  Children/Search actions. No made-up activity, score, or notification count is rendered.
- Errors/persistence: existing loading/error/retry behavior is retained; data remains visible
  after a normal live reload.
