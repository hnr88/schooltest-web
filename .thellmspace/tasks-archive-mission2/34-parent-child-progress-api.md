---
id: 34
title: Parent-owned child progress metrics API
layer: backend
kind: implement
slice: GET child test/result summary persisted in Strapi/PostgreSQL
target: schooltest-api/src/api/student/{controllers,services,routes}; schooltest-api/src/bootstrap/{permissions-action-refs,permissions-actions}.ts; schooltest-api/src/contracts; schooltest-api/tests/e2e; web .qa contract/state artifacts
contract: C-PARENT-CHILD-PROGRESS
status: DONE
depends_on: [33]
---
## Objective

Expose a parent-owned child profile progress read that uses the real student, session and result
rows to return useful metrics and latest official test summaries.

## Contract

Implement `C-PARENT-CHILD-PROGRESS` exactly: parent JWT, own-child 200 projection, 404 for
foreign/unknown, 403 non-parent/anonymous, no writes, explicit Document Service populate/fields.

## Files

The named Strapi controller/service/route/action grants, shared typed contracts as required by
the API idiom, API live E2E, plus the already-recorded web contract artifact.

## Depends on

Task 33 is a frontend-only accessibility change; no schema migration dependency exists.

## Steps

1. Re-read API controller/service/route/document-service rules and existing parent detail code.
2. Add a custom route before the generic student detail route and a thin typed controller.
3. Query only parent-owned student/session/official-result rows through Document Service.
4. Grant only the intended parent action and test success, foreign, unauthenticated and malformed
   requests against live PostgreSQL records.

## Project rules

Strapi v5 Document Service only, `documentId`, explicit populate, typed errors, Zod boundary
validation, no Entity Service or generic core CRUD exposure.

## Done criteria

The live API exactly conforms to the contract and uses persisted rows that survive reload;
authorization probes show no cross-parent disclosure; API tsc/lint and E2E pass.

## Assumptions

The existing result/session schemas contain sufficient persisted fields for a parent-safe summary.

## Evidence

Live Strapi route registration confirmed `/api/my/students/:documentId/progress` before the
detail wildcard. A real seeded-parent request returned the persisted child projection and
real zero-valued session/result metrics (the queried child has no session or result rows),
then returned the identical data on a fresh request. Focused API E2E passed 2/2: own,
foreign 404, malformed path/query 400, anonymous/non-parent 403. API `pnpm tsc --noEmit`,
`pnpm lint`, `git diff --check`, and the touched-code banned-pattern scan passed cleanly.
