# B06 — seeded scored Test A result

## What was missing

`class-detail.spec.ts` flow 4 failed with
`no student with a scored Test A — the fixture seed must run first` (solo repro:
1 failed / 3 passed / 2 did not run). Confirmed independently:

- Live `GET /api/schools/me/classes/hr2i9jmhfs6uf4mxcajj923m` ("Reading 8A —
  Okonkwo") showed all 20 students with Test A `not_started` and `score: null`.
- The database held zero results for any `a1s%` student; the only complete
  results belonged to `a2s%` rows — leftovers from other lanes, not seed.
- No seed writer produced one: `seed-writers.registry.ts` listed writers that
  never write sittings, sessions or results, and
  `seed-journey-fixture.ts` documented the status-complete descriptor
  (studentIndex 6) as catalogue-only, not executed.

## The fix — which side was wrong

The DATA was missing; the spec was correct and was not touched (out of scope).
Added `schooltest-api/src/bootstrap/seed-scored-result.ts`, registered in
`seed-writers.registry.ts` and called from `seed.ts` immediately after
`seedJourneyFixture`.

## How the result is produced — the REAL scoring path

The writer fabricates nothing:

1. Resolves the journey fixture's `status-complete` student (a1s07) and the
   class teacher from the fixture's own catalogue (`journeyStateStudentEmail`,
   `JOURNEY_CLASSES[0].teacherEmail`).
2. Resolves the live parallel pair for year band `7_9` via
   `resolveParallelPair` — benchmark form `RDG-FT-A-79` (both forms verified
   active/reading/progress in the DB before writing the writer).
3. Creates a progress-mode session via the real
   `SessionService.createSession(teacher, …)` — the same service the HTTP
   controller calls.
4. Reads the session's persisted `stage_plan`, flattens it with the same
   `flattenStagePlan` the submit path uses, and submits every item via the real
   `ResponseService.submitResponse(studentAuth, …)` with each `raw_response`
   derived from the item's own seeded `correct_key` (single → `option_id`,
   multi → `answers`; anything else throws loudly).
5. The session-end hook creates the official reading Result and enqueues
   r-scoring exactly as it does for a real student. The writer confirms the
   Result row exists with destination `official` and returns; the r-scoring
   BullMQ worker (registered after `seed()` in bootstrap, waiting for HTTP
   listening) completes the score seconds after boot.

Idempotence: guarded by `findFirst(result where student + skill:reading +
destination:official)` — a re-seed logs "already exists" and skips. The
structural property is asserted by `tests/unit/seed-idempotence-property.spec.ts`
(registry/writer consistency, find-guard present).

## Verification

<!-- RUN-OUTPUTS -->
