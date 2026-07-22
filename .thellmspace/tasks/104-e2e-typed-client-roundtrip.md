---
id: "104"
title: Prove the household + result-history round-trip end to end against the running API
layer: integration
kind: verify
slice: One Playwright run that takes the real dashboard payloads from the live API through the real Zod schemas and the real derivations
target: tests/e2e/w3-typed-client-roundtrip.spec.ts
contract: C-DASH-HOUSEHOLD · C-CHILD-RESULT-HISTORY
design: .qa/design/spec/01-portal-dashboard.md#10. METRIC INVENTORY · .qa/design/spec/02-portal-children.md#B.6 Component: RecentResults
status: TODO
depends_on: ["095", "096", "098", "099"]
---

## Objective

The per-task specs in 094–099 each prove one thing. This task proves the whole W3 chain in one run:
real login → real endpoint → strict Zod parse → real derivations → values a UI could render, for
BOTH dashboard contracts, including the behaviours a single-shot parse cannot reach (pagination,
skill filtering, the zero-practice week, the childless parent).

## Contract

**C-DASH-HOUSEHOLD — GET /api/my/progress**
- Parent JWT; **no query parameters accepted** — any query key ⇒ `400 ValidationError`
  (`'household progress does not accept query parameters'`).
- `200 { data: { household, children }, meta: {} }`; `practiceByDay` EXACTLY 7 entries, oldest →
  newest, trailing 7 days incl. today; `strongestDay` = argmax, **null when every day is 0**;
  `cefrStageIndex` null iff `cefrBand` null; `skills` has one entry per skill that HAS an official
  result, never padded.
- `401 UnauthorizedError` absent/invalid JWT · `403 ForbiddenError` non-parent role.
- Read-only.

**C-CHILD-RESULT-HISTORY — GET /api/my/students/:documentId/results**
- Query `page` int ≥1 (default 1), `pageSize` int 1..50 (default 10, >50 ⇒ `400`),
  `skill` ∈ reading|listening|speaking|writing; unknown keys ⇒ `400`.
- `200 { data: Row[], meta: { pagination: { page, pageSize, pageCount, total } } }`;
  `destination='official'` ONLY; sort `published_at_field:desc, createdAt:desc`; `createdAt` always
  present.
- `400` bad query · `401` no JWT · `403` non-parent · `404` unknown **or foreign** child.
- Read-only.

## Design source

`.qa/design/spec/01-portal-dashboard.md` §10 METRIC INVENTORY is the checklist this spec walks:
metric **#1** `tests completed`, **#3** `practice this week` (`{H}h {MM}m`), **#4** the seven bars
with the max day highlighted navy `#0E2350` (`--color-navy-900`) against `#E4E9F2`, **#5** the
strongest-day caption, **#6** the six-tick journey stage, **#7** `Focus: {skill}`; plus
`.qa/design/spec/02-portal-children.md` `day streak`, `Level {band}` and §B.6's result rows.
Metric **#2 `coming up`** is asserted ABSENT (B-1, task 102).

This spec asserts the DATA behind each of those, not their pixels — the pixels are W5/W6. Its value
is that when W5 starts, every number it needs is already known to exist, parse and derive.

## Files

Create:
- `tests/e2e/w3-typed-client-roundtrip.spec.ts`

Touch: none in `src/**`. If this spec fails, the fix belongs to the task that owns the broken layer,
not to this file.

## Depends on

- **095** — `useHouseholdProgressQuery`'s schema + key.
- **096** — `toPracticeDuration` / `toPracticeChart` / `getStrongestBar`.
- **098** — `useChildResultHistoryQuery`'s params/response schemas + key.
- **099** — `getRowBandDelta` / `getSinceJoiningDelta`.

## Steps

1. Set up with the existing helpers, no new fixtures: `tests/e2e/helpers/auth.ts` (`SEEDED_PARENT`,
   `loginAsParent`) and the direct `POST http://localhost:5500/api/auth/local` pattern already used by
   `tests/e2e/notification-api-security.spec.ts:20-26`.
2. **Household chain**, one `test()`:
   - `GET /api/my/progress` with the parent Bearer token ⇒ `200`.
   - `householdProgressResponseSchema.parse(body)` (imported from `@/modules/dashboard`) — no throw.
   - `practiceByDay.length === 7`; dates strictly ascending; last date === today (ISO, local).
   - `toPracticeChart(days)` → 7 bars, all `heightPx` in `[0,120]`, at most one `isMax`, and
     `getStrongestBar(model)?.date === body.data.household.strongestDay?.date ?? null`.
   - `toPracticeDuration(practiceSecondsThisWeek)` → `{hours, minutes}` that reconstruct the seconds
     to within 59s (truncation), and `minutesLabel.length === 2`.
   - For every child: `cefrStageIndex === null` **iff** `cefrBand === null`;
     `getCefrStageIndex(cefrBand) === cefrStageIndex` (imported from `@/modules/results`);
     every `skills[].skill` is unique and drawn from `SKILL_ORDER`; `skills` never contains a skill
     with no `resultDocumentId`.
   - `focusSkill`, when non-null, is a member of the child's `skills[].skill` set — proving the
     server's derivation is internally consistent with what it returned.
   - Assert `'comingUp' in body.data.household === false` (B-1 stays refused on the wire, too).
