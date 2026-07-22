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

### C-NOTIF-EVENTS — persisted domain-event delivery fan-out

- Transport/auth: internal event handlers invoke the existing notification dispatcher after an
  authorized domain action (including account confirmation, child creation, password changes and
  test-result completion). There is no public dispatch endpoint and no client-supplied recipient:
  the recipient is derived by the domain action/server relation.
- Success/persistence: dispatch writes one real `notifications` row with server-derived event
  category, title/body/link and recipient relation. It then records the actual channel outcomes
  (`emailSent`, `pushSent`, `smsSent` and a truthful SMS blocked reason where applicable). A
  suppressed in-app preference retains the audit row but marks it read; account/security events
  remain non-suppressible.
- Errors: a notification channel failure is best-effort and does not falsify or fail the completed
  domain action. The persisted row is the delivery ledger; no channel reports a fabricated success.

### C-PUSH-SEND — internal Web Push delivery

- Transport/auth: the server selects only the persisted push-subscription rows owned by the
  server-derived notification recipient; it serializes `{ title, body, url }` through the real
  `web-push` VAPID sender. No public send route or client-selected subscription exists.
- Success: internal `{ pushSent, accepted, reaped }`; `pushSent` is true only after a push service
  accepts a real encrypted VAPID request. HTTP 404/410 from that service reaps the owned endpoint.
- Errors: unavailable VAPID configuration, no subscription and non-accepting endpoints return an
  honest no-send result and leave the domain event successful without setting `pushSent`.

### C-SMS-ADAPTER — prepared Twilio delivery channel

- Transport/auth: no public browser SMS route is fabricated. The internal channel sends a real
  authenticated `POST /2010-04-01/Accounts/{sid}/Messages.json` only when server-side Twilio
  credentials and a normalized recipient phone exist.
- Success: internal `{ smsSent: true, smsSentAt, sid? }` only for a real Twilio 2xx response.
- Errors/preparation: absent credentials return `{ smsSent: false,
  smsBlockedReason: "sms_blocked_no_credentials" }` with no outbound request; absent/invalid phone
  is similarly `sms_blocked_no_phone_number`. HTTP/network failures become truthful bounded
  blocked reasons, never a fabricated carrier-delivery receipt.

### C-PUSH-SUBSCRIBE — POST /api/push-subscriptions

- Auth/ownership: parent JWT only. The browser subscription owner is always server-derived
  from that JWT; `user` is not an accepted request field.
- Request: strict browser `PushSubscription.toJSON()` shape `{ endpoint, keys: { p256dh, auth },
  expirationTime?: epoch-ms|null, userAgent?: string }`. Unknown/missing keys → typed 400
  `ValidationError`; unauthenticated/non-parent → project-standard 403.
- 200: `{ data: { documentId: string, endpoint: string } }`. An endpoint already owned by the
  same parent updates its subscription material. An endpoint owned by a different parent returns
  generic 403 `ForbiddenError`; it is never reassigned or disclosed.
- Persistence: creates/updates exactly one `push_subscriptions` row, connecting the creator to
  the authenticated parent by the server-side relation.

### C-PUSH-UNSUBSCRIBE — DELETE /api/push-subscriptions

- Auth/ownership: parent JWT only; strict body `{ endpoint: string }` (or the documented
  `?endpoint=` equivalent). Invalid input → typed 400 `ValidationError`; unauthenticated/non-parent
  → project-standard 403.
- 200: `{ data: { deleted: 0|1 } }`. A missing or foreign endpoint returns `deleted: 0` so no
  other parent's subscription is exposed; an owned endpoint is removed and a retry remains 0.
- Persistence: deletes only the authenticated parent's matching `push_subscriptions` row.

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

---

# MISSION `st-portal-redesign` — contract addendum (2026-07-22, append-only)

Everything above remains binding. This section adds ONLY the surfaces the
`dashbaord-design` metrics genuinely require and cannot already reach.

Design source of truth: `.qa/design/screens/*.html` (114 slices) + `.qa/design/spec/*.md`.
Product vocabulary source of truth: `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md` §3 and
`docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md`, digested in `.qa/intake/docs-constraints.md`.

## Governing rules for every entry below

- **Strapi v5 envelope.** Success `{ "data": ..., "meta": {...} }`, flat entities carrying
  `documentId` (never a numeric `id`, never an `attributes` wrapper).
- **Error envelope.** `{ "data": null, "error": { "status", "name", "message", "details" } }`
  via `@strapi/utils` error classes.
