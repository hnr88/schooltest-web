---
id: 08
title: users-permissions extension — register assigns parent role
layer: backend
kind: build
slice: src/extensions/users-permissions/strapi-server.ts register wrap
target: schooltest-api/src/extensions/users-permissions/strapi-server.ts
contract: C-AUTH-REGISTER
status: DONE
depends_on: [03]
---
## Objective
Borrow schoolgo-api's extension pattern: create src/extensions/users-permissions/
strapi-server.ts exporting default (plugin) => { plugin.controllers.auth.register =
wrapped } where the wrapped register: calls the original, then assigns the up_role with
type 'parent' to the created user (Document Service update on the UP user). Do NOT
accept any client-sent role/userType — this is a parent-portal registration; every
registrant becomes 'parent' (documented; other roles are provisioned by seed only).
Keep plugin return shape stock ({jwt, user}).
## Files
- strapi-server.ts (new folder src/extensions/users-permissions/)
## Project rules
schooltest-api rules; register extension must not break /api/auth/local (login).
## Done criteria (REAL)
- POST /api/auth/local/register {username:'e2eparent2', email:'parent2@schooltest.local',
  password:'Parent1234!'} → 200 {jwt, user}; GET /api/users/me with that jwt → role.type
  === 'parent'. Duplicate email → 400 taken. Login still works for the seeded parent.
- tsc zero errors.
## Evidence
(filled by builder/verifier)
