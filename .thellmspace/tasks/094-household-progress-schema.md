---
id: "094"
title: Mirror C-DASH-HOUSEHOLD (`GET /api/my/progress`) as a strict Zod schema + types
layer: data
kind: build
slice: The typed client boundary for the whole dashboard aggregate — household totals, 7-day practice series and per-child rows
target: src/modules/dashboard/schemas/household-progress.schema.ts · src/modules/dashboard/types/household-progress.types.ts · src/modules/dashboard/index.ts · tests/e2e/w3-household-contract.spec.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#10. METRIC INVENTORY · .qa/design/screens/portal--main.html
status: TODO
depends_on: ["065"]
---

## Objective

One strict Zod mirror of `GET /api/my/progress` so every dashboard metric the design requires
arrives parsed, and any backend drift fails loudly at the boundary instead of rendering a wrong
number to a parent. Schema + types + barrel only — the hook is task 095.

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD — GET /api/my/progress**:

- Transport `GET /api/my/progress`; handler `api::student.parent-dashboard.getHouseholdProgress`.
- Auth: parent JWT required.
- Request: no path params. Query: **none accepted** — any query key ⇒
  `400 ValidationError` (`'household progress does not accept query parameters'`).
- Success `200`, Strapi single envelope `{ data, meta }` where `meta` is `{}`:

```jsonc
{ "data": {
    "household": {
      "childCount": 3,
      "testsCompleted": 41,
      "testsCompletedThisWeek": 7,
      "resultsPublished": 18,
      "practiceSecondsThisWeek": 15600,
      "practiceByDay": [ { "date": "2026-07-16", "weekday": "M", "seconds": 2040 } ],  // EXACTLY 7, oldest → newest
      "strongestDay": { "date": "2026-07-19", "weekday": "T", "seconds": 5280 }        // null when every day is 0
    },
    "children": [ {
      "documentId": "abc123…", "givenName": "Emma", "familyName": "Chen",   // familyName nullable
      "yearLevel": 7,                                                        // nullable
      "status": "active",                                                    // active | archived | enrolled
      "testsCompleted": 14, "practiceSecondsThisWeek": 5400, "practiceDayStreak": 12,
      "lastActivityAt": "2026-07-22T08:28:04.544Z",                          // nullable
      "focusSkill": "speaking",                                              // null when no skill has an official result
      "skills": [ { "skill": "reading", "cefrBand": "B2", "readiness": "met",
                    "acaraPhase": "Consolidating", "displayLabel": "Critical Reader",
                    "publishedAt": "2026-07-22T08:28:04.544Z", "resultDocumentId": "amkb…" } ]
    } ] },
  "meta": {} }
```

**AMENDMENT A1 (`.qa/CONTRACTS.md` "AMENDMENT A1 — `C-DASH-HOUSEHOLD` v2") supersedes v1 above:**
the per-child `cefrBand` / `cefrStageIndex` / `acaraPhase` triple is **DELETED** — a single
per-child level is a cross-skill composite (`DOC1:304`, `DOC0:46`; BLOCKED **B-9**). A band exists
ONLY inside `skills[]`. `skills` MUST carry **exactly four entries, always** (one per
`reading|listening|speaking|writing`) — a skill with no official result still gets an entry with
`readiness: "not_assessed"`, `cefrBand: null` and `resultDocumentId: null`; never omitted, never
padded to fewer than four.
- Errors: `400 ValidationError` (any query parameter present) · `401 UnauthorizedError` (absent/invalid
  JWT) · `403 ForbiddenError` (caller role is not `parent`; message
  `'Only parents can view household progress'`).
- Persistence effect: none — read-only.

## Design source

`.qa/design/spec/01-portal-dashboard.md` §10 METRIC INVENTORY — the exact metrics this payload
services, with the values the design shows:

