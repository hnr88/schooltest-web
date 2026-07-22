---
id: 185
title: Build the "Skills" card as four readiness rows in the sanctioned vocabulary
layer: ui
kind: build
slice: The SkillsCard — one row per skill with its CEFR band, readiness and display label, replacing the design's percentage bars.
target: src/modules/children/components/ChildSkillsCard.tsx (new), src/modules/children/components/ChildSkillBreakdown.tsx, src/modules/children/lib/child-skills.ts, src/i18n/messages/*.json
contract: C-DASH-HOUSEHOLD (children[].skills[])
design: .qa/design/screens/portal--child-detail.html (L43-55) · .qa/design/spec/02-portal-children.md §B.5
status: TODO
depends_on: ["177", "178"]
---

## Objective

Fill the design's Skills card with the four English skills, each carrying the values the product
docs sanction — CEFR band, readiness, ACARA phase, display label — and with the focus skill
highlighted exactly as the design highlights the weakest one. No percentage anywhere.

## Contract

`C-DASH-HOUSEHOLD` `children[].skills[]`:

> one entry per skill that HAS an official result; **never padded** —
> `{ skill: reading|listening|speaking|writing, cefrBand, readiness: met|approaching|not_yet|not_assessed,
> acaraPhase, displayLabel (nullable), publishedAt (nullable), resultDocumentId }`

`children[].focusSkill` names the weakest skill by the readiness rank the contract defines
(`not_yet` < `approaching` < `met`), or `null`.

Binding vocabulary (`.qa/intake/docs-constraints.md` §2, §3f):
- `readiness` ∈ `met, approaching, not_yet, not_assessed` — "There is no pass/fail."
- `attribute_status` ∈ `mastered, emerging, not_mastered, not_assessed` (task `186`).
- ACARA phase ∈ Beginning / Emerging / Developing / Consolidating — "the shared display currency
  across all four skills".

## Design source

`portal--child-detail.html` L43-55:
- Card chrome identical to §B.4: `bg-card rounded-3xl`, `padding:28px 30px`, `--shadow-portal-card`.
- `h2` (L44): `margin:0 0 20px`, 16px / 600 / `#0E2350` → `mb-5 text-base font-semibold text-navy-900`.
- Rows wrapper (L45): `flex flex-col gap-[13px]` (→ W0 token or `gap-3`).
- SkillRow (L47): `grid grid-cols-[76px_1fr_38px] items-center gap-3.5` — declare it as a named
  `@utility grid-cols-skill-row-portal` in `globals.css` (the file already owns `grid-cols-skill-row`),
  never an arbitrary bracket track.
- Name (L48): 13px / `#7C8698` → `text-caption text-portal-muted`.
- Middle column (L49): the design draws a 6px track (`#EEF1F6`) with a percentage-width fill —
  **the percentage is refused** (§B.5's `pct` is a mastery composite). The column instead carries the
  readiness chip: `rounded-full`, 12px/600, `px-3 py-1`, tone map —
  `met` → `bg-success-soft text-success-strong`; `approaching` → `bg-warning-soft text-warning-strong`;
  `not_yet` → `bg-portal-rule text-navy-900`; `not_assessed` → `bg-portal-rule text-portal-muted-2`.
- Right column (L50): 12px / 600 / `text-right` — the CEFR band, in `sk.color`:
  `#0E2350` (`text-navy-900`) normally, **`#2563EB` (`text-primary`) for the focus skill**, which
  "encodes emphasis, not value" (§B.5) — so the focus skill's row name and band both take the accent.
- Note (L54): `mt-5.5 pt-4.5 border-t border-portal-rule`, 13px / `#7C8698` / `leading-[1.55]`.

## Files

- `src/modules/children/components/ChildSkillsCard.tsx` (new).
- `ChildSkillBreakdown.tsx` — superseded/absorbed; its query wiring is preserved, its markup replaced.
- `child-skills.ts` — pure `getSkillRows(householdChild)` returning all four skills in enum order with
  `status: 'assessed' | 'not_assessed'`.
- Catalogs: `Children.skillsHeading`, `Children.skillsNote` = `{skill} is the current focus skill.`,
  `Children.skillsNoteNone`, `Children.skillDisplayLabel` (for the Crosswalk label line).

## Depends on

- `177` (view model), `178` (header).

## Steps

1. Always render four rows in enum order `reading, listening, speaking, writing` — a skill missing
   from `skills[]` renders `not_assessed` (docs §3g: "`not_assessed` ... never null, never 0.5,
   never silently carried forward"), not an omitted row.
2. `displayLabel` (e.g. `Critical Reader`) renders under the skill name at `text-xs
   text-portal-muted-2` when present; null renders nothing (no placeholder label).
3. Focus emphasis is driven by `focusSkill` from the API — never recomputed client-side.
4. The note is one catalog sentence naming the focus skill; the design's "lags about half a level
   behind" is an invented quantity and is not rendered.
5. Motion: rows enter with `st-fade-in` 180ms `--ease-out-quart`, staggered 40ms; chips use
   opacity/transform only; `motion-reduce:animate-none`.

## Project rules

- `.qa/intake/docs-constraints.md` §2, §3a-§3g — the controlled vocabulary, and probability is never
  shown as a sitting percentage here.
- `.claude/rules/tailwind.md` — named grid utility, tokens, no arbitrary values.
- `.claude/rules/quality.md` — chips carry text, not colour alone; AA contrast on every tone.
- `.claude/rules/i18n.md` — six catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: four rows always; each assessed row's band + readiness equal the live
  `children[].skills[]` entry; each unassessed row reads `Children.skillNotAssessed`; the row matching
  `focusSkill` carries the accent class and the note names the same skill.
- `await expect(skillsCard).not.toContainText('%')` passes.
- Motion present + reduced-motion inert.
- 375px: the 76px/1fr/38px track holds at 343px (chip wraps under the name if needed), no h-scroll;
  1280px: side by side with the Level journey.
- axe zero serious/critical; six catalogs key-identical.

## Assumptions

`Children.resultSkills.*` and `Children.resultReadinessValues.*` already exist in all six catalogs.

## Evidence

<!-- filled in as the task runs -->