- **Auth.** `Authorization: Bearer <users-permissions JWT>`. Parent role required. Ownership is
  `student.parent.documentId === caller.documentId`; a foreign or unknown child is **404**, never
  403, so the endpoint cannot be used to enumerate other families' children.
- **No composite scores.** `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193` forbid cut scores,
  cross-skill composites and any computed CEFR score. No field below returns one.
- **Single source of truth.** Every shape is defined once as a Zod schema in
  `schooltest-api/src/contracts/` and imported by the controller AND mirrored 1:1 by a Zod schema
  in the web module's `schemas/`. Neither side re-types a shape by hand.

---

## C-DASH-HOUSEHOLD — GET /api/my/progress

> **SUPERSEDED IN PART BY AMENDMENT A1 (at the end of this file). READ A1 BEFORE BUILDING.**
> The per-child `cefrBand`, `cefrStageIndex` and `acaraPhase` fields shown in the v1 payload
> below are DELETED — a single per-child level is a cross-skill composite, forbidden by
> `DOC1:304` and `DOC0:46`. Bands live only in `skills[]`, one entry per skill, and `skills[]`
> IS padded: every skill without an official result appears with `readiness: "not_assessed"`.
> Where this section and A1 disagree, **A1 wins**.

Household + per-child dashboard aggregate. Exists because `/my/students/:documentId/progress` is
strictly per-child (gap **G1**), so the design's dashboard would otherwise need 1+N requests
against a 120 req/min/IP limiter.

**Implements design metrics** (`.qa/design/spec/01-portal-dashboard.md` §10): #1 tests completed,
#3 practice this week, #4 practice-minutes 7-day chart, #5 strongest day, #6 per-child CEFR
journey stage, #7 per-child focus skill; and `.qa/design/spec/02-portal-children.md` `day streak`
and `Level {band}`.

- **Transport:** `GET /api/my/progress`
- **Route file:** `schooltest-api/src/api/student/routes/01-custom-parent-students.ts` (append;
  MUST precede the `/my/students/:documentId` wildcard — it does, different path root)
- **Handler:** `api::student.parent-dashboard.getHouseholdProgress`
- **Auth:** parent JWT required. Grant `parent-dashboard.getHouseholdProgress` → `parent` only,
  registered in `src/bootstrap/permissions-actions.ts`.
- **Request:** no path params. Query: **none accepted** — any query key ⇒ `400 ValidationError`
  (`'household progress does not accept query parameters'`), matching the existing
  `getParentProgress` convention.
- **Success:** `200`

```jsonc
{
  "data": {
    "household": {
      "childCount": 3,                    // active + enrolled children of this parent
      "testsCompleted": 41,               // sessions.status='complete', all children, all time
      "testsCompletedThisWeek": 7,        // same, started_at within the current ISO week (Mon 00:00 local)
      "resultsPublished": 18,             // results.destination='official', all children
      "practiceSecondsThisWeek": 15600,   // SUM(ended_at - started_at), mode='practice', status='complete', current ISO week
      "practiceByDay": [                  // EXACTLY 7 entries, oldest -> newest, trailing 7 days incl. today
        { "date": "2026-07-16", "weekday": "M", "seconds": 2040 }
      ],
      "strongestDay": { "date": "2026-07-19", "weekday": "T", "seconds": 5280 }  // argmax of practiceByDay, null when every day is 0
    },
    "children": [
      {
        "documentId": "abc123…",
        "givenName": "Emma",
        "familyName": "Chen",              // nullable — mononyms exist
        "yearLevel": 7,                    // nullable
        "status": "active",                // active | archived | enrolled
        "testsCompleted": 14,
        "practiceSecondsThisWeek": 5400,
        "practiceDayStreak": 12,           // consecutive calendar days back from today with >=1 complete practice session
        "lastActivityAt": "2026-07-22T08:28:04.544Z",  // max(sessions.ended_at, results.published_at_field); nullable
        "cefrBand": "B1",                  // latest OFFICIAL result band; nullable when never assessed
        "cefrStageIndex": 3,               // 0-based index into CEFR_LADDER; null when cefrBand is null
        "acaraPhase": "Consolidating",     // nullable
        "focusSkill": "speaking",          // see derivation below; null when no skill has an official result
        "skills": [                        // one entry per skill that HAS an official result; never padded
          {
            "skill": "reading",            // reading | listening | speaking | writing
            "cefrBand": "B2",
            "readiness": "met",            // met | approaching | not_yet | not_assessed
            "acaraPhase": "Consolidating",
            "displayLabel": "Critical Reader",   // nullable
            "publishedAt": "2026-07-22T08:28:04.544Z",  // nullable
            "resultDocumentId": "amkb…"    // for deep-linking to C-PARENT-RESULT-VIEW
          }
        ]
      }
    ]
  },
  "meta": {}
}
```

