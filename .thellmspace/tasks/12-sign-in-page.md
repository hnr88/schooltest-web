---
id: 12
title: Sign-in page — DS sign-in card, password login, bulletproof error model
layer: frontend
kind: build
slice: /sign-in with email+password login and styled inline errors (en+de)
target: schooltest-web/src/app/sign-in/**, src/modules/auth/**, src/i18n/messages/*.json
contract: C-AUTH-LOGIN
status: DOING
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
(filled by builder/verifier)
