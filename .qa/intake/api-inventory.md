# api-inventory.md — EXISTING Strapi API surface a logged-in PARENT can consume

Read-only intake. Source of truth = CODE in `/home/hnr/Code/schooltest/schooltest-api`
(Strapi 5.50.1, Postgres, users-permissions JWT). Every claim below cites `file:line`.
Docs (`.qa/CONTRACTS.md` in all three repos) were read and are treated as SECONDARY;
disagreements are listed in **§ DOC vs CODE DISAGREEMENTS**.

---

## 0. How parent access is actually decided (three independent layers)

1. **Route registration.** Custom routes live in `src/api/*/routes/01-custom-*.ts` and load
   BEFORE the core router (`src/api/student/routes/01-custom-parent-students.ts:1-17`).
   Every parent-facing route omits `auth`, i.e. a users-permissions JWT is REQUIRED
   (`.claude/rules/routes.md`: "Auth is ENABLED by default when `auth` is omitted").
   No parent-facing route declares any `policies` — all are `config: { policies: [], middlewares: [] }`.
2. **users-permissions grant** — the role→action matrix in
   `src/bootstrap/permissions-actions.ts:111-153`. An action NOT in `ROLE_ACTIONS.parent`
   403s before the handler runs. The exact parent list is `permissions-actions.ts:144-152`.
