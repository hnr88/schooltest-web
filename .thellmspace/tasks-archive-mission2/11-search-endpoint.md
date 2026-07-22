---
id: 11
title: Search endpoint — GET /api/search/students (parent-scoped)
layer: backend
kind: build
slice: typed global search over the caller's students ($containsi)
target: schooltest-api/src/api/search/{controllers/search.ts,routes/01-custom-search.ts,services/}
contract: C-STUDENT-SEARCH
status: DONE
depends_on: [10]
---
## Objective
Borrow schoolgo's global-search shape, scoped per D8:
- routes/01-custom-search.ts: GET /api/search/students → controller.students
  (authenticated; policy global::is-authenticated + parent-role check in controller).
- controllers/search.ts: read q (string, optional, trim ≤80 chars); base filter =
  parent:<caller>; when q non-empty add $or[$containsi given_name, $containsi
  family_name, $containsi email]; sort createdAt desc; limit 10 (hard clamp);
  ctx.body = { data: <student dtos (same shape as C-STUDENT-LIST)>, meta: { query: { q,
  count } } }. Parent-only (403 for non-parent roles? — parents and admins allowed;
  document the choice: parent role type 'parent' OR 'admin').
## Files
- new api folder src/api/search/ (controllers/search.ts, routes/01-custom-search.ts,
  services/search.ts if logic exceeds thin-controller needs)
## Done criteria (REAL)
- Parent JWT: GET /api/search/students?q=keller → both seeded students; q=mia → only
  Mia; q= (empty) → recent ≤10; q=zzz → {data:[], meta.query.count 0}. Query does NOT
  leak other users' students (seed a second parent? — prove with the teacher user that
  the parent filter is applied: teacher gets 403 or scoped-empty per the choice above).
- tsc zero errors.
## Evidence
(filled by builder/verifier)