- **`CEFR_LADDER`** is exactly the API enum, in order:
  `["pre_A1","A1","A2","B1","B2","C1"]` (`result/content-types/result/schema.json`,
  `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`). **The design draws six ticks labelled
  `A1 A2 B1 B2 C1 C2`; `C2` does not exist in this system and `pre_A1` does.** The UI renders the
  real ladder with the design's tick visual. Recorded as a design↔data conflict, not silently reconciled.
- **`focusSkill` derivation** (design says "the weakest skill"; the docs forbid a composite %):
  rank each skill's latest official result by `readiness` — `not_yet`(0) < `approaching`(1) <
  `met`(2), `not_assessed` excluded — and take the lowest. Ties break on the lower mean of that
  result's per-attribute `prob` values in `attributes` (the primary datum per
  `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:45`). Still tied ⇒ the skill enum's declaration order.
  No percentage is ever surfaced to the user.
- **Errors:**
  | Status | name | When |
  |---|---|---|
  | `400` | `ValidationError` | any query parameter present |
  | `401` | `UnauthorizedError` | absent/invalid JWT |
  | `403` | `ForbiddenError` | caller role is not `parent` (message: `'Only parents can view household progress'`) |
- **Persistence effect:** none — read-only. Reads `students`, `students_parent_lnk`, `sessions`,
  `results`. No write, no side effect.
- **Implementation constraints:** `strapi.documents()` only; explicit `fields`, never
  `populate:'*'`; one grouped query per aggregate via `Promise.all`, never a per-child loop with
  `await` inside it; `sanitizeOutput` + `transformResponse` in the controller; the response is
  parsed through its own Zod schema before returning, exactly like `getParentProgress` does.

---

## C-PARENT-RESULT-VIEW — GET /api/results/:documentId (parent branch)

**Additive change to an existing endpoint.** Today `result-view.ts` has student/teacher/admin
branches and a parent falls through to `403 'role may not read results (C-4)'` (gap **G2**), so a
parent cannot reach `attributes` — the per-attribute mastery map that the design's "Skills"
section needs.

**Implements** `.qa/design/spec/02-portal-children.md` screen B "Skills" (per-skill bars + grade)
and the child-detail "Recent results" rows.

- **Transport:** `GET /api/results/:documentId` (route already exists; no new route file)
- **Auth:** parent JWT. New grant: `result.getResult` → `parent`.
- **Ownership:** the result's `student.parent.documentId` MUST equal the caller's `documentId`
  **and** `destination` MUST be `official`. Anything else ⇒ `404 NotFoundError` (never 403 — a
  parent must not be able to probe which result ids exist).
- **Success:** `200` with the EXISTING `ResultView` shape from
  `schooltest-api/src/contracts/results.ts` — no new shape, no parent-specific variant. Fields the
  UI consumes: `scope`, `skill`, `attributes` (`{status, prob, prob_se?, items, delta}` per
  attribute code), `display_label`, `acara_phase`, `cefr_band`, `readiness`, `low_confidence`,
  `effort_valid`, `supplementary`, `productive_scores`, `status`, `published_at`.
- **Errors:** `401` no/invalid JWT · `403` role not permitted · `404` unknown id, foreign child,
  or `destination='transient'`.
- **Persistence effect:** none.
- **Security note:** this widens who can read a result row. The verify task for it MUST prove, with
  real requests: parent reads own child's official result → 200; parent reads ANOTHER parent's
  child's result → 404; parent reads own child's transient result → 404; no JWT → 401.

---

## C-CHILD-RESULT-HISTORY — GET /api/my/students/:documentId/results

`recentResults` is hard-capped at 5 with no pagination and no filters (gap **G4**), so the design's
child-detail "Recent results" list and its `Since joining` band delta cannot be built from it.

**Implements** `.qa/design/spec/02-portal-children.md` screen B "Recent results" + `Since joining`.

- **Transport:** `GET /api/my/students/:documentId/results`
- **Route file:** `01-custom-parent-students.ts`, placed **before** `/my/students/:documentId`
  (the wildcard would otherwise swallow it — Strapi v5 GOTCHA 2).