| Design metric | Design label / value | Field in this schema |
|---|---|---|
| #1 tests completed | `tests completed` / `7`, value `24px/700/-0.02em/#FFFFFF`, label `12px/400/#8FA3C7` | `household.testsCompletedThisWeek` |
| #3 practice this week | `practice this week` / `4h 20m`, format `{H}h {MM}m` | `household.practiceSecondsThisWeek` |
| #4 practice minutes | card `h2` "Practice minutes" `16px/600/#0E2350`, range label "last 7 days" `12.5px/#7C8698`, 7 bars `max-width:30px; border-radius:8px`, plot `min-height:120px; gap:14px` | `household.practiceByDay` (exactly 7) |
| #5 strongest day | caption `13px/#7C8698`, `margin-top:16px`; the minutes span `#0E2350/600` | `household.strongestDay` |
| #6 CEFR journey stage | six ticks, `20px` dots, `2px` rail — **one rail per skill** (AMENDMENT A1), not one per child | `children[].skills[].cefrBand` |
| #7 focus skill | `Focus: {skill}` pill | `children[].focusSkill` |
| children `day streak` (`.qa/design/spec/02-portal-children.md` A.5 cell 2, value `20px/700/-0.01em/#0E2350`, label `12px/#7C8698`) | `12` | `children[].practiceDayStreak` |
| children `Level {band}` pill (`12px/600/#0E2350`, `1px solid #D8DFEA`, `padding:5px 12px`, `border-radius:999px`) | `Level B1` | **BLOCKED B-9** — no field; a single per-child band is a cross-skill composite. See `children[].skills[]` for the sanctioned per-skill substitute. |

Colour tokens named above map per `.qa/design/spec/04-ds-foundations.md` TAILWIND V4 MAPPING:
`#0E2350` → `--color-navy-900`, `#2563EB` → `--color-brand-600`, `#8FA3C7` → the dark-mode
muted-foreground OKLCH `oklch(0.7127 0.0574 262.12)` registered by W0. No colour is applied in THIS
task — they are listed so the schema's field list is provably the one the design needs.

Design metric **#2 `coming up` = `2`** is **BLOCKED B-1** and has no field in this payload. Do not
add one. See task 102.

## Files

Create:
- `src/modules/dashboard/schemas/household-progress.schema.ts`
- `src/modules/dashboard/types/household-progress.types.ts`
- `tests/e2e/w3-household-contract.spec.ts`

Touch:
- `src/modules/dashboard/index.ts` — add the new schema + type exports alongside the existing
  `studentSchema` / `studentsResponseSchema` block.

Do NOT touch `src/modules/dashboard/schemas/student.schema.ts` — `C-STUDENT-LIST` keeps its own shape.

## Depends on

- **065** (W2) — the task that ships the `GET /api/my/progress` route, handler and
  `parent-dashboard.getHouseholdProgress` → `parent` grant. Nothing here can be proved until it answers `200`.

## Steps

1. `schemas/household-progress.schema.ts`, following the house style already set by
   `src/modules/children/schemas/child-progress.schema.ts` (strict objects, shared local enums,
   `z.iso.datetime()`, a header comment naming the contract id):
   - Local enums: `skillSchema`, `cefrBandSchema` (`pre_A1|A1|A2|B1|B2|C1`), `readinessSchema`,
     `studentStatusSchema = z.enum(['active','archived','enrolled'])`.
   - `practiceDaySchema = z.strictObject({ date: z.iso.date(), weekday: z.string().min(1).max(2), seconds: z.number().int().nonnegative() })`.
   - `householdSchema = z.strictObject({ childCount, testsCompleted, testsCompletedThisWeek,
     resultsPublished, practiceSecondsThisWeek })` all `z.number().int().nonnegative()`, plus
     `practiceByDay: z.array(practiceDaySchema).length(7)` — **`.length(7)`, not `.max(7)`**; the
     contract says EXACTLY 7 and a short series would silently misdraw the chart — and
     `strongestDay: practiceDaySchema.nullable()`.
   - `householdChildSkillSchema = z.strictObject({ skill: skillSchema, cefrBand: cefrBandSchema.nullable(),
     readiness: readinessSchema.nullable(), acaraPhase: z.string().nullable(),
     displayLabel: z.string().nullable(), publishedAt: z.iso.datetime().nullable(),
     resultDocumentId: z.string().min(1).nullable() })` — `resultDocumentId` is now `.nullable()`
     because a `readiness: 'not_assessed'` entry (AMENDMENT A1) has no result to link to.
   - `householdChildSchema = z.strictObject({ documentId: z.string().min(1), givenName: z.string(),
     familyName: z.string().nullable(), yearLevel: z.number().int().nullable(),
     status: studentStatusSchema, testsCompleted, practiceSecondsThisWeek, practiceDayStreak (all
     int nonnegative), lastActivityAt: z.iso.datetime().nullable(),
     focusSkill: skillSchema.nullable(), skills: z.array(householdChildSkillSchema).length(4) })`.
     **No `cefrBand`, `cefrStageIndex` or `acaraPhase` field on this object — AMENDMENT A1 deletes
     the per-child level (BLOCKED B-9); a `z.strictObject` correctly rejects them if the API ever
     regresses and sends them.** `givenName` is non-nullable and `familyName` nullable for the same
     reason `student.schema.ts` documents (mononyms are ordinary; rendering goes through
     `@/lib/student-name`).
   - `householdProgressDataSchema = z.strictObject({ household: householdSchema, children: z.array(householdChildSchema) })`.
   - `householdProgressResponseSchema = z.strictObject({ data: householdProgressDataSchema, meta: z.record(z.string(), z.unknown()) })`
     — mirrors `StrapiSingleResponse<T>` (`src/lib/axios/strapi.ts:76-79`), same as
     `childProgressResponseSchema` does.
   - Add a `.superRefine` (or equivalent) asserting the cross-field invariants AMENDMENT A1 states:
     for every skill entry, `cefrBand === null` iff `resultDocumentId === null` (a `not_assessed`
     entry has neither); and `strongestDay` is `null` iff every `practiceByDay[].seconds === 0`.
     These are contract text, so they are contract checks — not invented validation.
