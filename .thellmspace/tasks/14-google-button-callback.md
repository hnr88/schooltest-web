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
2. /auth/google/callback/page.tsx (client page): read searchParams id_token —
   present → writeClientToken(id_token), hydrate user via use-me.query, push /dashboard;
   absent/error → push /sign-in?error=google and the sign-in card surfaces
   Auth.errors.google when that param is present.
## Files
- SignInCard/SignUpCard (button), src/app/auth/google/callback/page.tsx,
  lib in modules/auth/lib/google-callback.ts if parsing grows, messages (Auth.google* keys)
## Done criteria
- Page compiles; callback without id_token redirects to /sign-in?error=google and the
  error renders (REAL browser run); with a synthetic id_token present? — NO synthetic
  JWTs allowed: assert only the no-token path + the button href correctness; the real
  Google path stays BLOCKED (D5) and is documented in the task Evidence.
## Evidence
(filled by builder/verifier)
