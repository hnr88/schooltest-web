---
id: 14
title: Google button + /auth/google/callback page
layer: frontend
kind: build
slice: "Continue with Google" wired to /api/connect/google + callback handler
target: schooltest-web/src/modules/auth/components/*, src/app/auth/google/callback/page.tsx, messages
contract: C-AUTH-GOOGLE
status: TODO
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
(filled by builder/verifier)
