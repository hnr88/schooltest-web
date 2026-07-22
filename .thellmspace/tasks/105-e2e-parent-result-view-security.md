---
id: "105"
title: Prove the C-PARENT-RESULT-VIEW ownership and error matrix from the client boundary
layer: security
kind: verify
slice: The four-way proof that widening `GET /api/results/:documentId` to parents leaked nothing
target: tests/e2e/w3-parent-result-view-security.spec.ts
contract: C-PARENT-RESULT-VIEW
design: .qa/design/spec/02-portal-children.md#B.5 Component: SkillsCard (L43–55)
status: TODO
depends_on: ["092", "093"]
---

## Objective

Task 090–093 made a result readable by a parent for the first time. This task is the adversarial
counterpart: prove with real requests that a parent can read ONLY their own child's official
results, that every other case is an indistinguishable `404`, and that the client's error
classification maps each case to the state the UI will actually render.

## Contract

`.qa/CONTRACTS.md` → **C-PARENT-RESULT-VIEW**, quoted in full for the parts under test:

- **Ownership:** the result's `student.parent.documentId` MUST equal the caller's `documentId`
  **and** `destination` MUST be `official`. Anything else ⇒ `404 NotFoundError` (never 403 — a
  parent must not be able to probe which result ids exist).
- **Errors:** `401` no/invalid JWT · `403` role not permitted · `404` unknown id, foreign child,
  or `destination='transient'`.
- **Security note (verbatim):** *"this widens who can read a result row. The verify task for it MUST
  prove, with real requests: parent reads own child's official result → 200; parent reads ANOTHER
  parent's child's result → 404; parent reads own child's transient result → 404; no JWT → 401."*
- **Persistence effect:** none. Every request in this spec is a read; nothing in Postgres changes.
- Success body is the BARE `ResultView` (no `{ data, meta }` envelope —
  `schooltest-api/src/api/result/controllers/result.ts:23-28`).

Client-side half, from task 092's state table: `404` and `400` ⇒
`classifyQueryError → { kind: 'gone' }`; `403` ⇒ `{ kind: 'forbidden' }`; `ZodError` ⇒
`{ kind: 'broken', cause: 'contract' }`. The spec asserts the mapping, not just the status code —
a correct status rendered as the wrong message is still a defect.

## Design source