3. **Controller/service re-assertion** (defence in depth, the repo's "C-11 convention") —
   e.g. `src/utils/parent-student-read-actions.ts:57-60`, `src/api/student/controllers/parent-progress.ts:21-23`,
   `src/utils/notification-caller.ts:54-60`, `src/api/search/controllers/search.ts:59-63`.

**Global middleware applied to every request:** `global::rate-limit`
(`config/middlewares.ts:52-58` → `src/middlewares/rate-limit.ts:22-52`) — in-memory fixed
window keyed by client IP, `RATE_LIMIT_MAX` default **120 requests / 60 000 ms**; over budget
throws `RateLimitError` → **429** with a `Retry-After` header. CORS is limited to
`FRONTEND_ORIGIN` (`config/middlewares.ts:5-11,31-37`). `strapi::body` parses
POST/PUT/PATCH **and DELETE** (`config/middlewares.ts:39-50`) — this is what makes the
DELETE-with-body unsubscribe form work.

**Error envelope** (Strapi v5, `.claude/rules/rest-api.md`):
`{ "data": null, "error": { "status": <n>, "name": "<Class>", "message": "<msg>", "details": {…} } }`.

### 0.1 The complete parent grant list (verbatim from `permissions-actions.ts:144-152`)

```
api::student.student.find                          (INERT — see §3.1)
api::student.student.findOne                       (INERT — see §3.1)
api::student.student.create
api::student.student.findMyStudents
api::student.student.findMyStudent
api::student.parent-progress.getParentProgress
api::student.student.update
api::student.student.archive
api::student.student.unarchive
api::student-magic-link.student-magic-link.requestMagicLink   (INERT — route is auth:false)
api::student-magic-link.student-magic-link.issueMagicLink
api::search.search.students
plugin::users-permissions.user.me
plugin::users-permissions.user.updateMe
plugin::users-permissions.auth.changePassword
plugin::upload.content-api.upload
api::search.search.schools
api::search.search.agents
api::search-preference.search-preference.getMine
api::search-preference.search-preference.updateMine
+ NOTIFICATION_SURFACE_ACTIONS (9, permissions-actions.ts:77-81):
  api::notification.notification.findMine | .unreadCount | .markAllRead | .markRead
  api::notification-preference.notification-preference.getMine | .updateMine
  api::push-subscription.push-subscription.vapidPublicKey | .subscribe | .unsubscribe
```

---

## 1. SUMMARY TABLE — every endpoint a logged-in parent can reach

| # | METHOD + full path | Handler action | Also granted to | Reachable? |
|---|---|---|---|---|
| 1 | `GET /api/my/students` | `api::student.student.findMyStudents` | parent only | yes |
| 2 | `GET /api/my/students/:documentId` | `api::student.student.findMyStudent` | parent only | yes |
| 3 | `GET /api/my/students/:documentId/progress` | `api::student.parent-progress.getParentProgress` | parent only | yes |
| 4 | `POST /api/students` | `api::student.student.create` | parent + admin (role-branched) | yes |
| 5 | `PUT /api/students/:documentId` | `api::student.student.update` | parent + admin (role-branched) | yes |
| 6 | `POST /api/students/:documentId/archive` | `api::student.student.archive` | parent only | yes |
| 7 | `POST /api/students/:documentId/unarchive` | `api::student.student.unarchive` | parent only | yes |
| 8 | `POST /api/students/:documentId/magic-link` | `api::student-magic-link.student-magic-link.issueMagicLink` | parent only | yes |
| 9 | `GET /api/search/students?q=` | `api::search.search.students` | parent + admin | yes |
| 10 | `POST /api/search/schools` | `api::search.search.schools` | parent + admin | yes |
| 11 | `POST /api/search/agents` | `api::search.search.agents` | parent + admin | yes |
| 12 | `GET /api/search-preferences/me` | `api::search-preference.search-preference.getMine` | parent only | yes |
| 13 | `PUT /api/search-preferences/me` | `api::search-preference.search-preference.updateMine` | parent only | yes |
| 14 | `GET /api/notifications` | `api::notification.notification.findMine` | parent/teacher/student/admin | yes |
| 15 | `GET /api/notifications/unread-count` | `api::notification.notification.unreadCount` | all 4 app roles | yes |
| 16 | `POST /api/notifications/read-all` | `api::notification.notification.markAllRead` | all 4 app roles | yes |
| 17 | `PUT /api/notifications/:documentId/read` | `api::notification.notification.markRead` | all 4 app roles | yes |
| 18 | `GET /api/notification-preferences/me` | `…notification-preference.getMine` | all 4 app roles | yes |
| 19 | `PUT /api/notification-preferences/me` | `…notification-preference.updateMine` | all 4 app roles | yes |
| 20 | `GET /api/push-subscriptions/vapid-public-key` | `…push-subscription.vapidPublicKey` | all 4 app roles | yes |
| 21 | `POST /api/push-subscriptions` | `…push-subscription.subscribe` | all 4 app roles | yes |
| 22 | `DELETE /api/push-subscriptions` | `…push-subscription.unsubscribe` | all 4 app roles | yes |
| 23 | `GET /api/users/me` | `plugin::users-permissions.user.me` (wrapped) | parent + teacher | yes |
| 24 | `PUT /api/users/me` | `plugin::users-permissions.user.updateMe` (spliced) | parent only | yes |
| 25 | `POST /api/auth/change-password` | `plugin::users-permissions.auth.changePassword` (wrapped) | parent only (custom roles) | yes |
| 26 | `POST /api/upload` | `plugin::upload.content-api.upload` (stock) | parent only (custom roles) | yes |

**Granted but NOT reachable (inert):** `api::student.student.find` / `.findOne` — the core
router gates them with `global::is-teacher` (+ `api::student.is-owned-teacher`)
(`src/api/student/routes/student.ts:11-12`), so a parent JWT 403s at the policy layer.
`…student-magic-link.requestMagicLink` — that route carries `auth: false`
(`src/api/student-magic-link/routes/01-custom-student-magic-link.ts:26`), so the grant is
documented as inert in `permissions-action-refs.ts:105-107`.

---

## 2. PER-ENDPOINT CONTRACTS

Legend for "DB rows": `strapi.documents(...)` Document-Service reads/writes.

---

### 1. `GET /api/my/students`

- **Route** `src/api/student/routes/01-custom-parent-students.ts:20-25`. `policies: []`, auth required.
- **Auth/role** grant `api::student.student.findMyStudents` (parent only,
  `permissions-actions.ts:145`); controller re-asserts `role.type === 'parent'` AND
  `caller.documentId` present (`src/utils/parent-student-read-actions.ts:57-60`).
- **Policy** none.
- **Query** standard Strapi query, passed through `validateQuery` + `sanitizeQuery`
  (`parent-student-read-actions.ts:62-63`), then:
  - `pagination[page]` (int, default 1, floored at 1) and `pagination[pageSize]`
    (int, default 25, **clamped to ≤ 100**) — `parent-student-read-actions.ts:67-69`.
  - `sort` — free-form Strapi sort; default `createdAt:desc` (`:90`).
  - `filters[...]` — caller filters are `$and`-ed with the forced ownership filter, so
    they can only NARROW (`:75-81`). If the caller passes **no top-level `status` key**,
    `{ status: { $ne: 'archived' } }` is added; if they DO pass `filters[status]`, that
    replaces the default archived-exclusion (`:76-80`).
  - No body.
- **Ownership rule** server-forced `{ parent: { documentId: { $eq: caller.documentId } } }`
  applied AFTER `sanitizeQuery` (`:66,78`) — sanitizeQuery strips filters on the restricted
  `parent` relation, so applying it post-sanitize is what prevents a cross-tenant leak.
- **Success 200** `this.transformResponse(rows, { pagination })` → `{ data: [...], meta: { pagination: { page, pageSize, pageCount, total } } }`.
  Each item carries the `fields` whitelist (`:85-88`) plus `documentId`:
  `given_name, family_name, year_level, nationality, current_year_level, target_entry_year,
  target_entry_term, status, email, createdAt, updatedAt`.
  `email` falls back to the linked users-permissions user's email, then the `user` relation is
  DROPPED from the payload (`:97-100`). The numeric `id` is **not** explicitly stripped here
  (contrast the notification service, which does strip it deliberately —
  `src/api/notification/services/notification.ts:110-123`).
- **Errors**
  - `403` `ForbiddenError` `"Only parents can list their students"` — non-parent role or missing documentId (`:58-60`).
  - `400` `ValidationError` — invalid query rejected by `validateQuery`.
  - `429` `RateLimitError` `"Too many requests, please slow down."` (global limiter).
- **DB** reads `students` (+ `up_users` via the `user` populate). No writes.

---

### 2. `GET /api/my/students/:documentId`

- **Route** `01-custom-parent-students.ts:34-41` — deliberately registered AFTER the
  `/progress` route so the wildcard cannot swallow it (`:27-33`).
- **Auth/role** grant `api::student.student.findMyStudent` (parent only,
  `permissions-actions.ts:146`); re-asserted at `parent-student-read-actions.ts:113-116`.
- **Policy** none.
- **Params** `documentId` (path). No query is consumed, no body.
- **Ownership rule** `findFirst({ filters: { documentId, parent: { documentId: { $eq: caller } } } })`
  (`:119-123`) — a FOREIGN or UNKNOWN documentId both match no row ⇒ **404** (deliberate
  non-disclosure for the `/my/*` READ scope).
- **Success 200** `{ data: {...}, meta: {} }`. `fields` = `STUDENT_DETAIL_FIELDS`
  (`src/api/student/services/parent-student-schemas.ts:106-112`):
  `given_name, family_name, year_level, email, date_of_birth, gender, nationality,
  current_school, current_year_level, target_entry_year, target_entry_term,
  parent_guardian_name, parent_guardian_email, parent_guardian_phone,
  parent_guardian_wechat, preferred_contact_channel, status, createdAt, updatedAt`
  + `documentId`, PLUS `populate: { photo: true, voice_intro: true }` (`:122`) → full upload
  media objects (or `null`). `passport_number` is `private: true`
  (`src/api/student/content-types/student/schema.json:89-92`) and is stripped by `sanitizeOutput`.
- **Errors**
  - `403` `ForbiddenError` `"Only parents can view their students"` (`:115`).
  - `404` `NotFoundError` `"Student <documentId> not found"` (`:124`).
  - `429` global limiter.
- **DB** reads `students`, `files` + `files_related_mph` (media populate). No writes.

---

### 3. `GET /api/my/students/:documentId/progress`  ← the only parent aggregate today

- **Route** `01-custom-parent-students.ts:26-33`.
- **Auth/role** grant `api::student.parent-progress.getParentProgress`
  (`permissions-action-refs.ts:137`, granted at `permissions-actions.ts:146`) — parent only;
  re-asserted `src/api/student/controllers/parent-progress.ts:21-23`.
- **Policy** none.
- **Params** `documentId` — must match `/^[a-z0-9]{24}$/i`
  (`src/contracts/parent-child-progress.ts:7-9`).
- **Query** **NONE ACCEPTED**: `Object.keys(ctx.query).length > 0` ⇒ 400
  (`parent-progress.ts:24-26`). No body.
- **Ownership rule** `findFirst({ filters: { documentId, parent: { documentId: { $eq: caller } } } })`
  (`src/api/student/services/parent-progress.ts:115-122`) — foreign/unknown ⇒ 404.
- **Success 200** `{ data, meta: {} }` where `data` is validated TWICE against
  `parentChildProgressDataSchema` (service `:147-151`, controller `:35-40`):
  ```
  data.student = { documentId, given_name|null, family_name|null, year_level:int|null,
                   nationality|null, current_year_level|null, target_entry_year|null,
                   target_entry_term|null, status: 'active'|'archived'|'enrolled',
                   createdAt: ISO, updatedAt: ISO }
  data.metrics = { totalSessions:int≥0, completedSessions:int≥0,
                   activeSessions:int≥0, officialResults:int≥0 }
  data.recentResults = [ ≤5 × { documentId, skill: reading|listening|speaking|writing|null,
                   displayLabel: string|null, cefrBand: pre_A1|A1|A2|B1|B2|C1|null,
                   readiness: met|approaching|not_yet|not_assessed|null,
                   status: scoring|partial_pending|complete, publishedAt: ISO|null } ]
  ```
  Metric definitions (`parent-progress.ts:124-145`):
  `totalSessions` = COUNT sessions for the child; `completedSessions` = `status = 'complete'`;
  `activeSessions` = `status = 'in_progress'`; `officialResults` = COUNT results where
  `destination = 'official'`. `recentResults` = official results only, sorted
  `published_at_field:desc, createdAt:desc`, `limit: 5`.
- **Errors**
  - `400` `ValidationError` `"child progress does not accept query parameters"` (`parent-progress.ts:26`).
  - `400` `ValidationError` `"invalid child progress document id"` with
    `details.fields:['documentId']`, `details.issues:[…]` (`parent-progress.ts` service `:65-72`).
  - `403` `ForbiddenError` `"Only parents can view child progress"` (`parent-progress.ts:22`).
  - `404` `NotFoundError` `"student not found"` (service `:122`).
  - `500` `ApplicationError` `"child progress response failed contract validation"` /
    `"…failed output sanitization"` — internal key-leak guard (service `:105`, controller `:37`).
  - `429` global limiter.
- **DB** reads `students`, `sessions` (3 × COUNT), `results` (1 × COUNT + 1 × findMany). No writes.

---

### 4. `POST /api/students`  (shadows the core POST)

- **Route** `01-custom-parent-students.ts:42-47`.
- **Auth/role** grant `api::student.student.create` (parent, `permissions-actions.ts:145`;
  admin holds it via `ADMIN_CRUD_UIDS`). Controller role-branches
  (`src/api/student/controllers/student.ts:78-84`): parent → validated parent path;
  admin → untouched `super.create` (**201**); any other role → `ForbiddenError` (403).
- **Policy** none (the shadowed core route's `IS_ADMIN` policy is bypassed by design).
- **Body** `{ "data": { … } }`. Keys `parent, teacher, class, user, student_key, status` are
  DELETED before validation (`student.ts:41-43,91`). Remainder is parsed by
  `parentStudentCreateSchema` (`parent-student-schemas.ts:58-84`) — unknown keys stripped:
  | field | type / rule | required |
  |---|---|---|
  | `given_name` | string 1..100 | **yes** |
  | `family_name` | string 1..100 | no |
  | `year_level` | int 7..12 | no |
  | `email` | email | no |
  | `date_of_birth` | `YYYY-MM-DD`, real date, not future, year ≥ 1900 | no |
  | `gender` | `male\|female\|other\|prefer_not_to_say` | no |
  | `nationality` | string 1..100 | **yes** |
  | `passport_number` | string ≤50 | no |
  | `current_school` | string ≤255 | no |
  | `current_year_level` | enum `Prep, Year 1 … Year 12` (13 values) | no |
  | `target_entry_year` | 4-digit string, 2000 ≤ y ≤ currentYear+10 | **yes** |
  | `target_entry_term` | string 1..50 | **yes** |
  | `parent_guardian_name` | string 1..200 | **yes** |
  | `parent_guardian_email` | email | no |
  | `parent_guardian_phone` | string 1..50 | **yes** |
  | `parent_guardian_wechat` | string ≤100 | no |
  | `preferred_contact_channel` | `whatsapp\|wechat\|email\|sms` | no |
  | `photo` | positive int (upload file **numeric id**) or `null` | no |
  | `voice_intro` | positive int or `null` | no |
- **Server media gate** `src/api/student/services/parent-media.ts:51-88`: for each numeric
  `photo`/`voice_intro`, the upload file must exist and carry mime prefix `image/` (photo,
  ≤ 15360 KB) / `audio/` (voice_intro, ≤ 10240 KB). `null`/absent skips the gate.
- **Ownership rule** `parent: caller.documentId` and `status: 'active'` are injected into the
  Document-Service create AFTER `sanitizeInput` (`student.ts:104-114`) — a client-sent
  `status` or `parent` is inert.
- **Success 200 (parent path)** `{ data: { …sanitized row…, parent: { documentId: <caller> } }, meta: {} }`
  — the `parent` relation is re-attached post-sanitize (`student.ts:119-122`).
  **201 (admin path)** — core `{ data, meta }`.
- **Errors**
  - `400` `ValidationError` `"invalid student payload"`, `details.fields[]` + `details.issues[]`
    (`src/api/student/services/student.ts:27-35,77`).
  - `400` `ValidationError` `"invalid student media"`, same details shape (`parent-media.ts:86`).
  - `403` `ForbiddenError` `"Forbidden"` — teacher/student (`student.ts:82`).
  - `429` global limiter.
- **DB** INSERT `students` (parent FK = caller, `status='active'`), `files_related_mph` rows
  when media ids present; ALSO writes a `notifications` row via
  `notifyStudentCreated` (`student.ts:121` → `src/services/notifications/notify.ts:163-172`,
  event `student_created`, category `children`) and may write email/push channel flags.

---

### 5. `PUT /api/students/:documentId`  (shadows the core PUT)

- **Route** `01-custom-parent-students.ts:48-56`.
- **Auth/role** grant `api::student.student.update` (`permissions-actions.ts:146`); admin
  falls through to `super.update` after bridging `ctx.params.id = ctx.params.documentId`
  (`student.ts:137-144`); other roles → 403.
- **Body** `{ "data": { … } }` → `parentStudentUpdateSchema` = the create schema `.partial()`
  (`parent-student-schemas.ts:96`) — identical per-field rules, everything optional. Same
  stripped keys and same media gate. `undefined` keys are dropped so absent fields stay
  unchanged; an explicit `null` on `photo`/`voice_intro` CLEARS (`student.ts:87-95`).
- **Ownership rule** `assertParentOwnership` (`src/api/student/services/student.ts:43-68`):
  `findOne` + populate `parent.documentId`; missing ⇒ **404** `"Student <id> not found"`;
  owner mismatch ⇒ **403** with `name: 'ForbiddenError'`, message
  `"You do not own this student"` (thrown as `PolicyError` and renamed so Strapi's
  `authorize` middleware forwards the message verbatim — `:56-65`).
- **Success 200** `{ data: { …sanitized updated row…, parent: { documentId: <caller> } }, meta: {} }`.
- **Errors** `400 invalid student payload` / `400 invalid student media` / `403 Forbidden`
  (wrong role) / `403 You do not own this student` / `404` / `429`.
- **DB** UPDATE `students`; `files_related_mph` adjusted on media change. No notification fired.

---

### 6 & 7. `POST /api/students/:documentId/archive` · `POST /api/students/:documentId/unarchive`

- **Route** `01-custom-parent-students.ts:57-70`.
- **Auth/role** grants `…student.archive` / `…student.unarchive`, **parent only**
  (`permissions-actions.ts:146-147`); controller hard-403s any other role
  (`student.ts:176,190`) — admin included.
- **Params** `documentId`. No body, no query.
- **Ownership rule** same `loadOwnedStudent` (404 missing / 403 `"You do not own this student"`).
- **Behaviour** `setStudentStatus` (`src/api/student/services/student.ts:108-120`) — flips
  `status` to `'archived'` / `'active'` ONLY when it differs; already-target returns the
  existing row with **no write** (idempotent, `updatedAt` unchanged).
- **Success 200** `{ data: { …row…, parent: { documentId: <caller> } }, meta: {} }`.
- **Errors** `403 Forbidden` / `403 You do not own this student` / `404` / `429`.
- **DB** conditional UPDATE `students.status`. No timeline-event row exists in this repo.

---

### 8. `POST /api/students/:documentId/magic-link`

- **Route** `src/api/student-magic-link/routes/01-custom-student-magic-link.ts:16-21`.
- **Auth/role** grant `…issueMagicLink` (parent, `permissions-actions.ts:147`); controller
  re-asserts `role.type === 'parent'` with a users-permissions user-service fallback for a
  JWT that did not carry `role` (`src/api/student-magic-link/controllers/student-magic-link.ts:194-207`).
- **Ownership rule** student must exist (404 `"Student not found"`, `:217-219`) AND
  `student.parent.documentId === caller.documentId` (403
  `"Only the owning parent can issue a magic link for this student"`, `:220-222`).
- **Success 200** BARE body `{ "ok": true }` (no `data`/`meta` envelope) — `:246`.
- **Errors**
  - `400` `ValidationError` `"Student has no email on file"` (`:225-227`).
  - `403` `ForbiddenError` `"Only parents can issue student magic links"` (`:206`) or the
    owner-mismatch message above.
  - `404` `NotFoundError` `"Student not found"`.
  - `429` `RateLimitError` from `checkRateLimit` (`:230`) — in addition to the global limiter.
- **DB** reads `students` (+ `user`, `parent` populate); INSERT `student_magic_links` row
  (`createToken`, `:231-235`); best-effort SMTP send (a send failure is logged, never fatal, `:242-244`).

---

### 9. `GET /api/search/students?q=`

- **Route** `src/api/search/routes/01-custom-search.ts:12-18` (no content-type backs this api).
- **Auth/role** grant `api::search.search.students` (parent + admin,
  `permissions-actions.ts:148` / `:121`); controller re-asserts
  `role ∈ {parent, admin}` AND `caller.documentId` (`src/api/search/controllers/search.ts:59-63`).
- **Query** `q` — optional string, `trim()`ed then **clamped to 80 chars** (`:65`). Empty ⇒
  the caller's 10 most recent students. No other query key is read. No body.
- **Ownership rule** for a **parent** caller the filter
  `{ parent: { documentId: { $eq: caller.documentId } } }` is forced (`:68-70`);
  an **admin** caller is UNSCOPED (searches every student).
- **Matching** `$or` over `given_name`, `family_name`, `email` with `$containsi`
  (Postgres ILIKE) (`:71-77`). Sort `createdAt:desc`, `limit` HARD-CLAMPED to **10** (`:84`).
- **Success 200** BARE body (this controller is a plain factory — no `transformResponse`):
  `{ data: [ { documentId, given_name, family_name, year_level, email, createdAt, updatedAt } ],
  meta: { query: { q, count } } }` (`:79-95`). `email` falls back to the linked user's email,
  then the `user` relation is dropped (`:89-92`).
- **Errors** `403` `ForbiddenError` `"Only parents and admins can search students"` (`:62`); `429`.
- **DB** reads `students` + `up_users`. No writes.

---

### 10. `POST /api/search/schools`

- **Route** `01-custom-search.ts:22-27`.
- **Auth/role** grant `api::search.search.schools` (parent + admin); controller re-asserts
  (`search.ts:105-110`).
- **Body** STRICT Zod object (`src/contracts/search-domains.ts:32-51`) — **any unknown key ⇒ 400**:
  `q?: string 1..200 (trimmed)`, `states?: AU_STATES[] 1..8` (`QLD,NSW,VIC,SA,WA,TAS,NT,ACT`),
  `schoolTypes?: (combined|primary|secondary)[] 1..3`,
  `sectors?: (government|non-government|catholic)[] 1..3`,
  `levels?: (primary|junior_secondary|senior_secondary)[] 1..3`,
  `atarAvailable?: bool`, `englishLanguageSupport?: bool`, `scholarshipAvailable?: bool`,
  `feeMin?: int 0..1000000`, `feeMax?: int 0..1000000` (refine: `feeMin ≤ feeMax`),
  `sortBy?: relevance|name-asc|name-desc|fee-asc|fee-desc` (default `relevance`),
  `page?: int 1..10000` (default 1), `pageSize?: int 1..50` (default **12**).
- **Ownership rule** NONE — schools are shared reference data (`search.ts:99-104`).
- **Success 200** BARE `{ data: SchoolHit[], meta: { pagination: { page, pageSize, pageCount, total } } }`,
  re-validated against `searchSchoolsResponseSchema` (`src/api/search/services/search-schools.ts:143-147`).
  `SchoolHit` (STRICT, `search-domains.ts:60-91`): `documentId, slug, name, cricosCode|null,
  suburb|null, state|null, postcode|null, schoolType|null, sector|null, levelsOffered|null,
  hasPrimary, hasJuniorSecondary, hasSeniorSecondary, yearLevelBands[], atarAvailable,
  elicosEslSupport, scholarshipAvailable, primaryAnnualTuition|null, juniorSecAnnualTuition|null,
  seniorSecAnnualTuition|null, annualTuitionFrom|null, cricosStatus|null,
  coverImage: { url, alternativeText|null, width|null, height|null }|null, latitude|null, longitude|null`.
- **Errors** `400` `ValidationError` `"invalid search payload"` + `details.fields/issues`
  (`search-schools.ts:42-56`); `403` `"Only parents and admins can search schools"` (`search.ts:109`);
  `500` `ApplicationError` `"school search response failed contract validation"` (`:145`); `429`.
- **DB** reads `schools` (+ `files` for `coverImage`). Fee filter/sort runs an extra
  findMany capped at 5000 rows (`search-schools.ts:34,79-100`). No writes.

---

### 11. `POST /api/search/agents`

- **Route** `01-custom-search.ts:31-36`. Grant `api::search.search.agents` (parent + admin);
  re-asserted `search.ts:125-130`.
- **Body** STRICT (`search-domains.ts:160-168`): `q?: 1..200`,
  `countriesServed?: string[] 1..20`, `languages?: string[] 1..20`,
  `services?: (counselling|application|visa|scholarship|english_prep|accommodation|under18_welfare|post_arrival)[] 1..8`,
  `sortBy?: relevance|experience|name_asc|name_desc|recently_verified`,
  `page?: 1..10000`, `pageSize?: 1..50` (default **12**). Unknown key ⇒ 400.
- **Ownership rule** NONE. A hard data gate is unconditional:
  `status = 'verified' AND publicProfileEnabled = true`
  (`src/api/search/services/search-agents.ts:90-94`).
- **Success 200** BARE `{ data: AgentHit[], meta: { pagination: {page,pageSize,pageCount,total} } }`.
  `AgentHit` (STRICT, `search-domains.ts:177-192`): `documentId, slug|null, name,
  photoUrl|null, headline|null, roleTitle|null, countriesServed[], languages[],
  specialties[], yearsExperience:int≥0|null, verified, qeacValidationStatus:
  none|pending|verified, partnerSchoolsCount:int, completeness:int`.
  Agent `email` is `private: true` and never read (`search-agents.ts:33`).
- **Errors** `400 "invalid search payload"`; `403 "Only parents and admins can search agents"`; `429`.
- **DB** reads `agents` + its 4 repeatable components. No writes.

---

### 12 & 13. `GET /api/search-preferences/me` · `PUT /api/search-preferences/me`

- **Route** `src/api/search-preference/routes/01-custom-search-preference.ts:15-28`. The core
  router is `only: []` (`routes/search-preference.ts:12-14`) so these two are the ONLY surface.
- **Auth/role** grants `…getMine` / `…updateMine`, **parent only**
  (`permissions-actions.ts:150`); controller re-asserts (`controllers/search-preference.ts:41-44,60-63`).
- **Ownership rule** target is ALWAYS `ctx.state.user` — no id param, no client-supplied owner.
  Get-or-create by `findFirst({ filters: { user: { documentId: { $eq: caller } } } })`
  (`services/search-preference.ts:81-102`); the `user` relation is connected by **numeric id**.
- **PUT body** STRICT partial (`search-domains.ts:118-136`) — unknown key ⇒ 400:
  `default_states?: AU_STATES[] ≤8 (deduped)`, `default_school_types?: […] ≤3 (deduped)`,
  `default_sectors?: […] ≤3 (deduped)`, `default_sort?: SCHOOL_SORT_KEYS`,
  `default_page_size?: int 1..50`, `default_fee_min?: int 0..1000000|null`,
  `default_fee_max?: int 0..1000000|null` (refine: min ≤ max when both non-null).
  Empty / all-undefined body ⇒ current row returned unchanged, **no write** (`:133`).
- **Success 200** BARE `{ data: SearchPreferenceView }` — **no `meta` member**:
  `{ documentId, default_states[], default_school_types[], default_sectors[], default_sort,
  default_page_size, default_fee_min|null, default_fee_max|null, createdAt, updatedAt }`
  (`services/search-preference.ts:15-39,51-66`). The `user` relation is NEVER returned.
  First read lazily creates the default row: `[] [] []`, `relevance`, `12`, `null`, `null` (`:91-100`).
- **Errors** `403` `ForbiddenError` `"Only parents can read/update search preferences"`;
  `400` `ValidationError` `"invalid search preferences"` + `details.fields/issues`
  (`controllers/search-preference.ts:25-31`); `429`.
- **DB** reads/INSERTs/UPDATEs `search_preferences` (exactly one row per user).

---

### 14. `GET /api/notifications`

- **Route** `src/api/notification/routes/01-custom-notification.ts:18-23`. Core router is
  `only: []` (`routes/notification.ts:12-14`).
- **Auth/role** grant `api::notification.notification.findMine` — held by **all four app
  roles** (`permissions-actions.ts:77-81`, N-ROLE-ACCESS); re-asserted via
  `assertNotificationCaller` (`src/utils/notification-caller.ts:54-60`).
- **Query** read straight off `ctx.query` (NOT Strapi `filters[]` syntax) —
  `src/api/notification/controllers/notification.ts:57-63`:
  - `page` int ≥1 (default 1); `pageSize` int 1..**100** (default **20**).
  - `read` — the literal strings `"true"` (⇒ `readAt $notNull`) or `"false"`
    (⇒ `readAt $null`); anything else ⇒ **400** `"read must be \"true\" or \"false\""` (`:20-26`).
  - `category` — one of `account, security, children, testActivity, testResults`;
    anything else ⇒ **400** `"category must be one of: …"` (`:17,29-36`).
  - `eventType` — free-form string, `$eq` matched (`:63`, service `:95`).
- **Ownership rule** server-forced `{ user: { documentId: { $eq: caller.documentId } } }`
  on every query (`src/api/notification/services/notification.ts:79-81,92`). Callers never
  supply an owner.
- **Success 200** `transformResponse` → `{ data: [...], meta: { pagination: { page, pageSize,
  pageCount, total }, unreadCount } }` (`controllers/notification.ts:70-75`). `pageCount = 0`
  when `total = 0`. Each row is EXACTLY the ten-key whitelist (numeric `id` explicitly
  dropped — `services/notification.ts:110-123`):
  `documentId, eventType, category, title, body|null, priority (high|medium|low),
  readAt|null, linkUrl|null, createdAt, updatedAt`.
  `emailSent/emailSentAt/smsSent/smsSentAt/pushSent/pushSentAt/smsBlockedReason/data/user`
  are NEVER exposed (`NOTIFICATION_LIST_FIELDS`, `:15-18`).
  `meta.unreadCount` = the caller's TOTAL `readAt IS NULL` count, independent of the filters (`:106`).
- **Errors** `400` (bad `read`/`category`); `403` `ForbiddenError`
  `"Only a signed-in parent, teacher, student or admin can access notifications"`
  (`notification-caller.ts:57`); `429`.
- **DB** reads `notifications` (findMany + 2 × count). No writes.

---

### 15. `GET /api/notifications/unread-count`

- **Route** `01-custom-notification.ts:25-30`. Grant/role as #14.
- **Params/query/body** none.
- **Ownership** forced owner filter + `readAt: { $null: true }` (`services/notification.ts:128-132`).
- **Success 200** BARE `{ data: { count: <int> } }` (`controllers/notification.ts:119-120`)
  — set on `ctx.body` directly, so there is **no `meta` member**.
- **Errors** `403` (same message as #14); `429`.
- **DB** COUNT on `notifications`. No writes.

---

### 16. `POST /api/notifications/read-all`

- **Route** `01-custom-notification.ts:32-37`. Grant/role as #14. No body read.
- **Behaviour** loads the caller's unread rows sorted `createdAt:desc`, **capped at 100 per
  call** (`services/notification.ts:22,165-171`), then writes the SAME `readAt = now` ISO to
  all of them in parallel (`:176-180`). A caller with >100 unread must call again.
- **Success 200** BARE `{ data: { updated: <int> } }` (`controllers/notification.ts:105-106`).
  Zero unread ⇒ `{ data: { updated: 0 } }`, never a 404.
- **Errors** `403`; `429`.
- **DB** UPDATE ≤100 `notifications` rows (`readAt`).

---

### 17. `PUT /api/notifications/:documentId/read`

- **Route** `01-custom-notification.ts:39-44`. Grant/role as #14. No body.
- **Ownership rule** `findOne` + populate `user.documentId`; unknown ⇒ **404**
  `NotFoundError "Notification not found"`; foreign ⇒ **403** `name: 'ForbiddenError'`,
  message `"This notification does not belong to you"` (thrown as `PolicyError`, renamed —
  `services/notification.ts:144-155`).
- **Idempotency** an already-read row returns its ORIGINAL `readAt` with no re-write (`:158`).
- **Success 200** BARE `{ data: { documentId, readAt: ISO } }` (`controllers/notification.ts:90-91`).
- **Errors** `403` (role) / `403` (foreign row) / `404` / `429`.
- **DB** conditional UPDATE one `notifications` row.

---

### 18 & 19. `GET /api/notification-preferences/me` · `PUT /api/notification-preferences/me`

- **Route** `src/api/notification-preference/routes/01-custom-notification-preference.ts:18-30`.
  Core router `only: []`.
- **Auth/role** grants `…getMine` / `…updateMine` — **all four app roles**; re-asserted via
  `assertNotificationCaller` (`controllers/notification-preference.ts:28,45`).
- **Ownership rule** target ALWAYS `ctx.state.user`; get-or-create by the `user` relation
  documentId, connected on create by **numeric id** (`services/notification-preference.ts:106-136`).
- **PUT body** FLAT JSON (no `{ data }` envelope). Writable whitelist
  (`services/notification-preference.ts:19-27`): booleans
  `emailEnabled, smsEnabled, inAppEnabled, pushEnabled, children, testActivity, testResults`
  plus `digestFrequency ∈ immediate|daily|weekly|off` (`:10`).
  `account` and `security` are deliberately **absent from the whitelist** (structurally
  non-suppressible). Unknown keys (`user`, `id`, `documentId`, …) are silently IGNORED
  (not a 400 — unlike search-preferences). Empty/all-ignored body ⇒ current row, no write (`:191`).
- **Success 200** BARE `{ data: NotificationPreferenceView }` — no `meta`:
  `{ documentId, emailEnabled, smsEnabled, inAppEnabled, pushEnabled, account, security,
  children, testActivity, testResults, digestFrequency, createdAt, updatedAt }`
  (`services/notification-preference.ts:36-66`). `user` is never returned.
  Lazily-created defaults: all nine booleans `true`, `digestFrequency: 'immediate'` (`:117-134`).
- **Errors** `403` `"Only a signed-in parent, teacher, student or admin can access notification preferences"`;
  `400` `ValidationError` `"<field> must be a boolean"` / `"digestFrequency must be one of: …"`
  (`:175,184-187`); `429`.
- **DB** reads/INSERTs/UPDATEs `notification_preferences`.

---

### 20. `GET /api/push-subscriptions/vapid-public-key`

- **Route** `src/api/push-subscription/routes/01-custom-push-subscription.ts:19-24`.
  Grant held by all four app roles; `assertNotificationCaller` re-asserts
  (`controllers/push-subscription.ts:58`).
- **Success 200** BARE `{ data: { publicKey: string|null } }`, parsed through
  `pushVapidPublicKeyResponseSchema` (`src/contracts/push-subscription.ts:38-43`).
  `null` honestly reports unconfigured VAPID
  (`src/services/notifications/channels/push.ts:63-65`).
- **Errors** `403`; `429`. **DB** none (reads env/config only).

---

### 21. `POST /api/push-subscriptions`

- **Route** `01-custom-push-subscription.ts:25-30`. Grant: all four app roles.
- **Body** STRICT (`src/contracts/push-subscription.ts:21-29`) — unknown key ⇒ 400:
  `endpoint: string 1..2048 (trimmed)`, `keys: { p256dh: 1..255, auth: 1..255 }` (strict),
  `expirationTime?: int 0..8640000000000000 | null`, `userAgent?: string 1..1000`.
  `userAgent` falls back to the request `user-agent` header (`controllers/push-subscription.ts:75-77`).
- **Ownership rule** upsert **by the globally-unique `endpoint`**
  (`services/push-subscription.ts:71-81`): a row owned by the caller updates only its
  subscription material; a row owned by ANOTHER user ⇒ **403** `ForbiddenError`
  `"You cannot manage this push subscription"` — never reassigned, owner never disclosed.
  New rows connect `user` by **numeric id** (`:92`).
- **Success 200** BARE `{ data: { documentId, endpoint } }` (`controllers/push-subscription.ts:88-89`).
- **Errors** `400` `ValidationError` `"invalid push subscription"` + `details.fields/issues`
  (`controllers/push-subscription.ts:35-45`); `403` (role) / `403` (foreign endpoint); `429`.
- **DB** INSERT or UPDATE one `push_subscriptions` row.

---

### 22. `DELETE /api/push-subscriptions`

- **Route** `01-custom-push-subscription.ts:31-36`. Grant: all four app roles.
- **Input** `{ endpoint }` in the DELETE **body** (canonical — enabled by
  `config/middlewares.ts:39-50`) or the equivalent `?endpoint=` query
  (`controllers/push-subscription.ts:24-28`). STRICT parse (`contracts/push-subscription.ts:33-35`).
- **Ownership rule** deletes at most one row matched by BOTH `endpoint` AND the caller's
  `user.documentId` (`services/push-subscription.ts:111-123`) — a foreign or absent endpoint
  is indistinguishable.
- **Success 200** BARE `{ data: { deleted: 0|1 } }`. Idempotent.
- **Errors** `400 "invalid push subscription"`; `403` (role); `429`.
- **DB** DELETE ≤1 `push_subscriptions` row.

---

### 23. `GET /api/users/me`  (stock action, WRAPPED)

- **Route** stock users-permissions content-api route. Grant `plugin::users-permissions.user.me`
  is required for CUSTOM roles — the built-in `authenticated` role's default grant does NOT
  cover them (`permissions-action-refs.ts:147-151`). Granted to parent
  (`permissions-actions.ts:148`) and teacher (`:133`).
- **Wrap** `src/extensions/users-permissions/strapi-server.ts:141-160`: sets
  `Cache-Control: private, no-store`, then re-reads the user with `populate: { role: true }`
  and appends `role: { id, name, type, description }`; for `role.type === 'parent'` it also
  appends the computed boolean `profileCompleted`
  (`withParentCompletion` → `src/extensions/users-permissions/profile-completion.ts:32-52`).
- **Success 200** the stock BARE sanitized user object (no `data`/`meta` envelope) — every
  non-private attribute of the extended user schema
  (`src/extensions/users-permissions/content-types/user/schema.json`):
  `id, documentId, username, email, provider, confirmed, blocked, createdAt, updatedAt,
  publishedAt` + the 16 parent-profile fields `first_name, last_name,
  relationship_to_student, occupation, phone, secondary_phone, preferred_contact_method,
  address_line, city, state_region, postal_code, country_of_residence,
  emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
  preferences` — PLUS the wrap's `role` object and `profileCompleted`.
  `password`, `resetPasswordToken`, `confirmationToken` are `private: true` and stripped.
- **`profileCompleted` rule** true only when all 10 of
  `first_name, last_name, phone, relationship_to_student, preferred_contact_method,
  address_line, city, country_of_residence, emergency_contact_name, emergency_contact_phone`
  are non-empty after trim (`profile-completion.ts:12-37`).
- **Errors** `401` / `403` per the users-permissions layer; `429`.
- **DB** reads `up_users` + `up_roles`. No writes.

---

### 24. `PUT /api/users/me`  (custom, spliced BEFORE the stock `PUT /users/:id`)

- **Route** spliced at runtime by `installUpdateMe`
  (`src/extensions/users-permissions/update-me.ts:140-163`) so the `:id` wildcard cannot
  capture `"me"`. Grant `plugin::users-permissions.user.updateMe` — **parent only**
  (`permissions-action-refs.ts:153-156`, `permissions-actions.ts:148`).
- **Body** FLAT JSON (no `{ data }` envelope), 16-field whitelist
  (`update-me.ts:23-47`), every field optional:
  `first_name 1..100`, `last_name 1..100`,
  `relationship_to_student ∈ mother|father|guardian|grandparent|other`,
  `occupation ≤120`, `phone` matching `/^\+?[\d\s()-]{6,}$/` ≤50,
  `secondary_phone` = `''` or the same phone pattern,
  `preferred_contact_method ∈ email|phone|whatsapp|wechat`,
  `address_line 1..255`, `city 1..120`, `state_region ≤120`, `postal_code ≤32`,
  `country_of_residence` = 2 letters (upper-cased on write), `emergency_contact_name 1..120`,
  `emergency_contact_phone` (phone pattern), `emergency_contact_relationship ≤80`,
  `preferences: Record<string, unknown>`.
  Unknown/stock keys (`email`, `role`, `blocked`, `password`, …) are SILENTLY STRIPPED —
  never a 400 (`:22`). Only keys actually PRESENT in the raw body are written (`:88-92`).
- **Ownership rule** target is always `ctx.state.user.documentId` — there is no id param (`:73-78`).
- **Success 200** BARE sanitized user (no envelope, **no `role` key** because `updated` has no
  role populated) + `profileCompleted` when the caller is a parent (`:108-118`).
- **Errors** `400` `ValidationError` `"invalid profile payload"` + `details.fields/issues`
  (`:57-63`); `403` `ForbiddenError` (JWT resolving no user, `:77`); `429`.
- **DB** UPDATE `up_users` (only when ≥1 whitelisted key was sent; otherwise a plain read).

---

### 25. `POST /api/auth/change-password`  (stock action, WRAPPED)

- **Route** stock users-permissions. Grant `plugin::users-permissions.auth.changePassword`
  — the plugin default targets only the built-in `authenticated` role, so the parent role
  needs the explicit grant (`permissions-action-refs.ts:158-164`, `permissions-actions.ts:148`).
  Teacher/student/admin hold NO grant → 403.
- **Wrap** `src/extensions/users-permissions/auth-wraps.ts:166-175` — after a stock **200**
  it fires a best-effort `security_password_changed` notification to the caller.
- **Ownership** inherent: the stock action acts on `ctx.state.user` only.
- **Success/Errors** stock users-permissions behaviour (400 on wrong current password or an
  unchanged new password — `auth-wraps.ts:160-162`); `429` global.
- **DB** UPDATE `up_users.password`; INSERT one `notifications` row (category `security`,
  non-suppressible).

---

### 26. `POST /api/upload`  (stock upload plugin)

- **Route** stock `@strapi/upload` content-api route. Grant
  `plugin::upload.content-api.upload` — parent only among custom roles
  (`permissions-action-refs.ts:166-169`, `permissions-actions.ts:148`).
  `find` / `findOne` / `destroy` are DELIBERATELY NOT granted — file enumeration and
  deletion stay closed to parents (`permissions-action-refs.ts:167-168`).
- **Ownership** none at upload time. A file becomes linked to a student only by passing its
  **numeric `id`** into #4 / #5, whose ownership rules then apply.
- **Success 201** stock BARE JSON ARRAY of file objects (no `data`/`meta`). The server-side
  mime/size gate is NOT here — it is `parent-media.ts` on the student write (§4).
- **Errors** stock plugin errors; `429` global.
- **DB** INSERT into the upload plugin `files` table; binary written by the configured provider.

---

## 3. WHAT A PARENT CANNOT REACH (verified negatives)

### 3.1 Granted but policy-blocked
- `GET /api/students`, `GET /api/students/:documentId` — core router policies
  `global::is-teacher` (+ `api::student.is-owned-teacher`) (`src/api/student/routes/student.ts:11-12`).
  The parent's `find`/`findOne` grants are explicitly described as "inert … kept for matrix
  stability" (`permissions-actions.ts:104-105`).

### 3.2 Not granted to parent at all (⇒ 403 at the permission layer)
| Endpoint | Handler | Granted to | Evidence |
|---|---|---|---|
| `GET /api/results/:documentId` | `api::result.result.getResult` | student, teacher, admin | `permissions-actions.ts:118,126,138`; route `src/api/result/routes/01-custom-results.ts:12-21` |
| `GET /api/results/:documentId/export` | `api::result.export.exportDiagnostic` | teacher, admin | `permissions-action-refs.ts:69-74` |
| `GET /api/sessions/:documentId` | `api::session.session.getSession` | student, teacher, admin | `permissions-action-refs.ts:35-38` |
| `POST /api/sessions` | `…createSession` | student, teacher, admin | `permissions-action-refs.ts:26-28` |
| `GET /api/my/sessions` | `api::session.my.mySessions` | student only (+ service re-assert) | `permissions-actions.ts:137`; `src/api/session/services/my-lists.ts:89` |
| `GET /api/my/students/sessions` | `api::session.my.myStudentsSessions` | teacher only | `permissions-actions.ts:126`; `my-lists.ts:105` |
| `GET /api/my/students/results` | `api::session.my.myStudentsResults` | teacher only | `permissions-actions.ts:126`; `src/api/session/services/my-results.ts:49` |
| `GET /api/media?ref=` | `api::media.media.resolveRef` | student, teacher, admin | `permissions-action-refs.ts:56-62` |
| `GET /api/exports/*.csv`, `POST /api/exports/drop` | `api::export.*` | admin only | `permissions-action-refs.ts:76-88` |
| `GET/POST/PUT/DELETE /api/schools`, `/api/agents` | core routers | **NO role** | `src/api/school/routes/school.ts:5-9`; `src/api/agent/routes/agent.ts:5-9` |
| `/api/sessions`, `/api/responses`, `/api/results`, `/api/items`, `/api/configs` core CRUD | core routers | admin (`global::is-admin`) | `src/api/session/routes/session.ts:7-8`, `response/routes/response.ts`, `result/routes/result.ts:7-8`, `item/routes/item.ts`, `config/routes/config.ts` |
| `/api/forms` find/findOne | core router | teacher/admin | `src/api/form/routes/form.ts:7-8` |
| `/api/classes` find | core router | teacher (find) / admin | `src/api/class/routes/class.ts:8-16` |

**Double lock on results:** even if the `getResult` grant were added, the ownership matrix in
`src/api/result/services/result-view.ts:54-68` has **no `parent` branch** — a parent caller
falls through to `throw new ForbiddenError('role may not read results (C-4)')` at `:67`.

---

## AVAILABLE FOR DASHBOARD METRICS

Everything below is computable TODAY from the endpoints in §1/§2. Endpoint numbers refer to
the summary table.

### Per-child, from `GET /api/my/students/:documentId/progress` (#3)
| Metric | Field | Source |
|---|---|---|
| Total tests attempted | `data.metrics.totalSessions` | `parent-progress.ts:131` (COUNT sessions for child) |
| Tests completed | `data.metrics.completedSessions` | `parent-progress.ts:132-134` (`status='complete'`) |
| Tests in progress | `data.metrics.activeSessions` | `parent-progress.ts:135-137` (`status='in_progress'`) |
| Official results published | `data.metrics.officialResults` | `parent-progress.ts:138` (`destination='official'`) |
| **Derived**: completion rate | `completedSessions / totalSessions` | both from `metrics` |
| **Derived**: abandoned/terminated count | `totalSessions − completedSessions − activeSessions` | inferred only; `terminated` is a real enum value (`session/content-types/session/schema.json:68-71`) but is NOT returned separately |
| Latest ≤5 official results | `data.recentResults[]` | `parent-progress.ts:139-144`, sorted `published_at_field:desc, createdAt:desc`, `limit 5` |
| Current CEFR band per recent result | `recentResults[].cefrBand` | enum `pre_A1..C1` |
| Readiness per recent result | `recentResults[].readiness` | enum `met/approaching/not_yet/not_assessed` |
| Skill per recent result | `recentResults[].skill` | enum `reading/listening/speaking/writing` (nullable — `null` for `scope='combined'`) |
| Result pipeline state | `recentResults[].status` | `scoring / partial_pending / complete` → "results processing" UI state |
| Result publish timestamp | `recentResults[].publishedAt` | ISO or `null` |
| Human-readable result label | `recentResults[].displayLabel` | string or `null` |
| **Derived**: skill coverage among the ≤5 recent | `new Set(recentResults.map(r => r.skill))` | client-side |
| **Derived**: band delta within the window | compare two `recentResults` of the same `skill` | only valid when both fall inside the 5-row window |
| Child profile context | `data.student.{given_name, family_name, year_level, nationality, current_year_level, target_entry_year, target_entry_term, status, createdAt, updatedAt}` | `parent-progress.ts:74-88` |
| **Derived**: account age / "child added N days ago" | `data.student.createdAt` | |

### Across children, from `GET /api/my/students` (#1)
| Metric | Field | Source |
|---|---|---|
| Total active children | `meta.pagination.total` (default filter excludes `archived`) | `parent-student-read-actions.ts:80,91` |
| Archived children count | second call with `filters[status][$eq]=archived` → `meta.pagination.total` | `:76-80` |
| Enrolled children count | `filters[status][$eq]=enrolled` → `meta.pagination.total` | status enum `active/archived/enrolled` (`student/schema.json:130-135`) |
| Children by target entry year | group `data[].target_entry_year` client-side | in the list projection (`:87`) |
| Children by target entry term | group `data[].target_entry_term` | |
| Children by current year level | group `data[].current_year_level` | |
| Children by nationality | group `data[].nationality` | |
| Children missing an email (magic-link blocker) | `data[].email === null` | #8 400s without an email |
| Newest child | `data[0]` under the default `createdAt:desc` sort | `:90` |

### Per-child media / detail, from `GET /api/my/students/:documentId` (#2)
| Metric | Field |
|---|---|
| Avatar / photo URL | `data.photo` (full upload media object) — `parent-student-read-actions.ts:122` |
| Voice intro presence | `data.voice_intro !== null` |
| **Derived**: child age | from `data.date_of_birth` |
| Child profile completeness (client rule) | count non-null keys across `STUDENT_DETAIL_FIELDS` |
| Guardian contact block | `parent_guardian_name/email/phone/wechat`, `preferred_contact_channel` |

### Notifications (#14/#15)
| Metric | Field |
|---|---|
| Unread badge total | `GET /api/notifications/unread-count` → `data.count` |
| Same, in one round-trip with the list | `GET /api/notifications` → `meta.unreadCount` (`controllers/notification.ts:74`) |
| Total notifications | `GET /api/notifications` → `meta.pagination.total` |
| **Unread per category** | `GET /api/notifications?category=<c>&read=false&pageSize=1` → `meta.pagination.total` — the service `$and`s both filters (`services/notification.ts:92-95`). Valid for all 5 categories |
| **Count per eventType** | `?eventType=test_results_ready&pageSize=1` → `meta.pagination.total` (9 event types, `notification/schema.json:20-34`) |
| Activity feed / timeline | `data[]` sorted `createdAt:desc`, each with `title/body/priority/linkUrl/createdAt` |
| High-priority alert count | `priority === 'high'` — client-side over a fetched page (no server `priority` filter) |
| Deep link target per event | `linkUrl` — `/dashboard/children/<documentId>` for child/session/result events, `/dashboard` or `/dashboard/settings` for account/security (`src/services/notifications/format-event.ts:32-35,62-117`) |

### Account / profile (#23)
| Metric | Field |
|---|---|
| Onboarding gate | `profileCompleted: boolean` (`strapi-server.ts:158`) |
| **Derived**: which profile fields are missing | compare the 10 `PARENT_PROFILE_REQUIRED_FIELDS` (`profile-completion.ts:12-23`) against the `/users/me` body — all 10 are returned |
| Email confirmed | `confirmed: boolean` |
| Account created | `createdAt` |
| Notification channel state | `GET /api/notification-preferences/me` → 4 channel booleans + 5 category booleans + `digestFrequency` |
| Push enabled on this device | `GET /api/push-subscriptions/vapid-public-key` → `data.publicKey !== null` (server-side capability only) |

### Search context (#10/#11/#12)
| Metric | Field |
|---|---|
| Saved default search filters | `GET /api/search-preferences/me` → the 7 `default_*` fields |
| School result totals for the saved defaults | `POST /api/search/schools` with the stored defaults → `meta.pagination.total` |
| Agent result totals | `POST /api/search/agents` → `meta.pagination.total` |
| Fee range of matching schools | `SchoolHit.annualTuitionFrom` across a page |

---

## GAPS

Data a parent dashboard would plausibly need that **NO existing parent-reachable endpoint
returns**. Each entry names where the data DOES live, so the backend work is scoped.

### G1 — No cross-child aggregate endpoint (N+1 required)
`/my/students/:documentId/progress` is strictly per-child (`parent-progress.ts:111`).
There is no endpoint returning metrics for ALL of a parent's children. A dashboard showing
"12 tests completed across 3 children" must issue 1 + N requests, and the global limiter is
120 req/min/IP (`config/middlewares.ts:53`). **Missing:** a `GET /api/my/progress` (or
`?studentIds=` batch) returning the same `metrics` block keyed by child, plus household totals.

### G2 — No parent-reachable result detail
`GET /api/results/:documentId` is not granted to parent AND `result-view.ts:54-68` has no
parent branch (falls to `403 'role may not read results (C-4)'`). Therefore the entire
`ResultView` (`src/contracts/results.ts:69-95`) is unreachable for a parent:
`attributes` (per-attribute mastery map: `status/prob/prob_se/items/delta`),
`productive_scores`, `supplementary` (`vocab_band_a2_accuracy`, `vocab_band_b1_accuracy`,
`dprime`), `acara_phase`, `low_confidence`, `effort_valid`, `scope`, `destination`,
`provisional` ('field_test' banner), `previous_result_document_id`, `session_document_id`,
`combined_children`. A parent can see only the 7 summary keys in `recentResults`.

### G3 — No parent-reachable session data of any kind
No parent grant on `getSession`, `mySessions`, or `myStudentsSessions` (§3.2). So the entire
`sessions` row is invisible: `mode` (practice/progress/placement), `skill`, `status`
(incl. `terminated`), `current_stage`, `started_at`, `ended_at`, `proctoring`, `routing_trail`,
`result_destination`, `parent_session`, `form` (`session/content-types/session/schema.json:13-90`).
Consequences: no test duration, no "last active" timestamp, no per-mode breakdown, no
in-progress-session deep link, no per-skill session counts, no placement-vs-progress split.

### G4 — `recentResults` is hard-capped at 5 and has no pagination or filters
`limit: 5` in the query (`parent-progress.ts:143`) and `.max(5)` in the contract
(`src/contracts/parent-child-progress.ts:45`). There is no `page`, no `skill=`, no date range,
no `limit` override. **Any trend line, per-skill history, or "all results" list is impossible.**

### G5 — No time-series / trend data
Nothing returns results or sessions bucketed over time. `recentResults[].publishedAt` can be
`null` (the field is `published_at_field`, nullable — `result/schema.json:85-87`), and there is
no `createdAt` on the recentResults projection, so even the 5 rows cannot be reliably ordered
on the client when `publishedAt` is null. **Missing:** a per-child results history endpoint
with `createdAt` and pagination.

### G6 — No per-skill metric breakdown
`metrics` has exactly 4 scalars (`parent-child-progress.ts:25-30`). Nothing returns
sessions-per-skill, results-per-skill, latest-band-per-skill, or "skills not yet assessed".
`readiness = 'not_assessed'` exists in the vocab (`src/contracts/vocab.ts:104`) but a parent
can only see it when a result row happens to be in the 5-row window.

### G7 — `terminated` sessions are not counted
`session.status` enum includes `terminated` (`session/schema.json:68-71`) but `metrics` counts
only `complete` and `in_progress` (`parent-progress.ts:131-137`). A dashboard can only infer it
by subtraction, which is silently wrong if a new status value is ever added.

### G8 — Practice / transient results are invisible
Both `officialResults` and `recentResults` force `destination = 'official'`
(`parent-progress.ts:125-128`). Practice sittings produce `destination='transient'` results
(`result/schema.json:81-84`) that a parent can never see or count — including "N practice tests
taken", which is a natural engagement metric.

### G9 — No "last activity" timestamp anywhere
Neither the list, the detail read, nor `/progress` returns a `lastSessionAt` /
`lastResultAt` / `lastActivityAt`. `student.updatedAt` only reflects profile edits.
The source columns (`sessions.started_at`, `sessions.ended_at`,
`results.published_at_field`) exist but are unreachable (G3) or nullable-only (G5).

### G10 — Child photo is absent from the list endpoint
`findMyStudents` populates only the `user` relation (`parent-student-read-actions.ts:92`);
`photo`/`voice_intro` are populated ONLY on the single-child detail read (`:122`).
An avatar grid on the dashboard therefore needs N extra requests.

### G11 — No class / teacher context for a child
`student.class` and `student.teacher` relations exist (`student/schema.json:36-46`) but no
parent-facing endpoint populates or projects them. A parent cannot see who is teaching their
child or which class they are in.

### G12 — Results cannot be linked back to a session or to each other
`recentResults` items carry no `sessionDocumentId` and no `previousResultDocumentId`
(`parent-child-progress.ts:32-40`). Even for navigation-only purposes a parent cannot
correlate a result with the sitting that produced it.

### G13 — No per-child unread-notification count
`unread-count` is a single global scalar (`services/notification.ts:128-132`) and the feed's
`data` payload (which holds `studentDocumentId`) is deliberately NOT exposed
(`NOTIFICATION_LIST_FIELDS`, `services/notification.ts:15-18`). Attributing a notification to a
child requires string-parsing `linkUrl` (`/dashboard/children/<documentId>`,
`format-event.ts:32-35`) — fragile, and `linkUrl` is `null` for account/security events on
some paths.

### G14 — No single-notification read endpoint
Only list / unread-count / mark-read / mark-all-read exist
(`01-custom-notification.ts:16-45`). A deep link to one notification must page the list.

### G15 — `read-all` silently caps at 100
`MARK_ALL_CAP = 100` (`services/notification.ts:22,170`). A parent with >100 unread gets
`{ updated: 100 }` and must call again; the response does NOT report how many remain.

### G16 — No endpoint lists the caller's own push subscriptions
Only `vapidPublicKey` / `subscribe` / `unsubscribe` exist
(`01-custom-push-subscription.ts:17-37`). A settings screen cannot show "3 devices
registered" or let a parent revoke a different device.

### G17 — No saved/shortlisted schools or agents
`search-preference` stores only default FILTER values (7 `default_*` fields,
`search-preference/content-types/search-preference/schema.json:19-53`). There is no
favourites/shortlist/saved-search content-type anywhere in `src/api/`, and
`saved_search_match` is explicitly documented as having no producer
(`src/services/notifications/format-event.ts:53`).

### G18 — No scheduling / upcoming-test data
No content-type in `src/api/` models a scheduled or upcoming test. `sessions` are created on
demand by `POST /api/sessions` (student/teacher/admin only). "Next test" is unrepresentable.

### G19 — Parents cannot see magic-link / invite state
`student-magic-link` rows are written by #8 but there is no read route beyond
`request`/`verify`/`me` (`01-custom-student-magic-link.ts:14-41`). A parent cannot see whether
a sign-in link was sent, used, or expired for a child.

### G20 — No parent access to media refs used inside a test
`GET /api/media?ref=` is granted to student/teacher/admin only
(`permissions-action-refs.ts:56-62`). Any future parent-facing surface that renders test
stimulus or a productive capture (a child's speaking recording) is blocked.

### G21 — Reference/lookup vocabularies are not served to the client
The enum vocabularies a dashboard needs for labels/legends (skills, CEFR bands, readiness,
attribute codes R1–R7 / L1–L7 / S1–S5 / W1–W6) live only in `src/contracts/vocab.ts` and in
schema enums. `api::config` core routes are admin-only (`config/routes/config.ts:7-8`), so
there is no endpoint a parent client can call to fetch them — they must be duplicated in the web repo.

### G22 — No school/agent detail read
`POST /api/search/schools|agents` return list hits only; the core `/api/schools` and
`/api/agents` routers are granted to NO role (`school/routes/school.ts:5-9`,
`agent/routes/agent.ts:5-9`). A "school detail" page can only re-run a search and filter
client-side, and fields outside `HIT_FIELDS` / `AGENT_FIELDS`
(`src/utils/school-search.ts:17-23`, `search-agents.ts:34-38`) — e.g. `acaraId`,
`cricosCoursesCodes`, `officeLocations` — are unreachable.

### G23 — No server-side result "viewed/acknowledged" flag
`results` has no viewed/seen column (`result/content-types/result/schema.json`). "New results
you haven't opened" can only be approximated from notification `readAt`.

### G24 — `GET /api/my/students` exposes no cheap count-only mode
Counting archived/enrolled children requires a full paged request per status (there is no
`pageSize=0` / count-only path); each costs a findMany + count (`parent-student-read-actions.ts:83-93`).

---

## DOC vs CODE DISAGREEMENTS (code is authoritative)

1. **`schooltest-web/.qa/CONTRACTS.md:9-12` (C-STUDENT-LIST student shape)** says 7 keys
   `{documentId, given_name, family_name, year_level, email, createdAt, updatedAt}`.
   **Code** returns 11 fields + `documentId` (`parent-student-read-actions.ts:85-88`), adding
   `nationality, current_year_level, target_entry_year, target_entry_term, status`.
   `/home/hnr/Code/schooltest/.qa/CONTRACTS.md` (C-STUDENT-LIST-EXT) matches the code and
   explicitly states it SUPERSEDES the web doc.
2. **`schooltest-web/.qa/CONTRACTS.md:70-73` (C-STUDENT-CREATE body)** says
   `{ given_name, family_name, year_level int 7..12, email? }`. **Code** additionally REQUIRES
   `nationality, target_entry_year, target_entry_term, parent_guardian_name,
   parent_guardian_phone` and makes `family_name` / `year_level` OPTIONAL
   (`parent-student-schemas.ts:65-84`). The web doc is stale.
3. **`/home/hnr/Code/schooltest/.qa/CONTRACTS.md` C-STUDENT-CREATE** says
   `family_name: z.string().min(1).max(100)` — **required**. **Code** has `.optional()`
   (`parent-student-schemas.ts:66`), matching the M-CT-STUDENT-NAME mononym rule in the
   schema description (`student/schema.json:8`) and `"required": false` at `:29`.
   The root doc's C-STUDENT-CREATE entry contradicts both the code and its own
   C-CT-STUDENT-EXT section.
4. **`schooltest-web/.qa/CONTRACTS.md:34-36` (C-AUTH-ME)** says 200 = `{ id, documentId,
   username, email, role: { type } }`. **Code** returns the full sanitized user (incl. all 16
   parent-profile fields), `role: { id, name, type, description }`, and `profileCompleted`
   (`strapi-server.ts:151-159`).
5. **Notification/push/preference surface role scope.** `schooltest-web/.qa/CONTRACTS.md`
   describes C-PUSH-VAPID-CONFIG / C-PUSH-SUBSCRIBE / C-PUSH-UNSUBSCRIBE / C-PREF-* as
   "**parent JWT only**". **Code** grants all nine notification-surface actions to
   parent **AND teacher AND student AND admin** (`permissions-actions.ts:77-81`,
   `src/utils/notification-caller.ts:32-37`). Ownership forcing is unchanged, so this is a
   role-scope doc error, not a security one.
6. **`schooltest-web/.qa/CONTRACTS.md` C-NOTIF-LIST** lists query params
   `page,pageSize,read,category`. **Code** also accepts `eventType`
   (`controllers/notification.ts:63`, `services/notification.ts:95`).
7. **`schooltest-web/.qa/CONTRACTS.md:93-104` (C-ML-VERIFY / C-ML-ME)** describes a bespoke
   student JWT signed with `STUDENT_JWT_SECRET`. **Code** (task 070) mints a
   **users-permissions** JWT and authenticates `/api/auth/student/me` through the plugin
   strategy (`student-magic-link/controllers/student-magic-link.ts:141-146,150-181`;
   `routes/01-custom-student-magic-link.ts:5-12`).
8. **`schooltest-api/.qa/CONTRACTS.md` C-4** documents `GET /api/results/:documentId` for
   student/teacher/admin — consistent with the code, and it confirms that **parent was never
   in scope** for result reads. Recorded here because the web doc's
   `C-UI-CHILD-LEARNING-SURFACE` promises "a chronological assessment-result stream", which
   the existing API can only satisfy with the ≤5-row `recentResults` projection (see G2/G4).

---

## UNKNOWNS

- **Exact HTTP status for an ANONYMOUS request to a parent-only route.** The repo's docs
  assert `403` (D15, `/home/hnr/Code/schooltest/.qa/CONTRACTS.md` C-STUDENT-CREATE "anon → 403,
  not 401") and route comments repeat it (`01-custom-notification.ts:10-11`). I did NOT read
  the `@strapi/plugin-users-permissions@5.50.1` dist authentication strategy, and I ran no
  live request, so I cannot confirm from code whether a MALFORMED/EXPIRED Bearer yields `401`
  vs `403`. Two handlers throw `UnauthorizedError` defensively when `ctx.state.user` is
  absent (`result/controllers/result.ts:25`, `session/controllers/my.ts:27`), which implies
  a 401 path exists for some routes.
- **Whether the numeric `id` appears in `GET /api/my/students` items.** The controller does
  not strip it (`parent-student-read-actions.ts:97-103`) and Strapi v5 `sanitizeOutput`
  behaviour for `id` was not verified from the dist. `/home/hnr/Code/schooltest/.qa/CONTRACTS.md`
  (C-STUDENT-LIST-EXT Success) states `id` IS present; I did not verify that against a live response.
- **Stock `POST /api/auth/change-password` request/response bodies.** Only the wrap
  (`auth-wraps.ts:166-175`) is in this repo; the stock body shape lives in the plugin dist,
  which I did not read.
- **Stock `POST /api/upload` full response object.** The repo's doc
  (`/home/hnr/Code/schooltest/.qa/CONTRACTS.md` C-UPLOAD-PARENT Success) describes the array
  item keys; I read no plugin dist code for it.
- **Runtime route registration order / final path list.** I did not run
  `pnpm strapi routes:list` (read-only mandate + no server start). All paths above are read
  from route definition files.