3. **Result-history chain**, one `test()`:
   - first child from `GET /api/my/students`;
   - `GET …/results` default ⇒ `200`, parses, `meta.pagination.page === 1 && pageSize === 10`;
   - a two-page walk at `pageSize=1`: page 1 and page 2 return different `documentId`s, identical
     `total`, and `pageCount === total`;
   - a `?skill=reading` read: every row has `skill === 'reading'`, and its `total` is ≤ the
     unfiltered `total`;
   - order check: rows are non-increasing on `publishedAt ?? createdAt` (the server's declared sort);
   - `getRowBandDelta` over the rows yields only `steps === null` or integers in `[-5,5]`, and every
     row whose `previousResultDocumentId === null` has `tone === 'first'`.
4. **Boundary cases**, one `test()` each:
   - `GET /api/my/progress?page=1` ⇒ `400` with `error.name === 'ValidationError'`;
   - `GET …/results?pageSize=51` ⇒ `400 ValidationError`;
   - `GET …/results?bogus=1` ⇒ `400 ValidationError`;
   - `GET /api/my/students/<foreign-or-unknown-id>/results` ⇒ `404` (use
     `'nonexistentdoc000000000'`, the same shape `notification-api-security.spec.ts:6` uses);
   - both endpoints with NO `Authorization` header ⇒ the running API's rejection status, asserted as
     observed and recorded in Evidence against the contract text (D-CONTRACT-1: the code is the
     contract; any divergence is REPORTED, not accepted silently).
   - a childless parent from `tests/e2e/helpers/throwaway-parent.ts` (`registerParent`, real
     `C-AUTH-REGISTER` + real Mailpit confirmation — never a UI signup loop, D-AUTH-1):
     `GET /api/my/progress` ⇒ `200` with `children: []`, `household.childCount === 0`,
     `strongestDay === null`, and `practiceByDay` still exactly 7 zero entries. Clean up the
     helper's `auth_email_requests` rows in `afterAll`, as that helper documents.
5. Keep the whole spec API-level plus one real UI login; do not add UI assertions for surfaces W5/W6
   have not built yet.

## Project rules

- `schooltest-web/.claude/rules/testing.md` + `.qa/DECISIONS.md` **D-VERIFY-1** — a real Playwright
  run against the running app is the proof standard; the verifier is a different agent than the builder.
- `schooltest-web/.claude/rules/imports.md` — `@/` alias in the spec; import the schemas/derivations
  through each module's barrel.
- `schooltest-web/CLAUDE.md` law 12 — never run dev/build/start; Playwright's `webServer` block with
  `reuseExistingServer: true` boots/reuses the app (`playwright.config.ts:20-25`).
- `.qa/RULES.md` command policy — `psql` reads allowed; no table is dropped or truncated.

## Done criteria

- `pnpm exec playwright test tests/e2e/w3-typed-client-roundtrip.spec.ts` passes, every `test()` green.
- `pnpm tsc --noEmit` and `pnpm lint` clean (the spec is TypeScript and is linted too).
- Evidence contains, verbatim: the live `GET /api/my/progress` body (with names redacted to initials),
  the derived `{H}h {MM}m` string, the seven `heightPx` values and which index is `isMax`, the
  household `childCount`, and the result-history `meta.pagination` for the default, page-2 and
  `?skill=` reads.
- Evidence contains the observed status code for each boundary case, and an explicit
  contract-vs-code note for any divergence from the CONTRACTS text.
- The childless-parent case is genuinely exercised (not skipped), or Evidence states exactly why it
  could not be and what was done instead.
- `pnpm exec playwright test` overall still reports the mission baseline: 157 passed / 1 failed
  (the known W9-owned `notification-preference-controls.spec.ts:75`) / 2 skipped, plus the new W3
  specs green. Any additional red is a regression and a stop-and-fix.
- Non-UI slice: no motion / viewport / axe criteria — this task renders nothing.
- No source file under `src/**` is modified by this task (`git status --porcelain src/` empty).

## Assumptions

- The seeded parent's children have at least one official result each; where they do not, the spec
  asserts the honest empty shape (`skills: []`, `total: 0`) rather than skipping, and Evidence says so.

## Evidence

<!-- filled in as the task runs -->
