---
id: 03
title: Parent role + bootstrap permission grants
layer: backend
kind: build
slice: custom 'parent' role + ROLE_ACTIONS for students/magic-link/users-me
target: schooltest-api/src/bootstrap/roles.ts, permissions-actions.ts, permissions.ts
contract: C-STUDENT-LIST, C-STUDENT-CREATE, C-STUDENT-SEARCH, C-ML-ISSUE, C-AUTH-ME
status: DONE
depends_on: [02]
---
## Objective
Add custom role `parent` (type 'parent', name 'Parent') to the bootstrap role matrix
(src/bootstrap/roles.ts CUSTOM_ROLES) and grants in permissions-actions.ts:
- api::student.student.find/findOne/create (parent-scoped enforcement lands in task 10
  controller — the role grant enables the routes)
- api::student-magic-link.student-magic-link.requestMagicLink (task 06, name as built there)
- plugin::users-permissions.user.me? (users/me is covered by the authenticated role
  already — verify and note; if the plugin 'me' action lives on authenticated role, no
  extra grant needed — check how teacher gets /users/me today and mirror it)
Follow the existing idempotent ensureRoles + ensureRolePermissions pattern exactly
(every boot, query-engine). No permission for public role beyond what exists.
## Files
- roles.ts (append parent entry), permissions-actions.ts (append parent ROLE_ACTIONS)
## Steps
1. Read the existing matrix. 2. Append parent role + actions. 3. Restart api; confirm
   via console or DB query that the role exists with the new grants (strapi console:
   list roles type=parent). 4. tsc zero.
## Done criteria
- Role `parent` exists in up_roles with the granted actions (query proof); idempotent
  on re-run (second bootstrap doesn't duplicate); tsc zero errors.
## Evidence
PASS (independent verifier, 2026-07-18): role `parent` exactly once (id 6) with all 6 grants (student.find/findOne/create, student-magic-link.requestMagicLink, search.students, users-permissions.user.me) proven by DB join; idempotent (1 role/6 rows across re-bootstrap); teacher 403 on /users/me confirmed — pre-existing gap, parent explicitly granted; tsc 0, lint 0 errors; scope roles.ts + permissions-actions.ts only.
(filled by builder/verifier)
