---
id: 23
title: E2E — student magic link: request in the app → Mailhog → verify → /home
layer: integration
kind: verify
slice: the full passwordless flow across schooltest-app + api + Mailhog
target: schooltest-app/tests/e2e/magic-link-live.spec.ts (new, playwright there) or a node-driven spec here — DECIDE: put it in schooltest-app/tests/e2e-live/ with its own playwright config pointed at the renderer on :3002
contract: C-ML-REQUEST, C-ML-VERIFY, C-ML-ME
status: TODO
depends_on: [05, 07]
---
## Objective
REAL end-to-end for the desktop flow (browser-level renderer, per the mission note):
1. Start the schooltest-app renderer: `pnpm dev:next` in schooltest-app on port 3002
   (NEXT_PUBLIC_API_URL=http://localhost:5500 in its .env.local; DEV_AUTH unset).
2. Drive: open http://localhost:3002/en/ → the login screen renders → enter
   mia.keller@schooltest.local → submit → "email sent" state renders (translated copy
   from the app's messages).
3. Poll Mailhog API (:8025) for the newest message to mia.keller@schooltest.local →
   extract the `http://localhost:3002/en/auth/student/verify?token=<hex>` link from the
   HTML body → page.goto it → the verify page consumes C-ML-VERIFY → lands on /home
   (authenticated content visible per the app's own copy).
4. Assert /api/auth/student/me returns 200 with the session (call from the page context
   or via the JWT in localStorage schooltest-auth).
ONE email consumed per run (never re-request the same token path twice per
zero-tolerance UI-loop rule; a fresh token is minted per run anyway).
## Files
- schooltest-app/tests/e2e-live/magic-link.spec.ts + playwright.live.config.ts
  (webServer: `pnpm dev:next` port 3002) + support/mailhog.ts helper
## Done criteria
- Spec green against the real api; the Mailhog message is real; the verify landing is
  the app's real page; tsc zero in schooltest-app.
## Evidence
(filled by builder/verifier)
