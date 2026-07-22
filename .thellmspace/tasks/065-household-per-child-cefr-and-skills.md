---
id: 065
title: Add per-child cefrBand, cefrStageIndex, acaraPhase and the skills[] array to /api/my/progress
layer: backend
kind: implement
slice: GET /api/my/progress — the CEFR journey ticks and the per-skill band/readiness rows
target: schooltest-api/src/api/student/services/parent-dashboard.ts · src/utils/household-child.ts · src/contracts/parent-household-progress.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#45-metric-5--per-child-cefr-journey-stage-dots · .qa/design/spec/02-portal-children.md#b4-component-leveljourney · #b5-component-skillscard
status: TODO
depends_on: [060, 064]
---

## Objective

Serve the CEFR journey position and the per-skill picture for every child, using ONLY the
sanctioned vocabulary — band lookup, ACARA phase, readiness — and never a computed CEFR score or a
cross-skill composite, both of which `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193` forbid.

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD**. Keys this task adds to each `data.children[]` entry:

```jsonc
"cefrBand": "B1",          // latest OFFICIAL result band; null when never assessed
"cefrStageIndex": 3,       // 0-based index into CEFR_LADDER; null when cefrBand is null
"acaraPhase": "Consolidating",   // nullable
"skills": [                // one entry per skill that HAS an official result; NEVER padded
  { "skill": "reading", "cefrBand": "B2", "readiness": "met",
    "acaraPhase": "Consolidating", "displayLabel": "Critical Reader",
    "publishedAt": "2026-07-22T08:28:04.544Z", "resultDocumentId": "amkb…" }
]
```

- `CEFR_LADDER` (from task 060) is exactly `["pre_A1","A1","A2","B1","B2","C1"]` — six entries,
  the `result/schema.json` `cefr_band` enum, `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`.
- Scope: `destination = 'official'` only. Practice/transient results stay invisible to parents
  (gap **G8** is left open deliberately).
- `skills[]` carries one entry per skill that HAS an official result. **It is never padded to
  four.** A skill with no official result is simply absent — the UI decides how to show
  "not assessed"; the API does not fabricate a row.
- `readiness` values are the API enum `met | approaching | not_yet | not_assessed`
  (`src/contracts/vocab.ts:104`).
- Unchanged: parent JWT, 400/403 behaviour, read-only, `Promise.all`, explicit `fields`.

## Design source

- **`.qa/design/spec/01-portal-dashboard.md` §4.5** (`portal--main.html:72-79`): six ticks labelled
  `A1 A2 B1 B2 C1 C2`; tick bar `width:100%; height:5px; border-radius:99px`, strip
  `gap:6px; min-width:120px`, each tick `max-width:52px`, label `10px`. Rendering rule
  (`Parent Portal.dc.html:976-978`): `bg = j < journeyStage ? '#0E2350' : '#EEF1F6'`;
  label `fg = j === journeyStage-1 ? '#0E2350' : '#9AA6B8'`; `font-weight = 700` on the current
  tick else `500`. `#0E2350` → `--color-navy-900`.
- **`.qa/design/spec/02-portal-children.md` §B.4 LevelJourney** (`portal--child-detail.html` L30-42):
  6 steps, dot `20×20`, `border:2px solid`, connector `height:2px; top:9px`, current dot carries an
  inner pip `6×6` white; label `12px`, current `700/#0E2350`, done `500/#0E2350`, future
  `500/#9AA6B8`.
- **DESIGN ↔ DATA CONFLICT, recorded not reconciled:** the design draws **`C2`**, which does not
  exist in this system, and omits **`pre_A1`**, which does. The API returns the real six-entry
  ladder and a 0-based `cefrStageIndex` into it. The UI (W5/W6) renders the real ladder with the
  design's tick visual. Per `.qa/CONTRACTS.md` C-DASH-HOUSEHOLD this is logged as a conflict; do
  not add a fake `C2` and do not drop `pre_A1`.
- **§B.5 SkillsCard** (L43-55): SkillRow is `grid-template-columns:76px 1fr 38px; gap:14px`; name
  `13px/#7C8698`; track `height:6px; background:#EEF1F6; border-radius:99px`; grade
  `12px/600`, right-aligned. `sk.color` is `#0E2350` normally and **`#2563EB`**
  (`--color-brand-600`) for the focus skill — "colour encodes emphasis, not value".
  **The design's `pct` values (Emma 78/70/52/64) are BLOCKED** — a per-skill percentage is a
  composite score (`DOC0_PLATFORM_PRD_V2.md:25,46`). See task 080 (B-3/B-4/B-5). This task serves
  `cefrBand` + `readiness` + `acaraPhase` + `displayLabel` in that slot instead, which is the
  sanctioned vocabulary. **Do not emit a percentage field.**
- `displayLabel` maps to the design's grade cell text (`B1+`, `A2+`, `Critical Reader`).

## Files

