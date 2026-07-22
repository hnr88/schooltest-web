---
id: 187
title: Render not_assessed, low_confidence and effort_valid as first-class states on the Skills card
layer: ui
kind: implement
slice: The honesty layer of the Skills card — the never-assessed case, the thin-evidence caveat, and the invalid-effort caveat.
target: src/modules/children/components/ChildSkillsCard.tsx, src/modules/children/components/ChildSkillCaveats.tsx (new), src/i18n/messages/*.json
contract: C-DASH-HOUSEHOLD · C-PARENT-RESULT-VIEW (low_confidence, effort_valid)
design: .qa/design/spec/02-portal-children.md §B.5 · .qa/design/screens/app--empty-state.html (empty composition)
status: TODO
depends_on: ["185", "186"]
---

## Objective

Make the three states the product docs mandate visible, so a parent is never shown a confident claim
the data does not support.

## Contract

- `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:14` — "any attribute without administered evidence stores
  the string `not_assessed` in reporting fields - **never null, never 0.5**."
- `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:167` — "reported **`not_assessed`** - never null, never 0.5,
  never silently carried forward."
- `SCHOOLTEST_DOC2A_RECEPTIVE_ENGINE_V2 (1).md:156` — `low_confidence` = MAP posterior below the config
  threshold (0.30 provisional).
- `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:234` — `effort_valid` is the session-level rapid-guess screen.
- `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:356` — "evidence counts travel with every claim;
  `not_assessed` is explicit; … **the caveat block is always present**."
- `C-PARENT-RESULT-VIEW` returns both flags on the result view.

## Design source

The design has no caveat component (§UNKNOWNS), so it is built from the portal's own callout idiom:
`bg-blue-50` (`#EFF5FF`), `rounded-2xl`, `p-4`, `flex gap-3 items-start`, 17px lucide icon at
`text-primary` with `strokeWidth={2}`, body 13.5px `text-navy-800` (`#16326E`) `leading-relaxed` —
the same treatment as §D.4's TeacherTipCallout, ported to the portal card.
The all-unassessed state uses `app--empty-state.html`'s centred composition inside the card:
medallion 96px `bg-blue-50` with a 42px `text-primary` glyph, title, one-sentence body.

## Files

- `src/modules/children/components/ChildSkillCaveats.tsx` (new).
- `ChildSkillsCard.tsx` — renders the empty branch and mounts the caveats.
- Catalogs: `Children.skillsAllUnassessedTitle`, `Children.skillsAllUnassessedBody`,
  `Children.caveatLowConfidence`, `Children.caveatEffortInvalid`, `Children.caveatThinEvidence`.

## Depends on

- `185` (rows), `186` (the attribute data that carries the flags).

## Steps

1. Zero skills with an official result → the card body is the empty composition, the four rows are not
   drawn as empty bars, and the existing `Children.skillsPendingTitle` /
   `Children.skillsPendingDescription` keys are reused where they already say the right thing.
2. When an expanded result has `low_confidence === true`, render `caveatLowConfidence` above its
   attribute list. When `effort_valid === false`, render `caveatEffortInvalid`. Both may appear.
3. When every attribute of a skill has `items === 0`, render `caveatThinEvidence`.
4. Caveats are text with an icon, never colour alone, and are inside the same landmark as the claim
   they qualify (so they are read together).

## Project rules

- `.qa/intake/docs-constraints.md` §3g, §3h, §3j.
- `.claude/rules/quality.md` — AA contrast, no colour-only meaning.
- `.claude/rules/i18n.md` — six catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: a child with no official results shows the unassessed composition and NOT four rows of
  empty tracks; the string `not assessed` (localised) is visible.
- With an intercepted result payload carrying `low_confidence: true` and `effort_valid: false`, both
  caveats render with their catalog copy; with the real payload, they render only when the live flags
  say so (asserted against the parsed body).
- Motion: caveats enter with `st-fade-in` 180ms; reduced-motion inert.
- 375px + 1280px correct; axe zero serious/critical; six catalogs key-identical.

## Assumptions

Interception is used only to exercise the flag branches; the primary assertions run against the live
response so nothing is proven by mock alone.

## Evidence

<!-- filled in as the task runs -->
