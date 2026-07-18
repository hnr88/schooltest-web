---
id: 10
title: Parent-scoped students — GET /api/students + POST /api/students
layer: backend
kind: build
slice: parent-scoped find + parent-ownership-injecting create (anti-leak controller)
target: schooltest-api/src/api/student/{controllers/student.ts,routes/01-custom-parent-students.ts}
contract: C-STUDENT-LIST, C-STUDENT-CREATE
status: TODO
depends_on: [02, 03]
---
## Objective
Borrow schoolgo's ownership pattern for parent callers, WITHOUT breaking the existing
teacher-scoped flows (existing core router + is-owned-teacher policy stay as-is for
teacher/admin; add parent behavior alongside):
1. routes/01-custom-parent-students.ts (loads before core):
   - GET /api/students → controller.find with policy chain (authenticated)
   - POST /api/students → controller.create (authenticated)
2. controllers/student.ts (factory, extend the EXISTING one — read it first and keep
   its teacher logic intact): in find, when caller role type is 'parent', force-merge
   { parent: { documentId: { $eq: caller.documentId } } } into ctx.query.filters AND
   re-apply after sanitizeQuery (the schoolgo anti-leak comment explains why — mirror
   it); teacher path unchanged. In create, when caller is parent: strip
   parent/teacher/class/user/student_key from data, set parent=caller; validate via
   service-level Zod (given_name, family_name, year_level 7..12, email optional valid)
   → 400 typed envelope on violation.
## Files
- controllers/student.ts (extend), routes/01-custom-parent-students.ts (new)
## Project rules
schooltest-api controllers.md + document-service.md rules; sanitizeQuery/sanitizeOutput/
transformResponse in replaced actions.
## Done criteria (REAL)
- Parent JWT: GET /api/students → only their 2 seeded students; POST {data:{given_name:
  'Testa', family_name:'Rig', year_level:9, email:'testa.rig@schooltest.local'}} → 200
  with parent=<caller>; GET again → 3 students. Another UP user (teacher) does NOT see
  the parent's students via the parent route behavior. POST with year_level 5 → 400.
  POST with bogus email → 400. Unauth → 401. tsc zero.
## Evidence
(filled by builder/verifier)
