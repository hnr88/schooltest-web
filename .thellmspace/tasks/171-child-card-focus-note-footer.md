---
id: 171
title: Build the child card footer — focus-skill note line and the "Details →" affordance
layer: ui
kind: implement
slice: Row 3 of the child card: one derived sentence naming the real focus skill and its readiness, plus the blue "Details →" cue.
target: src/modules/children/components/ChildCardFooter.tsx (new), src/modules/children/lib/child-focus-note.ts (new), src/i18n/messages/*.json
contract: C-DASH-HOUSEHOLD (focusSkill, skills[].readiness)
design: .qa/design/screens/portal--my-children-list.html (L29-32) · .qa/design/spec/02-portal-children.md §A.5 "Row 3 — CardFooter"
status: TODO
depends_on: ["167"]
---

## Objective

Replace the design's hand-written narrative (`Speaking is the current growth area`) with a sentence
generated from `focusSkill` + that skill's `readiness`, using only the sanctioned vocabulary, and
render the `Details →` cue that the card's link already activates.

## Contract

`C-DASH-HOUSEHOLD` defines `focusSkill` and its derivation verbatim:

> **`focusSkill` derivation** (design says "the weakest skill"; the docs forbid a composite %):
> rank each skill's latest official result by `readiness` — `not_yet`(0) < `approaching`(1) <
> `met`(2), `not_assessed` excluded — and take the lowest. Ties break on the lower mean of that
> result's per-attribute `prob` values ... Still tied ⇒ the skill enum's declaration order.
> **No percentage is ever surfaced to the user.**

`focusSkill` is `null` when no skill has an official result. `readiness` vocabulary is fixed at
`met | approaching | not_yet | not_assessed` (`docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`).

## Design source

`portal--my-children-list.html` L29-32: `flex items-center justify-between`, 13px, `#7C8698`
(`text-caption text-portal-muted`). Left: the note. Right: `font-weight:600; color:#2563EB`
(`font-semibold text-primary`), literal `Details →`. The spec notes it "is decorative, the card
carries the click" — so it is `aria-hidden="true"` and never a second tab stop.

## Files

- `src/modules/children/components/ChildCardFooter.tsx` (new).
- `src/modules/children/lib/child-focus-note.ts` (new) — pure `getFocusNoteKey(row)` returning the
  i18n key + values; no JSX, no fetch.
- Catalogs (all six): `Children.focusNote` = `{skill} is the current focus — readiness {readiness}.`,
  `Children.focusNoteNone` = `No skill has an official result yet.`, `Children.detailsCue` = `Details`.

## Depends on

- `167` — the card shell.

## Steps

1. `getFocusNoteKey`: `focusSkill === null` → `focusNoteNone`; otherwise `focusNote` with
   `skill = t('resultSkills.' + focusSkill)` (the four keys already exist in all six catalogs) and
   `readiness = t('resultReadinessValues.' + readiness)` (also already present: Met / Approaching /
   Not yet / Not assessed).
2. The readiness value comes from the matching entry in `children[].skills`; if that skill is missing
   from `skills[]` the note falls back to `focusNoteNone` — never to a guess.
3. `Details →`: the arrow is a lucide `ArrowRight` at `size-3.5`, `aria-hidden`, so the glyph is not
   read out twice next to the link's `viewProfileLabel`.
4. Colour transition on the cue mirrors the card hover: `text-portal-muted` → `text-primary` is
   already static blue in the design, so the only motion here is the arrow's
   `group-hover:translate-x-0.5 transition-transform duration-200 ease-out-quart
   motion-reduce:transform-none`.

## Project rules

- `.claude/rules/i18n.md` — no interpolated English fragments; the whole sentence is one ICU message.
- `.claude/rules/module-pattern.md` — the derivation lives in `lib/`, not in the component.
- `.qa/intake/docs-constraints.md` §2 — only the controlled vocabulary may be shown.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: for each card, the note text equals the ICU render for the `focusSkill` + `readiness`
  the live `GET /api/my/progress` actually returned; for a child with no official result the note is
  `Children.focusNoteNone`.
- The footer contains no `%` and no invented adjective ("growth area", "lagging", "strongest") — the
  only words are catalog values.
- `Details` is `aria-hidden` and `Tab` still finds exactly one focusable per card.
- Motion: arrow nudge 200ms `ease-out-quart`, inert under `reducedMotion: 'reduce'`.
- 375px: the note wraps to two lines and the cue stays on the first line's right edge; no h-scroll.
- axe zero serious/critical; six catalogs key-identical.

## Assumptions

`Children.resultSkills.*` and `Children.resultReadinessValues.*` already exist in all six catalogs
(verified in `src/i18n/messages/en.json`); only the three new keys are added.

## Evidence

<!-- filled in as the task runs -->