- **Handler:** `api::student.parent-results.listChildResults`
- **Auth:** parent JWT; grant → `parent`. Ownership: unknown/foreign child ⇒ `404`.
- **Request query** (all optional, strictly validated — unknown keys ⇒ `400`):
  | Param | Type | Default | Rule |
  |---|---|---|---|
  | `page` | int ≥ 1 | `1` | |
  | `pageSize` | int 1..50 | `10` | >50 ⇒ `400 ValidationError` |
  | `skill` | enum reading/listening/speaking/writing | — | filters to that skill |
- **Success:** `200`

```jsonc
{
  "data": [
    {
      "documentId": "amkb…",
      "scope": "skill",                    // skill | combined
      "skill": "reading",                  // null when scope='combined'
      "displayLabel": "Critical Reader",   // nullable
      "cefrBand": "B2",                    // nullable
      "acaraPhase": "Consolidating",       // nullable
      "readiness": "met",                  // nullable
      "lowConfidence": false,
      "effortValid": true,
      "status": "complete",                // scoring | partial_pending | complete
      "publishedAt": "2026-07-22T08:28:04.544Z",  // nullable
      "createdAt": "2026-07-22T08:27:51.101Z",    // ALWAYS present — fixes G5's unorderable rows
      "previousResultDocumentId": "x9k…",  // nullable — enables the design's "+N vs {month}" delta
      "sessionDocumentId": "s2z6…"         // nullable — fixes G12
    }
  ],
  "meta": { "pagination": { "page": 1, "pageSize": 10, "pageCount": 4, "total": 37 } }
}
```

- **Scope:** `destination='official'` ONLY. Practice/transient results stay invisible to parents
  (preserves the existing `getParentProgress` boundary; gap **G8** is left open deliberately).
- **Sort:** `published_at_field:desc, createdAt:desc` — same as the existing progress read.
- **Errors:** `400` bad/unknown query · `401` no JWT · `403` non-parent role · `404` unknown or
  foreign child.
- **Persistence effect:** none.

---

## BLOCKED — design metrics with no honest data source

Recorded here so they are visibly refused rather than quietly faked. Each gets a task file whose
terminal state is BLOCKED with this reason.

| id | Design metric | Slice | Why blocked |
|---|---|---|---|
| **B-1** | `coming up` hero stat (`2`) | `portal--main.html:34` | No scheduling model exists anywhere: no `scheduled_at`/`due_at`/`assignment`/`sitting` field on any content-type; `class` is only `{name, year_band, teacher, students}`. Nothing to count. |
| **B-2** | "Coming up" list (3 dated rows) | `portal--main.html:120-140` | Same as B-1. |
| **B-3** | `last result` `74%` | `portal--my-children-list.html:27` | A single percentage across a sitting is a composite score. `DOC0_PLATFORM_PRD_V2.md:25,46` — "no cut scores", "no cross-skill composite score anywhere in the system". The slot renders CEFR band + readiness + date instead. |
| **B-4** | `Progress to {next} 68%` | `portal--my-children-list.html:23`, `portal--child-detail.html:20` | Requires band-entry thresholds and a CEFR score. `DOC0_PLATFORM_PRD_V2.md:193` — "Do not build a CEFR scorer". CEFR is a Crosswalk lookup, not a scale. |
| **B-5** | `Avg. score 86%`, `Trend +4%`, `Of grade Top 15%` | `app--child-profile.html:29-31` | Composite + cohort percentile. No cohort/percentile data is parent-reachable and composites are forbidden. |
| **B-6** | Subject bars Math/Danish/English, class average, letter grade | `app--child-profile.html`, `app--result-detail.html` | These slices are a generic school-test composition, not SchoolTest's domain. The product measures four English skills (reading/listening/speaking/writing) against CEFR/ACARA — there are no subjects, no letter grades, no class averages in the data model. |
| **B-7** | `Family plan covers up to 4`, all billing/credits/invoices | `portal--billing.html`, `app--buy-credits/checkout/receipt/auto-top-up` | No payment, credit, invoice, plan or subscription content-type exists and no payment provider is configured. |
| **B-8** | Per-child unread notification count | `portal--notifications.html` | `unread-count` is a single global scalar and the feed deliberately withholds `studentDocumentId` (gap **G13**). |

---

## AMENDMENT A1 — `C-DASH-HOUSEHOLD` v2 (2026-07-22, before any implementation)

