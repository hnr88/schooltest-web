---
id: 004
title: Backend parent-create validation mirrors mandatory fields incl. media
layer: backend
kind: fix
slice: POST /api/students rejects missing required fields/media
target: schooltest-api/src/api/student
contract: C-STUDENT-CREATE (parent)
status: DONE
depends_on: []
---
## Objective
Client-side requiredness is not a boundary. parentStudentCreateSchema
(src/api/student/services/parent-student-schemas.ts:58-84) must require the same field set
the wizard now mandates (incl. photo + voice_intro non-null positive ints), and the media
gate (services/parent-media.ts assertStudentMedia, skips null at line 57) must reject
missing media for parent creates.
## Files
- src/api/student/services/parent-student-schemas.ts (required fields + photo/voice_intro required)
- src/api/student/services/parent-media.ts (reject null/undefined for parent create path)
- src/api/student/controllers/student.ts (create: 400 ValidationError with clear message)
## Constraints
- Do NOT touch student/schema.json required flags (would break the item-bank seed cohort).
- Keep PUT/edit path semantics unchanged unless the same schema is shared; if shared, scope
  strictness to create only.
- api/CLAUDE.md + .claude/rules binding; pnpm tsc --noEmit + pnpm lint in schooltest-api.
## Done criteria
- POST /api/students (parent JWT) missing photo or voice_intro -> 400; missing any mandated
  field -> 400; complete payload -> 200/201 and the row persists with both media linked.
## Verification evidence
Live (orchestrator, 2026-07-24): POST /api/students {given_name only} -> 400
ValidationError listing all 15 mandated fields incl. photo/voice_intro; complete-minus-media
-> 400 listing photo + voice_intro. Committed api 51d759f.
