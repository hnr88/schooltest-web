---
id: 16
title: Dashboard — students list with real data + empty state
layer: frontend
kind: build
slice: students table/cards fed by C-STUDENT-LIST via TanStack Query
target: src/modules/dashboard/{components/StudentsSection.tsx,queries/use-students.query.ts,schemas/student.schema.ts,types/}
contract: C-STUDENT-LIST
status: TODO
depends_on: [10, 15]
---
## Objective
The dashboard's core section:
- schemas/student.schema.ts: Zod for the CONTRACTS.md student shape + the v5 collection
  envelope (reuse StrapiCollectionResponse pattern from lib/axios/strapi.ts).
- queries/use-students.query.ts: GET /api/students via the typed strapi axios instance
  (JWT interceptor already attaches the parent token), parse via the schema.
- components/StudentsSection.tsx (client): heading + count; loading skeletons; EMPTY
  STATE (DS EmptyState: icon, "No students yet", body, "Add your first student" —
  wired to task-17's dialog trigger); populated state = DS Table (Name / Year level /
  Email / Added) with translated headers (en+de); error state = Alert error + retry.
  DashboardScreen composes it inside the task-15 shell.
## Files
- the above + DashboardScreen.tsx + messages (Dashboard.students* keys)
## Done criteria
- REAL: seeded parent sees Mia + Jonas in the list (browser run); a freshly-registered
  parent (no students) sees the empty state; tsc+lint zero; axe clean; parity; schema
  rejects a malformed payload (verifier proves via a tampered response parse).
## Evidence
(filled by builder/verifier)
