---
id: 13
title: Sign-up page — register → parent role → dashboard
layer: frontend
kind: build
slice: /sign-up using the extended register endpoint
target: schooltest-web/src/app/sign-up/**, src/modules/auth/**, messages
contract: C-AUTH-REGISTER
status: DONE
depends_on: [08, 12]
---
## Objective
Sibling of the sign-in card per D10: username + email + password (+ confirm password
client-side match), same card layout/copy-family (en+de). Submit → existing
use-register.mutation (POST /api/auth/local/register) → writeClientToken → /dashboard.
Errors: 400 taken email/username → Auth.errors.taken; password <6 → field-level zod;
network → offline model from task 12. Link back to /sign-in ("Already have an
account?"). generateMetadata from Auth.meta.
## Files
- src/app/sign-up/page.tsx, src/modules/auth/components/{SignUpCard,SignUpForm}.tsx,
  schemas/sign-up.schema.ts, barrel, messages
## Done criteria
- REAL: register a fresh parent via the UI → lands on /dashboard; role.type=parent
  proven by a follow-up GET /api/users/me (assert in the verifier); taken email shows
  the styled error; tsc+lint zero; axe clean; parity.
## Evidence
(filled by builder/verifier)

**Independent verifier pass — PASS.**

- C-AUTH-REGISTER curl-verified against the live api on :5500: fresh registration
  (`verifyuser380470007` / `verify380470007@schooltest.local`) → real `200 {jwt,user}`;
  follow-up `GET /api/users/me` with that jwt → real `200` with `role.type:"parent"`
  (task 08's extension confirmed live, not inferred from the UI). Row independently
  confirmed PERSISTED across a reload path by querying Postgres directly
  (`docker exec schooltest-api-st1-postgres psql`): `up_users` has id 57 with the
  matching `document_id`, and the `up_users_role_lnk` → `up_roles` join resolves to
  `type=parent`. Taken email/username → real `400
  {error:{status:400,message:"Email or Username are already taken"}}`, byte-exact
  vs CONTRACTS.md.
- `/sign-up` renders as the DS sibling of `/sign-in` (logo, title/subtitle,
  username/email/password/confirm-password fields, submit CTA, "Already have an
  account? Sign in" → `/sign-in`, no dead links).
- `pnpm exec playwright test tests/e2e/sign-up.spec.ts` → 7/7 passed against the live
  api/web (own re-run). Full suite re-run → 32/32 passed (the previously-reported
  `design-system.spec.ts` "DS interactions" flake did not reproduce in this run).
- Own ad-hoc offline-path check (`route.abort` on the register call) confirms the
  `classifyError` network branch renders the real "You appear to be offline…" Alert,
  matching task 12's error model.
- Own ad-hoc live tap-target measurement on `/sign-up` @1280×800 reproduces the
  builder's numbers: username/email/password/confirm-password inputs and the submit
  button 384×44px; both eye-toggle buttons 44×44px (WCAG 2.5.8 — footer sign-in text
  link exempt, same as the sign-in card).
- `pnpm tsc --noEmit` → 0 errors. `pnpm lint` → 0 errors (1 pre-existing unrelated
  warning in untouched `CreateArticleForm.tsx`, reproduced independently).
- i18n parity re-verified programmatically: all 6 locale catalogs (en/zh/ko/ms/th/vi)
  have identical 355 keys; the 11 new sign-up keys + `signUpMeta` are byte-identical
  across zh/ko/ms/th/vi vs en (honest English-fallback per D17, zero mismatches).
- Grepped all new/touched files for mock/fake/stub/dummy/placeholder/hardcoded: only
  benign hits (HTML `placeholder=` attrs; the same accepted literal `'stub-jwt'`
  localStorage-seed pattern used in `sign-in.spec.ts`, exercising only the client
  redirect branch — the real api would honestly reject that token). No edits to
  `src/components/ui/*`. All touched/new files within the 200/120-line limits;
  barrel-only cross-module imports confirmed.
- Non-blocking deviation noted: `page.tsx` uses a new `Auth.signUpMeta` namespace
  instead of reusing `Auth.meta` (reusing it would have put the sign-in page's
  title/description on `/sign-up`) — not a done-criterion, contract, or CONTRACTS.md
  item, so non-blocking.