- EDIT `schooltest-api/src/api/student/services/parent-dashboard.ts`
- EDIT `schooltest-api/src/utils/household-child.ts` — pure "latest official result per (child,
  skill)" reduction + ladder index lookup
- EDIT `schooltest-api/src/contracts/parent-household-progress.ts`
- EDIT `schooltest-web/tests/e2e/household-progress.spec.ts`

## Depends on

- **060** — `CEFR_LADDER` and the child schema this extends.
- **064** — the per-child grouping and the `Promise.all` batch this joins.

## Steps

1. Add ONE `strapi.documents(RESULT_UID).findMany(...)` to the existing `Promise.all`:
   - `filters: { student: { documentId: { $in: childDocumentIds } },
     destination: { $eq: 'official' } }`
   - `fields: ['skill','scope','display_label','acara_phase','cefr_band','readiness',
     'published_at_field']` — explicit, seven columns. **Never `populate: '*'`.**
   - `populate: { student: { fields: ['documentId'] } }` — one level, one field, so the rows can be
     grouped per child.
   - `sort: ['published_at_field:desc', 'createdAt:desc']` — the SAME sort the existing
     `getParentProgress` uses (`services/parent-progress.ts:142`), so ordering never disagrees
     between the two parent surfaces.
   - explicit `limit` cap with a comment. The live `results` table holds 2222 official rows total.
2. In `src/utils/household-child.ts`, reduce to "latest official result per (child, skill)" — first
   row wins under the sort above. `scope='combined'` rows have `skill: null`; they are the source
   for the child-level `cefrBand`/`acaraPhase` when present, and they are **excluded from
   `skills[]`** (a combined row is not a skill row).
3. Child-level `cefrBand` = the band of the child's latest official result overall (combined or
   skill, whichever is newest under the sort). `cefrStageIndex = CEFR_LADDER.indexOf(cefrBand)`;
   assert `>= 0` and throw `ApplicationError` if not — an unknown band must be a 500, never a
   silent `-1` on the wire. `null` band ⇒ `null` index.
4. `skills[]` = one entry per skill present, ordered by the skill enum's declaration order
   (`reading, listening, speaking, writing` — `src/contracts/vocab.ts:8`) so the array is
   deterministic. Never padded, never sorted by value.
5. Extend the Zod schemas: `householdChildSkillSchema` as a `z.strictObject` reusing
   `skillSchema`, `cefrBandSchema`, `readinessSchema` from `./vocab`; `skills:
   z.array(householdChildSkillSchema)`; `cefrStageIndex: z.number().int().min(0).max(5).nullable()`.
6. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rules 5, 6, **11/12 (explicit populate)**, 19, 20, 21, 23.
- `.claude/rules/document-service.md` — `$in`, nested relation filters, explicit `fields`.
- `.qa/CONTRACTS.md` governing rule: "**No composite scores.** `DOC0_PLATFORM_PRD_V2.md:25,46,193`
  forbid cut scores, cross-skill composites and any computed CEFR score. No field below returns one."
- `.qa/intake/docs-constraints.md` — the binding reporting vocabulary.

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/household-progress.spec.ts` passes with new assertions:
  - every `children[].cefrBand` is `null` or a member of `CEFR_LADDER`; **no response anywhere
    contains the string `C2`**;
  - `cefrStageIndex === CEFR_LADDER.indexOf(cefrBand)` for every non-null band, and both are
    `null` together;
  - `skills[]` length `<= 4`, every `skill` unique, ordered `reading, listening, speaking, writing`
    filtered to those present, and **never padded** — a child with 1 official skill result returns
    a 1-element array;
  - for the seeded parent's child `funvimlj3yeh8mada2bkbt7x` (1 official result live), the returned
    `resultDocumentId` and `cefrBand` equal the row read directly by `runSql` from `results`;
  - a never-assessed child (`ol10bd2bui8jf2mjzziol1iq`) returns `cefrBand: null`,
    `cefrStageIndex: null`, `acaraPhase: null`, `skills: []`;
  - **no percentage, no score, no composite:** `JSON.stringify(body)` matched against
    `/\b(score|percent|pct|avg|average|composite|progressTo)\b/i` finds NOTHING;
  - transient results are invisible: pick a transient result documentId for one of this parent's
    children via `runSql` (the parent has 15 live) and assert its id appears NOWHERE in the body.
- `grep -rn "populate: '\*'" schooltest-api/src/api/student/` returns nothing.
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression unchanged.

## Assumptions

- When a child's newest official row is `scope='combined'`, its `cefr_band`/`acara_phase` become the
  child-level values; the addendum says "latest OFFICIAL result band" without qualifying scope.
  Record which rows drove each child's values in Evidence.
- `acara_phase` is a free string on the schema (1073 of 2358 live rows non-null); it is passed
  through verbatim, never normalised or title-cased.

## Evidence

<!-- filled in as the task runs -->
