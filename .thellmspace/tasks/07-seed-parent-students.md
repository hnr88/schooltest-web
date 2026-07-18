---
id: 07
title: Seed — parent user + two linked students with emails
layer: data
kind: build
slice: idempotent seed of the parent e2e account + linked students
target: schooltest-api/src/bootstrap/seed-users.ts (+ seed-users-data.ts if that file holds the data)
contract: SEED (CONTRACTS.md)
status: DONE
depends_on: [02, 03]
---
## Objective
Extend the existing bootstrap seed (idempotent, runs when SEED=true) to create:
- UP user parent@schooltest.local / Parent1234!, provider local, confirmed, role
  type 'parent' (fetch by type from up_roles).
- Students: "Mia Keller" year_level 8 email mia.keller@schooltest.local and
  "Jonas Keller" year_level 10 email jonas.keller@schooltest.local, each with
  parent=<that user>, given_name/family_name set. Idempotent: look up by email/user
  first; update-or-create (never duplicate on re-run).
Follow the existing seed-users.ts pattern (Document Service user.add hashes passwords).
## Files
- seed-users.ts (+ data file if the current seed separates data)
## Steps
1. Read existing seed. 2. Append parent + students section. 3. Re-run seed (restart api
   or trigger bootstrap). 4. Prove rows: console query — parent user exists with role
   parent; both students exist with parent set and emails.
## Done criteria
- Idempotent seed (second run = no new rows); rows provable via console query output;
  login POST /api/auth/local parent@schooltest.local+Parent1234! returns 200 with a JWT
  (REAL request); tsc zero.
## Evidence
(filled by builder/verifier)
