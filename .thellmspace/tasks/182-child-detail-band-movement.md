---
id: 182
title: Build the "Since joining" cell as an honest per-skill CEFR band movement
layer: ui
kind: implement
slice: KPI cell 5 — the band a skill started at and the band it is at now, from real official results, with no composite and no extrapolation.
target: src/modules/children/lib/child-band-movement.ts (new), src/modules/children/components/ChildKpiStrip.tsx, src/i18n/messages/*.json
contract: C-CHILD-RESULT-HISTORY · C-DASH-HOUSEHOLD (skills[])
design: .qa/design/screens/portal--child-detail.html (L26) · .qa/design/spec/02-portal-children.md §B.2 KPI 5, §METRIC INVENTORY "B KPI · Since joining"
status: TODO
depends_on: ["181"]
---

## Objective

Deliver the intent of the design's `+2 levels` without a cross-skill composite: state the band
movement of the child's most-assessed skill between its FIRST and its LATEST official result.

## Contract

`C-CHILD-RESULT-HISTORY` returns every official result for the child with `skill`, `cefrBand`,
`publishedAt`, `createdAt`, `previousResultDocumentId`, paginated
(`meta.pagination.{page,pageSize,pageCount,total}`), sorted `published_at_field:desc, createdAt:desc`,
`destination='official'` only. `C-DASH-HOUSEHOLD` `children[].skills[]` lists only skills that HAVE an
official result.

Binding limits:
- `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:304` — "There are no cross-skill composite fields."
- `.qa/CONTRACTS.md` C-DASH-HOUSEHOLD — `CEFR_LADDER = ["pre_A1","A1","A2","B1","B2","C1"]`.
  The movement is therefore an index difference **within one skill's own band lookups**, never an
  average across skills and never a projection ("B2 is likely by early 2027" is not buildable).

## Design source

`portal--child-detail.html` L26: label `Since joining`, value `{{kid.growth}}` = `+2 levels`, value
colour `#2563EB` (`text-primary`) — the strip's only accent. `.qa/design/spec/02-portal-children.md`
§METRIC INVENTORY states the design's computation as `currentBandIndex - bandIndexAtSignup`; this
build scopes it to one named skill so it stays a lookup difference rather than a composite.

## Files

- `src/modules/children/lib/child-band-movement.ts` (new) — pure
  `getBandMovement(results): { skill, fromBand, toBand, steps } | null`.
- `ChildKpiStrip.tsx` — renders cell 5.
- Catalogs: `Children.kpiBandMovement` (label `Since first result`),
  `Children.bandMovementValue` = `{from} → {to}`, `Children.bandMovementNone` = `First result`,
  `Children.bandMovementUnassessed` = `Not assessed yet`.

## Depends on

- `181` — the strip this cell completes.

## Steps

1. Choose the skill with the most official results (ties → the skill enum's declaration order
   `reading, listening, speaking, writing`, the same tie-break `C-DASH-HOUSEHOLD` uses for `focusSkill`).
2. `fromBand` = that skill's oldest result with a non-null `cefrBand`; `toBand` = its newest.
   `steps` = `CEFR_LADDER.indexOf(to) - CEFR_LADDER.indexOf(from)` — used ONLY to pick the arrow/tone,
   never printed as `+N levels` unless both bands are real lookups on the same skill.
3. The value renders as `{from} → {to}` with the skill name beneath the label, so the reader can never
   mistake it for an overall level. Zero movement renders the same band twice (honest, not hidden).
4. One result only → `Children.bandMovementNone`; no official result → `Children.bandMovementUnassessed`.
5. The history read must cover the FIRST result: request `pageSize=50` (the contract maximum;
   `>50 ⇒ 400`) and, if `meta.pagination.pageCount > 1`, request the LAST page for the oldest row —
   never assume page 1 holds it.

## Project rules

- `.claude/rules/module-pattern.md` — derivation in `lib/`, constants (`CEFR_LADDER`) in `constants/`.
- `.qa/intake/docs-constraints.md` §3c/§3d — no composite, CEFR is a lookup not a scale.
- `.claude/rules/i18n.md` — six catalogs; the arrow is part of the message, not concatenated.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: the cell's value is reconstructible from the live results response (oldest and newest
  banded result of the chosen skill); with one result it reads `Children.bandMovementNone`; with none
  it reads `Children.bandMovementUnassessed`.
- The request log shows `pageSize=50` and, when `pageCount > 1`, a second request for the last page —
  and never a `pageSize` above 50 (which the API rejects with `400`).
- No `+N levels` string is rendered for a cross-skill aggregate; grep the diff for `levels` and show
  the only hits are inside the single-skill message.
- Motion: cell 5 shares the strip entrance; no numeric count-up.
- 375px + 1280px correct; axe clean; six catalogs key-identical.

## Assumptions

The seeded parent's children may have zero official results, in which case the assertion path is the
`bandMovementUnassessed` branch — that is a pass, not a skip.

## Evidence

<!-- filled in as the task runs -->
