---
id: 066
title: Derive focusSkill from readiness rank with the attribute-probability tiebreak, and close the C-DASH-HOUSEHOLD shape
layer: backend
kind: implement
slice: GET /api/my/progress — the "Focus: {skill}" metric and the final contract-completeness gate
target: schooltest-api/src/utils/focus-skill.ts · services/parent-dashboard.ts · src/contracts/parent-household-progress.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/spec/01-portal-dashboard.md#46-metric-6--per-child-focus-skill · .qa/design/spec/02-portal-children.md#b5-component-skillscard
status: TODO
depends_on: [065]
---

## Objective

Serve the design's "weakest skill" pill without the percentage the design derives it from, using
the addendum's sanctioned ordering — then assert that `/api/my/progress` now returns EXACTLY the
C-DASH-HOUSEHOLD key set and nothing more.

## Contract

`.qa/CONTRACTS.md` → **C-DASH-HOUSEHOLD**. Final key added to each `data.children[]` entry:

```jsonc
"focusSkill": "speaking"   // null when no skill has an official result
```

**`focusSkill` derivation, quoted verbatim from the addendum** (the design says "the weakest
skill"; the docs forbid a composite %):

> rank each skill's latest official result by `readiness` — `not_yet`(0) < `approaching`(1) <
> `met`(2), `not_assessed` excluded — and take the lowest. Ties break on the lower mean of that
> result's per-attribute `prob` values in `attributes` (the primary datum per
> `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:45`). Still tied ⇒ the skill enum's declaration order.
> **No percentage is ever surfaced to the user.**

## Design source

- `.qa/design/spec/01-portal-dashboard.md` §4.6 (`portal--main.html:80`): literal prefix
  **`Focus: `** then the skill name — `Focus: Speaking`, `Focus: Writing`. Pill styling
  `font-size:12px; font-weight:600; color:#2563EB; background:#EEF3FE; padding:6px 13px;
  border-radius:999px; flex:none`. `#2563EB` → `--color-brand-600`.
- The export derives it as `k.skills.reduce((a,b) => parseInt(a.pct) < parseInt(b.pct) ? a : b).name`
  (`Parent Portal.dc.html:973`) — i.e. the lowest **percentage**. That percentage is a composite
  score and is BLOCKED (`DOC0_PLATFORM_PRD_V2.md:25,46`; see task 080 / B-3). The addendum's
  readiness-rank derivation replaces it and produces the same KIND of answer — one skill name — so
  the design's pill renders unchanged.
- `.qa/design/spec/02-portal-children.md` §B.5: the focus skill is also what tints one SkillRow's
  bar and grade `#2563EB` instead of `#0E2350`. Same field, two consumers.
- The design's own example: Emma → `Speaking`, Lucas → `Writing`. Those come from seeded percentages
  and are NOT reproducible from real data — do not target them.

## Files

- CREATE `schooltest-api/src/utils/focus-skill.ts` — pure, strapi-free
- EDIT `schooltest-api/src/api/student/services/parent-dashboard.ts`
- EDIT `schooltest-api/src/contracts/parent-household-progress.ts`
- EDIT `schooltest-web/tests/e2e/household-progress.spec.ts`
- CREATE `schooltest-web/tests/e2e/focus-skill.spec.ts`

## Depends on

- **065** — the per-(child, skill) latest-official-result reduction this ranks.

## Steps

1. Extend the results read from 065 with `'attributes'` in its `fields` list — the per-attribute
   mastery map is needed for the tiebreak. It stays one query; no new round-trip.
2. `src/utils/focus-skill.ts`, pure:
   - `attributeProbMean(attributes: unknown): number | null` — read the map the way
     `src/utils/result-view.ts:55-71` does: skip the reserved peer keys `_artefacts` and
     `provisional`; skip entries that are the literal string `'not_assessed'`; average the numeric
     `prob` values, ignoring `null` probs; return `null` when nothing numeric remains.
   - `pickFocusSkill(rows): Skill | null` using `READINESS_RANK` from the contract module
     (`not_yet` 0 < `approaching` 1 < `met` 2), excluding `not_assessed` and `null` readiness
     entirely; tiebreak on the LOWER `attributeProbMean` (a `null` mean loses the tiebreak, i.e.
     sorts last, so an unscored row never wins on absence of evidence); final tiebreak = skill enum
     declaration order `reading, listening, speaking, writing`.
   - `null` when the child has no ranked skill at all.
