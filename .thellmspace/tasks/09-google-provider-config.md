---
id: 09
title: Google OAuth provider — env-gated grant config
layer: backend
kind: build
slice: users-permissions grant config for Google (active only with credentials)
target: schooltest-api/config/plugins.ts, .env.example, .env, src/bootstrap/validate-env.ts, FRONTEND_URL
contract: C-AUTH-GOOGLE
status: TODO
depends_on: []
---
## Objective
Wire stock users-permissions Google provider (grant), ENV-GATED per D5:
- config/plugins.ts users-permissions.config.providers.google: enabled only when
  env('GOOGLE_CLIENT_ID') is set; clientId/clientSecret from env; callback URL
  `${PUBLIC_URL}/api/auth/google/callback`; scope openid email profile.
- Add FRONTEND_URL env (default http://localhost:3100) — the plugin redirects the
  browser to FRONTEND_URL/auth/google/callback with ?id_token=<jwt> after consent.
- .env.example += GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/FRONTEND_URL (commented);
  validate-env: when GOOGLE_CLIENT_ID is set, GOOGLE_CLIENT_SECRET must also be set
  (prod-throws on partial config, dev warns).
## Files
- plugins.ts, .env.example, validate-env.ts
## Done criteria
- tsc zero errors; api healthy; with credentials ABSENT the api boots normally and
  /api/connect/google responds with the plugin's provider-disabled error (not a 500
  crash); config verified readable at runtime (console: plugin config shows google
  disabled/empty when no env).
## Evidence
(filled by builder/verifier)