2. `types/household-progress.types.ts` — `z.infer` re-exports only:
   `HouseholdProgress`, `HouseholdSummary`, `HouseholdPracticeDay`, `HouseholdChild`,
   `HouseholdChildSkill`, `HouseholdProgressResponse`.
3. Barrel exports in `src/modules/dashboard/index.ts` (values, then `export type {…}`).
4. TDD: create `tests/e2e/w3-household-contract.spec.ts` red-first. It logs in as the seeded parent
   over the real API, `GET /api/my/progress` with the Bearer token, expects `200`, and asserts the
   LIVE body parses through `householdProgressResponseSchema`. Additionally assert
   `data.household.practiceByDay.length === 7` and that the 7 `date` values are strictly ascending
   and end on today's date (the contract's "trailing 7 days incl. today").

## Project rules

- `schooltest-web/.claude/rules/module-pattern.md` — Zod only in `schemas/`, types only in `types/`,
  barrel for cross-module use; 200-line file cap (split the schema file if it approaches it).
- `schooltest-web/.claude/rules/state-data.md` — the same Zod schema is the single validation source.
- `schooltest-web/CLAUDE.md` law 14 — never `any`.
- `.qa/CONTRACTS.md` governing rules — Strapi v5 envelope, `documentId` never numeric `id`,
  single source of truth mirrored 1:1 from `schooltest-api/src/contracts/`.
- `.qa/DECISIONS.md` **D-SCOPE-1.3** — the dashboard's metrics are a hard requirement computed from
  real API data; **D-SCOPE-1.4** — no invention.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/w3-household-contract.spec.ts` passes against the running
  app + API: `200`, live body parses, exactly 7 ascending practice days ending today.
- Negative proof in Evidence: a copy of the live body with `practiceByDay` truncated to 6 entries,
  and a copy with an extra top-level key, BOTH throw from `householdProgressResponseSchema.parse`.
- `grep -rn "comingUp\|coming_up\|scheduled\|dueAt\|due_at" src/modules/dashboard/schemas/household-progress.schema.ts`
  → zero hits (B-1/B-2 stay refused, not stubbed).
- `grep -rn "as any\|: any\|@ts-ignore\|\.passthrough()" src/modules/dashboard/` → zero hits.
- No user-facing string → six catalogs untouched, still key-identical.
- Non-UI slice: no motion / viewport / axe criteria.
- Playwright baseline unchanged (157 passed / 1 known W9 red).

## Assumptions

- W2 id **065** is the task that makes `GET /api/my/progress` answer `200` for a parent. The W2
  fragment did not exist when this file was authored; if the real id differs, retarget the edge to
  the W2 task whose title covers the household route + grant.
- `weekday` is a 1–2 character label produced server-side (the design draws `M T W T F S S`); the
  schema accepts it as an opaque short string and the client never localises it here — locale-aware
  weekday labels are task 101's catalog concern.

## Evidence

<!-- filled in as the task runs -->
