---
id: 14
title: Google button + /auth/google/callback page
layer: frontend
kind: build
slice: "Continue with Google" wired to /api/connect/google + callback handler
target: schooltest-web/src/modules/auth/components/*, src/app/auth/google/callback/page.tsx, messages
contract: C-AUTH-GOOGLE
status: DONE
depends_on: [09, 12]
---
## Objective
1. Sign-in card Google button → plain anchor to `${NEXT_PUBLIC_API_BASE_URL}/api/connect/google`
   (visible always per task-12 decision; when the provider is off the api returns its
   provider error — acceptable pre-credentials; add a title attr from Auth.googleTitle).
   Same button on the sign-up card.
2. /auth/google/callback/page.tsx (client page) — the CORRECTED flow (D18):
   forward the FULL incoming query (access_token, id_token, raw[...]) to
   GET <API>/api/auth/google/callback (publicApi.get with the query string
   preserved verbatim); on 200 → writeClientToken(response.jwt), hydrate user via
   use-me.query, push /dashboard; on error/absent query → push /sign-in?error=google
   and the sign-in card surfaces Auth.errors.google when that param is present.
   NEVER store the query's id_token (it is Google's OIDC token, not our session).
## Files
- SignInCard/SignUpCard (button), src/app/auth/google/callback/page.tsx,
  lib in modules/auth/lib/google-callback.ts if parsing grows, messages (Auth.google* keys)
## Done criteria
- Page compiles; callback WITHOUT a query redirects to /sign-in?error=google and the
  error renders (REAL browser run); the button href points at
  <API>/api/connect/google; the forward-to-API path is asserted with the REAL api
  (a bogus query → the api answers its real error and the page routes to the error
  state — no synthetic JWTs ever); the real Google path stays BLOCKED (D5) and is
  documented in the task Evidence.
## Evidence
Independently verified (2026-07-18) against the live api (:5500) and web (:3100), no mocks:

- **C-AUTH-GOOGLE backend contract**: `curl GET /api/auth/google/callback` with no query
  AND with a bogus `?access_token=...&id_token=...` query both return the real,
  env-gated `400 {"error":{"status":400,"name":"ApplicationError","message":"This
  provider is disabled"}}`, byte-exact vs CONTRACTS.md (GOOGLE_ENABLED is off — D5, no
  credentials exist or were fabricated). `GET /api/connect/google` is likewise a real
  400, not a dead link.
- **Button**: real anchors on both `/sign-in` and `/sign-up`, `href` =
  `http://localhost:5500/api/connect/google` (env `NEXT_PUBLIC_API_BASE_URL`, D7),
  `title` = `Auth.googleTitle`. Confirmed via Playwright `getByRole('link')` + source
  read (`GoogleButton.tsx` builds the href from `env.NEXT_PUBLIC_API_BASE_URL`).
- **No-query path**: real browser run of `/auth/google/callback` (no query) → redirects
  to `/sign-in?error=google`; styled `Alert` (`data-slot="alert"`) visible with
  `Auth.googleError` text; `localStorage['app.auth.token']` stays `null`; axe scan 0
  serious/critical violations.
- **Forward-to-API path**: `/auth/google/callback?access_token=bogus...&id_token=bogus...`
  → query forwarded verbatim to the real api → same real rejection → same redirect →
  token still `null`. No synthetic JWT ever created. `id_token` is never read/parsed/
  stored anywhere in the new code (grep-confirmed: only appears in explanatory
  comments) — matches D18's "never store the query's id_token" requirement.
- **Existing-token bypass**: a pre-seeded token still redirects `/sign-in?error=google`
  straight to `/dashboard` (error param never blocks an already-authenticated visit).
- **Tests**: `tests/e2e/google-callback.spec.ts` 5/5 green (own re-run). Own independent
  ad-hoc temp Playwright+axe spec (error-state axe-clean+alert, sign-up button+axe-clean,
  bogus-query-never-persists-token) 3/3 green, deleted after use. Full suite re-run
  twice: 37/37 both times (one isolated `design-system.spec.ts` "DS interactions" flake
  on the first parallel run, not reproduced on rerun or in isolation — confirmed
  pre-existing/unrelated, file untouched by this task, matches the same documented flake
  in tasks 12/13's evidence).
- **Static checks**: `pnpm tsc --noEmit` 0 errors. `pnpm lint` 0 errors (1 pre-existing
  unrelated warning in untouched `CreateArticleForm.tsx`, same as every prior task).
- **Mock/fake grep**: touched/new files grepped for
  mock/fake/stub/dummy/placeholder/hardcoded — only benign hits (explanatory comments,
  the same already-accepted literal `'stub-jwt'` localStorage-seed string used
  identically in `sign-in.spec.ts`/`sign-up.spec.ts`).
- **Scope/quality**: no edits to `src/components/ui/*`; barrel-only cross-module import
  (`GoogleCallbackScreen` via `modules/auth/index.ts`); all new/touched files well under
  the 200/120-line limits (largest new file is `page.tsx` at 40 lines). i18n:
  `Auth.googleConnecting` + `Auth.googleCallbackMeta.{title,description}` present and
  byte-identical across all 6 locales (en/zh/ko/ms/th/vi, D17 English-fallback policy),
  confirmed programmatically; the callback page's real rendered `<title>`/`<meta
  description>` curl-verified live against :3100.
- **BLOCKED (D5/D18), reaffirmed**: the real Google consent round-trip cannot be
  exercised — no `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` exist anywhere on this box
  and none were fabricated. Everything exercisable without those credentials (button
  hrefs on both cards, the callback page's verbatim query-forwarding, the api's real
  typed error driving the error UI, the id_token-never-stored guarantee) is real and
  e2e-proven above. The unexercisable consent-flow piece is left for task 24's BLOCKED
  documentation.