`.qa/design/spec/02-portal-children.md` §B.5 **SkillsCard** (`portal--child-detail.html` L43–55) is
the only parent surface that consumes this endpoint's `attributes` map. The design shows no error,
loading or forbidden rendering for it at all (that file's UNKNOWNS list: *"Focus / active / disabled
/ loading states for every interactive element on all four screens"* are absent). So the states this
spec pins down are the authored ones from task 092/100, and W6 renders them with the existing
`QueryErrorFallback` + the design's shimmer (`st-shimmer 1.4s linear infinite`).

## Files

Create:
- `tests/e2e/w3-parent-result-view-security.spec.ts`

Touch: none in `src/**`.

## Depends on

- **092** — `useParentResultQuery` and `parentResultQueryKey`.
- **093** — `toAttributeRows`, used to prove the 200 body is genuinely consumable.

## Steps

1. Obtain two real parent tokens through the real login contract, exactly as
   `tests/e2e/notification-api-security.spec.ts:20-26` does:
   `PRIMARY = parent@schooltest.local / Parent1234!` and
   `FOREIGN = parent-t06@schooltest.local / Parent1234!` (both already used by that spec, so no new
   fixture is created — D-AUTH-1).
2. Resolve a real official result id for EACH parent without hardcoding: for each token,
   `GET /api/my/students` → first child → `GET /api/my/students/:documentId/progress` →
   `recentResults[0].documentId`. Record both ids in Evidence.
3. Assert the four required cases with real requests:

   | # | Request | Expected |
   |---|---|---|
   | 1 | PRIMARY token, own child's official result id | `200`, body parses through `resultViewSchema`, `destination === 'official'`, `document_id` echoes the request |
   | 2 | PRIMARY token, FOREIGN parent's result id | `404`, `error.name === 'NotFoundError'` — **and the message must not differ from case 3's** |
   | 3 | PRIMARY token, syntactically valid unknown id (`'nonexistentdoc000000000'`) | `404`, same `error.name` and same `error.message` as case 2 |
   | 4 | No `Authorization` header | `401` (assert what the RUNNING API answers; if it is the project-standard `403`, record the divergence from the contract text per D-CONTRACT-1 rather than silently accepting it) |

   Case 2 vs case 3 message equality is the actual non-enumeration proof: if the messages differ, a
   parent can distinguish "exists but not yours" from "does not exist", which is the leak the
   contract forbids.
4. Add the transient case: a parent reading their OWN child's `destination='transient'` result ⇒
   `404`. Practice/transient results are invisible to parents by contract (gap **G8** left open
   deliberately). Resolve a transient id read-only from Postgres (`psql` read against
   127.0.0.1:5540 using the `tests/e2e/helpers/auth-db.ts` connection conventions —
   `SELECT document_id FROM results WHERE destination='transient' … LIMIT 1`, joined to the primary
   parent's child). **Read only — never insert, never update, never truncate** (`.qa/RULES.md`
   command policy). If no transient result exists for that child, Evidence records the query and its
   empty result, and the case is reported as unprovable-with-current-data rather than skipped silently.
5. Client-mapping assertions, in the same run: build an `AxiosError`-shaped object per status and
   assert `classifyQueryError` (imported from `@/modules/query-errors`) yields `gone` for `404`,
   `forbidden` for `403`, and `broken/contract` for a `ZodError` produced by feeding
   `resultViewSchema` a mutated copy of the real case-1 body.
6. Consumability assertion: `toAttributeRows(parsedCase1.attributes)` (imported from
   `@/modules/results`) returns one row per key with no dropped entry — proving the 200 is not just
   parseable but usable by the Skills surface.
7. Read-only proof: after the whole spec, re-run case 1 and assert the body is byte-identical to the
   first read (no request mutated state).

## Project rules

- `.qa/CONTRACTS.md` C-PARENT-RESULT-VIEW security note — this exact matrix is mandated, not optional.
- `.qa/DECISIONS.md` **D-VERIFY-1** — an independent verifier, never the builder, reproduces this.
- `.qa/DECISIONS.md` **D-CONTRACT-1** — where the running code disagrees with the contract doc, the
  code is the contract and the disagreement is RECORDED.
- `.qa/RULES.md` command policy — `psql` reads against 127.0.0.1:5540 allowed; dropping or
  truncating any table is forbidden.
- `schooltest-web/.claude/rules/testing.md` — Playwright is the proof for anything a Server Component
  or a live API is involved in.
- `schooltest-web/CLAUDE.md` law 13 — never commit secrets; the parent passwords used here are the
  already-committed seed fixtures, and no `SEED_*_PASSWORD` from `schooltest-api/.env` is copied into
  this file.

## Done criteria

- `pnpm exec playwright test tests/e2e/w3-parent-result-view-security.spec.ts` passes with all six
  cases (four required + transient + read-only re-read) green.
- Evidence records, verbatim: the status code AND full error envelope for cases 2, 3 and 4; explicit
  confirmation that case 2's and case 3's `error.message` strings are identical; the transient-case
  SQL and its result; and the case-1 body (redacted of any name).
- `pnpm tsc --noEmit` and `pnpm lint` clean.
- No source file under `src/**` modified (`git status --porcelain src/` empty).
- No Postgres write: Evidence includes a before/after `SELECT count(*) FROM results;` showing the
  same number.
- Playwright baseline unchanged: 157 passed / 1 known W9 red / 2 skipped, plus the new W3 specs green.
- Non-UI slice: no motion / viewport / axe criteria.
- No user-facing string → six catalogs untouched, still key-identical.

## Assumptions

- `parent-t06@schooltest.local` still exists with a child and at least one official result; it is
  already relied on by `tests/e2e/notification-api-security.spec.ts`, so its absence is a
  pre-existing fixture regression and is reported as such rather than worked around.
- The primary parent's own transient result may not exist in the current data; step 4 defines the
  honest handling for that.

## Evidence

<!-- filled in as the task runs -->
