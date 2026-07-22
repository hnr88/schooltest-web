---
id: 12
title: Sign-in page — DS sign-in card, password login, bulletproof error model
layer: frontend
kind: build
slice: /sign-in with email+password login and styled inline errors (en+de)
target: schooltest-web/src/app/sign-in/**, src/modules/auth/**, src/i18n/messages/*.json
contract: C-AUTH-LOGIN
status: DONE
depends_on: []
---
## Objective
Build the parent sign-in page per the DS doc sign-in card (section 17): centered card —
"Welcome back" + subtitle + Google button (hidden when the api provider is off, D5 —
detect via a /api/connect/google HEAD probe at build/runtime? NO: render the button
always but disabled with a tooltip? — DECIDE: render it; task 14 wires behavior. Keep a
constant GOOGLE_ENABLED=false until task 14), divider "or", email + password fields
(label, placeholders per design), "Forgot password?" link (→ /api/auth/forgot-password
is out of scope — link points to a /forgot-password page? — NOT in scope; render the
link as part of the design pointing to /sign-up? NO — per no-fake-links: omit the
forgot-password link in this milestone and note it), "Sign in" submit (loading state),
and "New to SchoolTest? Create an account" → /sign-up.
Behavior: react-hook-form + zodResolver (new sign-in schema in modules/auth/schemas/
sign-in.schema.ts) → existing use-login.mutation (POST /api/auth/local via typed axios)
→ writeClientToken(jwt) + set user in the auth store → router.push('/dashboard').
Error model (bulletproof): 400 → inline error summary (translated key, e.g.
Auth.errors.invalidCredentials) rendered in an Alert variant="error" + aria-live;
network failure → Auth.errors.offline; unknown → Auth.errors.server. No raw Strapi
strings; same message for unknown email vs wrong password (the api already behaves so).
Redirect: already-authenticated users (auth store has jwt) land on /dashboard instead.
Page lives OUTSIDE the landing chrome (its own minimal centered layout with the logo
link home). All copy in en+de message catalogs (new Auth.* keys; parity script).
## Files
- src/app/sign-in/page.tsx (server shell + generateMetadata from Auth.meta)
- src/modules/auth/components/{SignInCard.tsx,SignInForm.tsx} (client leaves)
- src/modules/auth/schemas/sign-in.schema.ts, index.ts barrel updates
- messages en.json + de.json (Auth namespace additions incl. meta)
## Project rules
schooltest-web rules (CLAUDE.md + rules/*): DS module components only, no ui edits,
RHF+zod, no hardcoded strings, en/de parity, ≤200/≤120 lines, axe-clean (labels, focus,
44px targets).
## Done criteria
- REAL: /sign-in renders per design (screenshot vs DS card); login with the seeded
  parent → lands on /dashboard; wrong password → styled inline error (not a Strapi page);
  tsc+lint zero; axe 0 serious/critical on the page; en+de parity.
## Evidence
**Verdict: PASS** — independent verifier, 2026-07-18, all evidence gathered live against
the real running api (:5500) and web (:3100), no mocks/stubs in touched code.

Backend contract (C-AUTH-LOGIN), curl against the real api:
- `POST /api/auth/local` seeded parent → `200 {jwt, user:{id,documentId,username,email,
  confirmed,blocked,...}}`.
- `POST /api/auth/local` wrong password → `400 {error:{status:400,name:"ValidationError",
  message:"Invalid identifier or password"}}`.
- `POST /api/auth/local` unknown email → byte-identical 400 message (no enumeration).
- `GET /api/connect/google` → real `400 {error:{message:"This provider is disabled"}}`
  (the sign-in card's Google button is a live link to this, not a dead/fake one).

Frontend, real browser (Playwright, chromium):
- `tests/e2e/sign-in.spec.ts` 6/6 green (DS card structure + no forgot-link + axe clean;
  empty-submit validation with no api call; wrong password → styled `Alert`, url stays
  `/sign-in`; seeded-parent login → real `/dashboard` heading "Welcome back, parent";
  existing-token redirect; zh catalog render).
- Full suite `pnpm exec playwright test` 25/25 green (design-system.spec.ts flake from
  the prior report not reproduced).
- Own ad-hoc temp specs (written, run, then deleted — not left in the tree): incognito
  `/dashboard` visit → redirected to `/sign-in`; real login → real dashboard heading →
  survives a page reload (session persistence) → axe 0 serious/critical; wrong password
  → styled alert, never a raw Strapi page. Separately measured live tap targets: Sign-in
  button, email/password inputs, Google link, password eye-toggle all render at
  44×44px+.
- `pnpm tsc --noEmit` → 0 errors. `pnpm lint` → 0 errors (1 pre-existing warning in
  untouched `CreateArticleForm.tsx`, unrelated React Compiler/RHF `watch()` note).
- i18n parity independently recomputed: 342 keys × 6 locales (en/zh/ko/ms/vi/th per D17,
  which supersedes this file's stale "en+de" wording), zero diff across locales.
- Grepped every touched/new file for mock/fake/stub/dummy/placeholder/hardcoded: only
  benign hits (HTML `placeholder=` attrs; one test seeding `localStorage` with a literal
  `'stub-jwt'` string purely to exercise the client-side "already authenticated →
  redirect" branch — the real api would honestly 403 that token if it were ever used to
  call `/api/users/me`, so no server response is faked).
- No edits to `src/components/ui/*`; all touched/new files within the 200/120-line caps;
  cross-module imports go through barrels only (module-pattern/imports rules respected).

Scope note (see DECISIONS D19): attempt-1 verification found this task's own done
criterion "login with the seeded parent → lands on /dashboard" genuinely false (`/dashboard`
404'd — that route is task 15's target, still TODO, no dependency edge from task 12). The
builder closed this task-12-owned gap for real by shipping a minimal, honestly-wired
`/dashboard` shell (`useRequireParent`, `ParentGuard`, `dashboard` module) rather than
rescoping the criterion away. This verification pass re-confirmed that shell live
(real `GET /api/users/me` data, real redirect-when-unauthenticated, real reload
persistence) and treats it as sufficient to satisfy task 12's own criterion. Task 15
remains TODO/unverified as its own task — this pass does not claim to have verified task
15's full done criteria (skeleton/loading polish, fuller module shape) and STATE.json/
STATE.md leave it TODO.

Known non-blocking gaps reconfirmed independently (pre-existing, not task-12 target
files, not consumed by any task-12 code — recorded for whoever owns the fix):
- `POST /api/auth/local`'s 200 response omits `role` (contra CONTRACTS.md C-AUTH-LOGIN's
  documented shape); `GET /api/users/me` does return `role` correctly. No frontend code
  in task 12 reads `user.role` from the login response. (D19)
- Unauthenticated `GET /api/users/me` answers `403 Forbidden`, not the `401` CONTRACTS.md
  documents for C-AUTH-ME. (D15)
