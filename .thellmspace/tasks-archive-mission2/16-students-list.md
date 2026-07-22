---
id: 16
title: Dashboard — students list with real data + empty state
layer: frontend
kind: build
slice: students table/cards fed by C-STUDENT-LIST via TanStack Query
target: src/modules/dashboard/{components/StudentsSection.tsx,queries/use-students.query.ts,schemas/student.schema.ts,types/}
contract: C-STUDENT-LIST
status: DONE
depends_on: [10, 15]
---
## Objective
The dashboard's core section:
- schemas/student.schema.ts: Zod for the CONTRACTS.md student shape + the v5 collection
  envelope (reuse StrapiCollectionResponse pattern from lib/axios/strapi.ts).
- queries/use-students.query.ts: GET /api/students via the typed strapi axios instance
  (JWT interceptor already attaches the parent token), parse via the schema.
- components/StudentsSection.tsx (client): heading + count; loading skeletons; EMPTY
  STATE (DS EmptyState: icon, "No students yet", body, "Add your first student" —
  wired to task-17's dialog trigger); populated state = DS Table (Name / Year level /
  Email / Added) with translated headers (en+de); error state = Alert error + retry.
  DashboardScreen composes it inside the task-15 shell.
## Files
- the above + DashboardScreen.tsx + messages (Dashboard.students* keys)
## Done criteria
- REAL: seeded parent sees Mia + Jonas in the list (browser run); a freshly-registered
  parent (no students) sees the empty state; tsc+lint zero; axe clean; parity; schema
  rejects a malformed payload (verifier proves via a tampered response parse).
## Evidence
Independently re-verified 2026-07-18 on the build agent's attempt-2 (attempt-1's
blocking gap: `Dashboard.title` carried a stale generic "Dashboard"/"Home"/"Papan
Pemuka" value in 5 non-en locales instead of "your students"). All evidence below is
freshly gathered against the real running servers (:3100 / :5500), not taken on the
builder's word.

- **i18n fix genuinely correct, not a papered-over collision**: grep-confirmed
  `Dashboard.title` is read by exactly one component (`StudentsSection.tsx`'s h2); the
  `/dashboard` page's `<title>` metadata uses the separately-scoped `Dashboard.meta.title`,
  and `DashboardScreen`'s `<h1>` uses `welcomeTitle` — zero collision existed or exists.
  Full key-shape parity re-confirmed across all 6 catalogs (en/ko/ms/th/vi/zh): 358 keys
  each, zero missing/extra.
- **Backend contract (curl, live :5500, real seeded parent JWT)**: `POST /api/auth/local`
  200 with real JWT; `GET /api/my/students` 200 `{data:[Student],meta:{pagination}}` byte-
  shape matching CONTRACTS.md C-STUDENT-LIST exactly, real rows (Jonas Keller year_level
  10, Mia Keller year_level 8, real emails/createdAt/updatedAt); `sort[0]=createdAt:desc`
  + `pagination[pageSize]=100` (matching the query hook's actual params) honored server-
  side (meta.pagination.pageSize:100). Unauth → 403 (documented D15/D16 masked-403 install
  quirk, non-blocking: StudentsSection only ever mounts behind ParentGuard).
- **Schema tamper proof**: own throwaway `tsx` script (deleted after) called
  `studentsResponseSchema.safeParse` directly — a well-formed response parses
  success:true; a tampered one (`year_level: 'eight'`, `documentId` omitted) parses
  success:false with exact issue paths `data.0.documentId` / `data.0.year_level`.
- **Browser proof (real login, real live app)**: screenshots
  `.qa/screenshots/dashboard-students-en.png` (seeded parent: real table — Jonas Keller
  10 jonas.keller@schooltest.local, Mia Keller 8 mia.keller@schooltest.local, badge count
  2, "Jul 18, 2026" dates) and `dashboard-students-empty-en.png` (freshly-registered
  parent: real DS EmptyState "No students yet" + body copy, zero table rendered, no
  add-student button since task 17 doesn't exist yet — matches spec).
- **Playwright**: `pnpm exec playwright test tests/e2e/students-list.spec.ts` → 8/8
  passed (en table + axe-clean, 6 per-locale heading checks incl. stale-string-absent
  assertions, empty-state + axe-clean). Broader regression run (students-list +
  design-system-zh + sign-in + design-system + landing + dashboard specs together) →
  27/27 passed, zero regressions from the i18n/helper changes.
- **Error + retry branch actually wired** (own diagnostic spec, route-intercepted
  `/api/my/students` only, real login + real `/api/users/me`, deleted after use): Alert
  "Could not load your students." + Retry button render on a real request failure;
  clicking Retry after the fault clears re-fetches and renders real Mia/Jonas data —
  confirms the error UI is functionally reachable, not just present in source.
- **Static checks**: `pnpm tsc --noEmit` clean. `pnpm lint` → 0 errors (1 pre-existing,
  unrelated warning in `CreateArticleForm.tsx`, untouched by this task).
  `pnpm exec prettier --check` on all touched files → clean.
  `grep -rniE "mock|fake|stub|dummy|placeholder|hardcoded"` across touched files → zero
  fixture/mock hits (only honest scope comments, e.g. "no mocks" / "stub" in the sense of
  page.tsx's own doc-comment about ParentGuard/DashboardScreen being a thin shell).
- No write path is owned by this task (list-only; add-student ships in task 17), so the
  "confirm the row persists across a reload" requirement does not apply here.

Full machine-readable evidence: `.qa/STATE.json` task 16 `verify` object.
