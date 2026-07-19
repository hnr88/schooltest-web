---
id: 15
title: /dashboard route + client-side parent guard
layer: frontend
kind: build
slice: dashboard shell gated by the auth store (redirect to /sign-in without JWT)
target: schooltest-web/src/app/dashboard/page.tsx, src/modules/auth/hooks/, src/modules/dashboard/
contract: frontend (guard behavior)
status: DONE
depends_on: []
---
## Objective
Create the dashboard route + guard primitive the later slices plug into:
- src/modules/dashboard/ module scaffold (components/, queries/, stores?, types/, index.ts
  — module-pattern structure; keep only what's needed).
- Guard: a useRequireParent hook (client) in modules/auth/hooks/: reads the auth store
  (jwt + hydrated), and on hydration without jwt → router.replace('/sign-in'); returns
  {isReady, isAuthenticated}. A ParentGuard component wrapping the dashboard content
  (loading skeleton while hydrating, matching our DS Spinner/Skeleton patterns).
- /dashboard/page.tsx: server shell (generateMetadata from Dashboard.meta, en+de)
  rendering the client DashboardScreen (stub content for now — the real sections land
  in tasks 16-18) wrapped in ParentGuard. Add the Dashboard namespace keys (title,
  meta.title/description).
## Files
- src/app/dashboard/page.tsx, src/modules/auth/hooks/use-require-parent.ts,
  src/modules/auth/components/ParentGuard.tsx, src/modules/dashboard/**
## Done criteria
- Incognito browser hitting /dashboard → redirected to /sign-in (REAL run); with the
  seeded parent session → dashboard shell renders; tsc+lint zero; axe clean; parity.
## Evidence
Verified 2026-07-18 by an independent explore verifier. The core deliverable had already
been built during task 12 as a D19 stopgap (files existed, untracked, task 15 still TODO
in STATE.json) — treated as unproven until re-checked against this task's own spec/Done
Criteria, not assumed correct.

- **Guard behavior (client-side, D11):** `use-require-parent.ts` reads the zustand auth
  store (`token`, `hydrated`), hydrates on mount, and `router.replace('/sign-in')` once
  hydrated with no token; returns `{isReady, isAuthenticated}`. `ParentGuard.tsx` shows a
  DS `Skeleton` while `!isReady`, else renders children. `/dashboard/page.tsx` is a Server
  Component: `generateMetadata` from `Dashboard.meta` via `getTranslations`, wraps the
  client `DashboardScreen` in `ParentGuard`. Task text says "en+de" — stale; per D17 the
  live set is en/zh/ko/ms/vi/th (de dropped) and all 6 catalogs carry the Dashboard/Common
  keys identically (see parity below).
- **Incognito redirect (REAL run):** `curl http://localhost:3100/dashboard` → 200 SSR HTML
  with zero `<h1>` tags; the only "Welcome back" string present is the serialized
  `Dashboard.welcomeTitle` i18n-catalog payload (`"Welcome back, {name}!"`), not rendered
  content. Playwright (`tests/e2e/dashboard.spec.ts`, live :3100, no init state) confirms:
  incognito `/dashboard` → real `router.replace` to `/sign-in`, `localStorage` has no JWT,
  zero console errors.
- **Authenticated render (REAL run):** `POST /api/auth/local` against the live api on
  :5500 with the seeded parent (`parent@schooltest.local` / `Parent1234!`, D9) → 200 JWT;
  seeded into `localStorage` → `/dashboard` renders the real guarded shell: page title
  `"Your students — SchoolTest · Schooltest"` and meta description match the `Dashboard.meta`
  catalog exactly, `<h1>` reads `"Welcome back, parent!"` sourced live from
  `GET /api/users/me` (curl-verified 200 with `role:{type:"parent"}`), sign-out button
  present. Screenshot saved at `.qa/screenshots/dashboard-en.png` (visually confirmed).
  Axe scan: zero serious/critical violations.
- **Sign-out:** clicking sign-out clears the JWT and the guard reactively
  `router.replace`s back to `/sign-in` with no reload (`localStorage` token verified null).
- **Test run (personally executed):** `pnpm exec playwright test tests/e2e/dashboard.spec.ts
  tests/e2e/sign-in.spec.ts tests/e2e/google-callback.spec.ts` against the live :3100/:5500
  servers → **14/14 passed** (3 new dashboard tests + all pre-existing sign-in/google
  specs, no regressions).
- **tsc/lint:** `pnpm tsc --noEmit` clean, zero output. `pnpm lint` → 0 errors, 1
  pre-existing unrelated warning (`src/modules/articles/components/CreateArticleForm.tsx:69`,
  React Compiler skip on `form.watch()` — not touched by this task).
- **Parity:** full key-shape parity across all 6 locale catalogs (en/zh/ko/ms/vi/th),
  358 keys each, programmatically diffed — includes `Dashboard.meta.title/description`,
  `Dashboard.welcomeTitle/welcomeSubtitle`, `Common.signOut/loading`.
- **No mocks:** `grep -rniE "mock|fake|stub|dummy|placeholder|hardcod"` across all touched
  files returns only honest scope comments ("stub content for now" per this task's own
  spec text, "never hardcoded" in a test comment) — zero actual fixture/mock/canned-data
  code. All data is live (`GET /api/users/me` via the existing `useAuth`/`useMeQuery`
  layer, real JWT from a real `POST /api/auth/local`).
- **Module scaffold:** `src/modules/dashboard/` intentionally ships only
  `components/DashboardScreen.tsx` + `index.ts` — no `queries/types/stores` — because the
  stub owns no data fetching of its own yet (uses the auth module's `useAuth`); matches
  this task's own "keep only what's needed" instruction. The fuller shape lands with
  tasks 16-18's real sections.
- **Minor non-blocking observation** (does not fail any Done Criterion): in
  `ParentGuard.tsx`, the `if (!isAuthenticated) return null` branch is unreachable —
  `isReady` is defined as `hydrated && Boolean(token)`, so whenever `isReady` is true,
  `isAuthenticated` is necessarily also true. Practical effect: the component shows the
  Skeleton through the brief pre-redirect moment rather than `null`, which still satisfies
  "loading skeleton while hydrating" and caused no functional/accessibility failure in the
  live run. Left as-is (out of scope to fix during verification).

Files verified (pre-existing from D19, unchanged by this verification pass):
`src/app/dashboard/page.tsx`, `src/modules/auth/hooks/use-require-parent.ts`,
`src/modules/auth/components/ParentGuard.tsx`,
`src/modules/dashboard/components/DashboardScreen.tsx`, `src/modules/dashboard/index.ts`.
Test file verified (created by the task-15 builder pass, exercised live by this verifier):
`tests/e2e/dashboard.spec.ts`.
