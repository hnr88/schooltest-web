---
id: 183
title: Build the "Level journey" six-tick CEFR ladder on the real API ladder, with its note
layer: ui
kind: build
slice: The LevelJourney card — six dots, connectors, current pip, labels, and an honest note line under the rail.
target: src/modules/children/components/ChildLevelJourney.tsx (new), src/modules/children/constants/child-metrics.constants.ts, src/i18n/messages/*.json
contract: C-DASH-HOUSEHOLD (cefrBand, cefrStageIndex, acaraPhase)
design: .qa/design/screens/portal--child-detail.html (L30-42) · .qa/design/spec/02-portal-children.md §B.4
status: TODO
depends_on: ["177", "178"]
---

## Objective

Ship the design's six-tick ladder using the ladder this system actually has — **once per skill**,
per AMENDMENT A1 — and replace the design's invented pace narrative with a one-line statement of
the band, the phase and where it came from.

## Contract

`.qa/CONTRACTS.md` C-DASH-HOUSEHOLD, verbatim:

> **`CEFR_LADDER`** is exactly the API enum, in order: `["pre_A1","A1","A2","B1","B2","C1"]`
> (`result/content-types/result/schema.json`, `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`).
> **The design draws six ticks labelled `A1 A2 B1 B2 C1 C2`; `C2` does not exist in this system and
> `pre_A1` does.** The UI renders the real ladder with the design's tick visual. Recorded as a
> design↔data conflict, not silently reconciled.

**AMENDMENT A1 (`.qa/CONTRACTS.md` "AMENDMENT A1 — `C-DASH-HOUSEHOLD` v2") supersedes the v1 shape
this card was designed against.** v1 fed ONE journey from a per-child `cefrBand`/`cefrStageIndex`;
that pair is **DELETED** — a single per-child level is a cross-skill composite (`DOC1:304`,
`DOC0:46`; BLOCKED **B-9**). There is no per-child journey. Quoted verbatim, the UI consequence:

> The design's per-child CEFR tick rail becomes **one rail per skill** (reading, listening,
> speaking, writing), each over the real ladder `pre_A1 → A1 → A2 → B1 → B2 → C1`.

So `ChildLevelJourney` renders **four journeys, one per `children[].skills[]` entry**, each keyed
by that skill's own `cefrBand`. `cefrStageIndex` is no longer served by the API — each journey's
stage is computed client-side as `getCefrStageIndex(skill.cefrBand)` (task 091), `null` when that
skill's `cefrBand` is null (i.e. `readiness: "not_assessed"`). Both the band and the stage index
are Crosswalk lookups (`docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:192`), never computed.

## Design source

`portal--child-detail.html` L30-42 draws ONE card with ONE track; AMENDMENT A1 requires FOUR
tracks in that one card, one per skill, each with its own heading naming the skill
(`Children.resultSkills.*`, already in all six catalogs — reuse, do not add a second skill
vocabulary):
- Card: `bg-card rounded-3xl`, `padding:28px 30px`, `--shadow-portal-card` — unchanged, still one
  card; it now stacks four skill sections inside it.
- `h2` (L31): 16px / 600 / `#0E2350` → `text-base font-semibold text-navy-900` — the card-level
  heading (`Children.levelJourneyHeading`, e.g. "Level journey"); each of the four skill sections
  additionally carries its own skill-name sub-heading above its track.
- Track (L32): `flex items-center gap-0 mt-6.5` (26px → `mt-6`) — repeated four times, once per
  skill, in `SKILL_ORDER`.
- Step (L34): `flex-1 flex flex-col items-center gap-2 relative`.
- Connector (L35): `absolute top-[9px] h-0.5`, `left: 50%` for the first step else `0`,
  `right: 50%` for the last step else `0`; `background` `#0E2350` when `i <= stage-1` else `#EEF1F6`
  (`bg-navy-900` / `bg-portal-rule`). `top:9px` centres the 2px rail on the 20px dot.
- Dot (L36): `size-5` (20px), `rounded-full`, `border-2`, `box-border`, `grid place-items-center`.
  Done or current → `bg-navy-900 border-navy-900`; future → `bg-card border-portal-border` (`#D8DFEA`).
  **Current only**: inner pip `size-1.5` (6px) `rounded-full bg-white`.
- Label (L37): 12px (`text-xs`); current → `font-bold text-navy-900`; done → `font-medium text-navy-900`;
  future → `font-medium text-portal-muted-2` (`#9AA6B8`).
- Note (L41): `mt-6 pt-4.5 border-t border-portal-rule`, 13px / `#7C8698` / `leading-[1.55]`
  → `text-caption text-portal-muted leading-relaxed`.

## Files

- `src/modules/children/components/ChildLevelJourney.tsx` (new) — renders the card and loops
  `children[].skills[]` (always four entries, `SKILL_ORDER`), rendering one track per skill inside
  it. No new file is needed for the per-skill loop — one component, four tracks.
- `child-metrics.constants.ts` — `CEFR_LADDER` as the single ordered constant (six entries),
  unchanged by AMENDMENT A1 — the ladder itself is still real, just consumed per skill now.
- Catalogs: `Children.levelJourneyHeading`, `Children.cefrBands.{pre_A1,A1,A2,B1,B2,C1}`,
  `Children.journeyNote` = `Currently {band} ({phase}), from the official result published {date}.`
  (rendered once per skill, using that skill's own band/phase/date),
  `Children.journeyNoteUnassessed` = `No official result has been published yet, so no level is shown.`,
  `Children.journeyStepLabel` = `{skill}, {band}, step {index} of {total}` (the `{skill}` placeholder
  is new — AMENDMENT A1 makes the accessible name ambiguous across four tracks without it; reuse
  `Children.resultSkills.*` to fill it, do not add a second skill vocabulary).

## Depends on

- `177` (view model + two-up grid), `178` (header above it).

## Steps

1. Render the six REAL bands, once per skill. `pre_A1` displays as `Pre-A1`. Never render `C2`;
   record the conflict in Evidence with the contract quote.
2. For each skill: `getCefrStageIndex(skill.cefrBand) === null` (i.e.
   `readiness === 'not_assessed'`) → every dot in THAT skill's track is future, no pip, and its note
   is `journeyNoteUnassessed`. Do not default any skill to `pre_A1`. A child may show some skills
   reached and others unassessed in the same card — that is the correct, honest rendering.
3. Semantics: each skill's track is its own `<ol>`; each step's accessible name is
   `Children.journeyStepLabel` (now including the skill name); each track's current step carries
   `aria-current="step"`. Colour is not the only signal (the pip + the `aria-current` + the bold
   label carry it) — WCAG 1.4.1.
4. Motion (the spec's own suggestion, §ANIMATIONS "Motion opportunities"): connectors draw
   left-to-right via `transform: scaleX(0) → scaleX(1)` with `transform-origin: left`, 180ms,
   `--ease-out-quart`, staggered 60ms per completed step; the current pip enters with `st-pop-in`
   180ms. `scaleX` is transform-only, so `.claude/rules/tailwind.md:19` is satisfied — never animate
   `width`. `motion-reduce:animate-none motion-reduce:transform-none` renders the final state at once.
5. The note is one catalog sentence with real values only — no pace, no "at this pace B2 by 2027",
   no month arithmetic.

## Project rules

- `.claude/rules/tailwind.md:19` — transform/opacity only.
- `.claude/rules/quality.md` — ordered semantics, `aria-current`, contrast AA on every label state.
- `.qa/intake/docs-constraints.md` §3d — CEFR is a lookup; §3g — `not_assessed` is first-class.
- `.claude/rules/i18n.md` — six catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: **four tracks per child, one per skill**, each with exactly six steps labelled
  `Pre-A1, A1, A2, B1, B2, C1`; **no `C2` anywhere** (`expect(page.getByText('C2')).toHaveCount(0)`);
  in each track, the step carrying `aria-current="step"` is at index
  `getCefrStageIndex(skill.cefrBand)` for that skill from the live `GET /api/my/progress`; when
  that skill's `cefrBand` is null no step in its track is current. There is no per-child
  `cefrStageIndex` to assert against (AMENDMENT A1 deleted it).
- Each track's note text equals the ICU render for that skill's own live band/phase/date, or the
  unassessed branch for that skill alone.
- Motion: connectors animate `transform` (assert `getAnimations()` non-empty and that no animation
  targets `width`); under `reducedMotion: 'reduce'` the final state renders with zero animations.
- 375px: six ticks fit the 343px content box (12px labels, longest `Pre-A1`), no h-scroll, and all
  four tracks stack without overflow; 1280px: the card sits side by side with the Skills card.
- axe zero serious/critical; six catalogs key-identical.
- No component receives a per-child `cefrBand`/`cefrStageIndex`/`acaraPhase` prop — grep the diff
  for any of the three on a child (not skill) object and find nothing (B-9 stays refused).

## Assumptions

A skill's `acaraPhase` may be null while its `cefrBand` is present; that skill's note then omits
the phase clause via a separate ICU message rather than printing an empty parenthesis.

## Evidence

<!-- filled in as the task runs -->