`.qa/intake/RECONCILIATION.md` §2.3 row 22 and §2.7 identified a **product-law violation in v1 of
this contract, authored above**. Correcting it now, while zero code depends on it.

**The defect.** v1 returned, per child, a single top-level `cefrBand` + `cefrStageIndex` +
`acaraPhase`. A single per-child level is a **cross-skill composite**, which
`docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:304` forbids outright — *"There are no cross-skill
composite fields. The combined placement report renders the four skill Results side by side"* —
and `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:46` restates: *"there is no cross-skill composite
score anywhere in the system."* v1 would have shipped exactly the number the product forbids,
which is the same defect class as faking data.

**The correction — v2 is authoritative; v1 above is superseded:**

1. **DELETE** the per-child `cefrBand`, `cefrStageIndex` and `acaraPhase` fields. There is no
   per-child level. Full stop.
2. **KEEP** `skills[]`, which already carries `cefrBand` / `readiness` / `acaraPhase` **per
   skill** — the sanctioned shape. It is now the ONLY place a band appears.
3. `skills[]` MUST be built from a proper `GROUP BY skill` over all official results
   (`latestBySkill`), **not** from the 5-row `recentResults` window — gap **G4** makes that
   window lossy, so a skill can silently vanish.
4. **ADD** an explicit entry for every skill with no official result, carrying
   `readiness: "not_assessed"` and null band. `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md`
   §3.16/3.18 make `not_assessed` a first-class value — a missing skill must render as
   "not assessed", never be omitted and never be inferred as weak.
5. `focusSkill` **stays**, and is computed ONLY by ranking the ordinal `readiness` enum
   (`not_yet` < `approaching` < `met`; `not_assessed` excluded). It performs no probability
   arithmetic and surfaces no number. Rationale, recorded so a human can overrule it: the
   forbidden thing is averaging probabilities into a precise-looking composite
   (`DIAGNOSTIQ_CONSTRUCT_MAPPING_V2:394`); comparing two ordinal enums to name a focus area is
   not that, and the design explicitly specifies the metric.

**UI consequence for W5/W6.** The design's per-child CEFR tick rail becomes **one rail per skill**
(reading, listening, speaking, writing), each over the real ladder
`pre_A1 → A1 → A2 → B1 → B2 → C1`. The design's single rail labelled `A1…C2` is not buildable:
it is both a composite and a wrong ladder (the system has `pre_A1` and has no `C2`).

## BLOCKED — additions from the reconciliation pass

| id | Design metric | Slice | Why blocked |
|---|---|---|---|
| **B-9** | Per-child single `Level B1` pill | `portal--my-children-list.html:20`, `portal--child-detail.html:18` | Cross-skill composite — `DOC1:304`, `DOC0:46`. Superseded by per-skill bands (Amendment A1). |
| **B-10** | Hero prose `on track for B2`, `improved reading by 9% since May` | `portal--main.html` hero | Forward projection has no field, and a percent delta is raw probability arithmetic that `DIAGNOSTIQ_CONSTRUCT_MAPPING_V2:72` replaces with factual transition statements. Honest substitute: a per-skill band transition between two same-skill results. |
| **B-11** | School `rating` `4.9` (cards + map tile) | `portal--main.html` school cards | `SchoolHit` (`schooltest-api/src/contracts/search-domains.ts:60-91`) has no rating/review field and there is no `reviews` content-type. The schema is **strict**, so an extra key fails contract validation and 500s (`search-schools.ts:145`). |
| **B-12** | Copy `{n} schools across Australia **accept SchoolTest placement**` | `portal--main.html` search header | No school attribute records placement acceptance. The count is servable; the claim is not. The copy must state only what the field supports. |

## Servability roll-up (from `.qa/intake/RECONCILIATION.md` §2.7)

**22 SERVABLE · 7 NEEDS-BACKEND (all collapsing into `C-DASH-HOUSEHOLD`) · 27 BLOCKED.**

The design's parent dashboard is drawn on an average-score / percent-progress / credits /
scheduling model that SchoolTest does not have and, for the score parts, explicitly forbids. The
navy hero can ship **1 of its 3 stats** truthfully today (`tests completed`; `practice this week`
arrives with `C-DASH-HOUSEHOLD`; `coming up` is B-1). Every other slot is re-expressed in the
sanctioned vocabulary: `display_label`, `cefr_band`, `readiness`, `attribute_status`,
`not_assessed`, and evidence counts.
