---
id: 01
title: Email provider — SMTP config in schooltest-api
layer: backend
kind: build
slice: @strapi/provider-email-smtp installed + email block in config/plugins.ts
target: schooltest-api/config/plugins.ts, .env.example, .env, src/bootstrap/validate-env.ts, package.json
contract: C-ML-REQUEST (delivery dependency)
status: DONE
depends_on: []
---
## Objective
Give the api real email delivery: install `@strapi/provider-email-smtp` (matching the
5.50.1 Strapi pin), add the `email` plugin config (provider smtp, providerOptions host/
port/secure from env, settings defaultFrom/defaultReplyTo no-reply@schooltest.local),
env vars in `.env.example` + the running `.env` (EMAIL_SMTP_HOST=127.0.0.1,
EMAIL_SMTP_PORT=1025, EMAIL_SMTP_SECURE=false), and extend `validate-env.ts` so prod
requires EMAIL_SMTP_HOST (dev warns only).
## Files
- schooltest-api/package.json (pnpm add @strapi/provider-email-smtp@5.50.1)
- schooltest-api/config/plugins.ts (add email block BEFORE users-permissions key)
- schooltest-api/.env.example (+EMAIL_SMTP_HOST/PORT/SECURE, EMAIL_DEFAULT_FROM/REPLY_TO)
- schooltest-api/.env (same values pointed at Mailhog)
- schooltest-api/src/bootstrap/validate-env.ts (prod-required list += EMAIL_SMTP_HOST)
## Steps
1. pnpm add the provider package. 2. plugins.ts email config (follow schoolgo-api's
   email block shape, but smtp). 3. env files. 4. validate-env. 5. Restart api (kill the
   dev process on :5500 and let the watchdog/session restart it — or start a background
   `pnpm dev` yourself and log the pid) — verify /api/health 200.
## Done criteria
- `strapi.plugin('email').services.email.send` is callable at runtime (prove in a later
  task via C-ML-REQUEST); tsc zero errors; api healthy after restart; Mailhog receives a
  test send (send one via `pnpm strapi console` one-liner and assert it in Mailhog API).
## Evidence
PASS (independent verifier, 2026-07-18): nodemailer@5.50.1 installed (@strapi/provider-email-smtp does not exist on npm — E404); email plugin block env-driven (127.0.0.1:1025, no-reply@schooltest.local); .env.example + validate-env updated; api healthy on :5500 after restart; verifier sent a fresh message via the api email service → Mailhog 250-queued + searchable (From no-reply@schooltest.local); tsc 0, lint 0 errors; scope exactly the five tracked files.
(filled by builder/verifier)