3. Wire it into the child projection; add `focusSkill: skillSchema.nullable()` to the child Zod
   object.
4. **Close the contract.** Add an exported `HOUSEHOLD_CONTRACT_KEYS` map (household keys + child
   keys + skill keys) derived from the Zod shapes, so the e2e spec can assert the delivered key set
   equals AMENDMENT A1's key set exactly — no missing key, no extra key, and specifically no
   `cefrBand`/`cefrStageIndex`/`acaraPhase` on the child map (those are DELETED, B-9).
5. `cd schooltest-api && pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `schooltest-api/CLAUDE.md` §2 rules 7, 19, 21, 23; `.claude/rules/typescript.md` (no `any` —
  `attributes` is `unknown` and narrowed, exactly like `result-view.ts` does).
- `.claude/rules/services.md` — ranking logic lives in `src/utils/`, not the service.
- `.qa/CONTRACTS.md` C-DASH-HOUSEHOLD focusSkill derivation, verbatim, plus the "no composite
  scores" governing rule.
- `.qa/DECISIONS.md` D-SCOPE-1(4): "'Do not invent' is absolute."

## Done criteria

- `cd schooltest-api && pnpm tsc --noEmit` and `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/focus-skill.spec.ts` passes, asserting the pure function
  directly with hand-built rows:
  - `not_yet` beats `approaching` beats `met`;
  - `not_assessed` and `null` readiness are excluded, and a child whose ONLY rows are
    `not_assessed` gets `null`;
  - a readiness tie is broken by the lower attribute-`prob` mean, with `{status:'…',prob:null}`
    entries ignored and a wholly-null map losing the tiebreak;
  - `_artefacts` and `provisional` peer keys never enter the mean;
  - a full three-way tie resolves to the earliest skill in `reading, listening, speaking, writing`.
- `pnpm exec playwright test tests/e2e/household-progress.spec.ts` passes with:
  - `focusSkill` is `null` or one of the four skill enum values, and when non-null it is always a
    member of `skills[].skill` (trivially true now that `skills[]` always carries all four);
  - **contract completeness, against AMENDMENT A1 (not v1):** the delivered key set equals
    C-DASH-HOUSEHOLD **v2**'s exactly — household `{childCount, testsCompleted,
    testsCompletedThisWeek, resultsPublished, practiceSecondsThisWeek, practiceByDay,
    strongestDay}`, child `{documentId, givenName, familyName, yearLevel, status, testsCompleted,
    practiceSecondsThisWeek, practiceDayStreak, lastActivityAt, focusSkill, skills}` — **no
    `cefrBand`, `cefrStageIndex` or `acaraPhase` key on the child object; those three are DELETED
    by AMENDMENT A1 (B-9)** — skill `{skill, cefrBand, readiness, acaraPhase, displayLabel,
    publishedAt, resultDocumentId}` with `cefrBand` and `resultDocumentId` both nullable for a
    `not_assessed` entry. Assert both directions (no missing, no extra) AND assert the three deleted
    keys are absent from every child object;
  - every child's `skills` array has length exactly 4;
  - `JSON.stringify(body)` still matches nothing in `/\b(score|percent|pct|avg|average|composite)\b/i`.
- `grep -n "strapi" schooltest-api/src/utils/focus-skill.ts` returns nothing (pure module).
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression unchanged.

## Assumptions

- `testsCompletedThisWeek` (added in 063 alongside the ISO-week read) is present by this point; if
  063 deferred it, land it here — task 066 is the gate that the shape is complete, so a missing key
  fails this task, not a later one.
- Real seeded data may leave `focusSkill` null for most children (only 3 official results exist for
  the seeded parent's household). That is a truthful `null`, not a failure; the pure-function spec
  is what proves the ranking, and the endpoint spec proves the wiring.

## Evidence

<!-- filled in as the task runs -->
