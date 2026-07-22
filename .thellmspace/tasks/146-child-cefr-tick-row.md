---
id: 146
title: Metric 6 — per-child CEFR tick row rendering the REAL ladder pre_A1..C1, not the design's A1..C2
layer: ui
kind: implement
slice: Design metric inventory row 6, corrected to the API's enum
target: src/modules/dashboard/components/DashboardCefrLadder.tsx, src/modules/dashboard/lib/cefr-ladder.ts
contract: C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--main.html:72-79 · .qa/design/spec/01-portal-dashboard.md#4.5 #10 (row 6)
status: TODO
depends_on: ["145", "130"]
---

## Objective
The six-tick CEFR strip inside each child row, showing where that child's latest official result
sits on the ladder this system actually has — rendered **once per skill**, per AMENDMENT A1.

## Contract
`C-DASH-HOUSEHOLD`, corrected by **AMENDMENT A1** (`.qa/CONTRACTS.md` "AMENDMENT A1 —
`C-DASH-HOUSEHOLD` v2"): v1 fed this strip from a per-child `children[].cefrBand` /
`children[].cefrStageIndex`; that pair is **DELETED** — a single per-child level is a cross-skill
composite (`DOC1:304`, `DOC0:46`; BLOCKED **B-9**). The strip is instead fed from
**`children[].skills[]`**, which always has four entries (`reading, listening, speaking, writing`),
each carrying its own nullable `cefrBand`. `cefrStageIndex` is no longer served by the API at all —
it is computed client-side per skill via `getCefrStageIndex(skill.cefrBand)` (`results` module,
task 091). Plus the contract's ladder note, quoted verbatim:

> **`CEFR_LADDER`** is exactly the API enum, in order: `["pre_A1","A1","A2","B1","B2","C1"]`
> (`result/content-types/result/schema.json`, `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`).
> **The design draws six ticks labelled `A1 A2 B1 B2 C1 C2`; `C2` does not exist in this system and
> `pre_A1` does.** The UI renders the real ladder with the design's tick visual. Recorded as a
> design↔data conflict, not silently reconciled.

**UI consequence for W5 (quoted from AMENDMENT A1):** "The design's per-child CEFR tick rail
becomes **one rail per skill** (reading, listening, speaking, writing), each over the real ladder
`pre_A1 → A1 → A2 → B1 → B2 → C1`." So: **four strips per child row, one per skill**, each six
ticks, same visual, labels `pre-A1 A1 A2 B1 B2 C1`. **`C2` must appear nowhere.**

## Design source
- The design draws ONE strip per child row (`portal--main.html:72`); AMENDMENT A1 requires FOUR —
  one per `children[].skills[]` entry, in `SKILL_ORDER` — reusing the same strip markup per skill,
  each labelled with its skill name so the four rails are distinguishable. No new visual language is
  invented: it is the design's one strip, repeated, with a skill label prefixed.
- Strip (`portal--main.html:72`): `flex:1; display:flex; align-items:center; gap:6px;
  min-width:120px` → `flex min-w-30 flex-1 items-center gap-1.5`
  (`gap-1.5` = 6px ✓, `min-w-30` = 7.5rem = 120px ✓ exact).
  `data-slot="dashboard-cefr-ladder"` + `data-skill={skill}` (one per skill, four per child).
- Tick (`:74`): `display:flex; flex-direction:column; align-items:center; gap:5px; flex:1;
  max-width:52px` → `flex max-w-13 flex-1 flex-col items-center gap-1.5`
  (`max-w-13` = 3.25rem = 52px ✓ exact; `gap-1.5` = 6px vs 5px, 1px delta).
  `data-slot="dashboard-cefr-tick"` + `data-band={band}` + `data-reached={boolean}`.
  - bar: `width:100%; height:5px; border-radius:99px; background:{{ d.bg }}`
    → `h-1.5 w-full rounded-full` (`h-1.5` = 6px vs 5px, 1px delta).
  - label: `font-size:10px; font-weight:{{ d.w }}; color:{{ d.fg }}`.
    **NEW token** `--text-tick: 0.625rem` (10px) in the `@theme` block of `src/app/globals.css`
    with the provenance comment `/* 10px — CEFR tick label, portal--main.html:76 */`; nothing in
    the scale is 10px (`--text-micro` is 11px). Register `'tick'` in
    `THEME_CLASS_GROUPS['font-size']` in `src/lib/utils.ts` or
    `tests/e2e/design-tokens.spec.ts` fails on parity and `cn()` drops `text-tick`.
- Rendering rule, translated from the design's 1-based `journeyStage` (`Parent Portal.dc.html:976-978`)
  to the per-skill 0-based stage index (`getCefrStageIndex(skill.cefrBand)`, task 091):
  | design | shipped |
  |---|---|
  | bar `bg = j < journeyStage ? '#0E2350' : '#EEF1F6'` | `reached = stageIndex !== null && j <= stageIndex` → `bg-navy-900` else `bg-divider` |
  | label `fg = j === journeyStage-1 ? '#0E2350' : '#9AA6B8'` | `current = j === stageIndex` → `text-navy-900` else `text-slate-400` |
  | label `font-weight = j === journeyStage-1 ? 700 : 500` | `current` → `font-bold` else `font-medium` |
  `--color-navy-900` = `oklch(0.2692 0.0871 263.0388)` ✓; `--color-divider` =
  `oklch(0.9595 0.008 253.8534)`; `--color-slate-400` = `oklch(0.7107 0.0351 256.7878)`.
- **a skill's `cefrBand === null`** (that skill has `readiness: "not_assessed"` — contractual): its
  strip's six ticks are all unreached, all labels muted, no bold tick, and it carries
  `aria-label={t('Dashboard.children.cefrNotAssessed', { skill })}` = "{skill}: no official result
  yet". Never default to index 0 (that would assert the skill sits at `pre_A1`, which is a claim,
  not an absence). This is per skill — a child may have some skills reached and others not_assessed
  at once, and each of the four strips is independently correct.
- Accessibility: each strip is NOT a progress bar (a CEFR band is a lookup, not a scale — B-4). It
  renders as a single element with
  `aria-label={t('Dashboard.children.cefrLadder', { skill, band })}` = `"{skill} CEFR band: {band}"`
  (the `{skill}` placeholder is new — AMENDMENT A1 makes this one of four strips, so the accessible
  name must say which skill it names), and every tick is `aria-hidden`. This deliberately avoids
  `role="progressbar"` with a `valuenow`, which would re-introduce the banned scale semantics.
- Motion: the reached ticks fade in left→right — `animate-in fade-in duration-200 ease-out-expo`
  with an inline `animationDelay` of `j * 40ms`, `motion-reduce:animate-none`. Opacity only; no
  width animation (banned).
- 375px: `min-w-30` (120px) plus the name block does not fit at 375px — 157 moves the strip onto its
  own line under the name. Keep the strip `w-full` capable by not hard-coding a width.

## Files
- CREATE `src/modules/dashboard/lib/cefr-ladder.ts` — `toCefrTicks(cefrStageIndex): CefrTick[]`
  over `CEFR_LADDER` (the constant added in 134). Pure. Unchanged by AMENDMENT A1 — it takes a
  stage index, not a child; the caller now supplies one per skill.
- CREATE `src/modules/dashboard/components/DashboardCefrLadder.tsx` — renders ONE strip; it accepts
  a `skill` + `cefrBand` (or a pre-computed `stageIndex`), never a whole child. A sibling
  `DashboardCefrLadderGroup` (or equivalent loop in `DashboardChildRow`) renders it four times, once
  per `SKILL_ORDER` entry, from `children[].skills[]`.
- CREATE `tests/unit/cefr-ladder.test.ts` — `null`, `0`, `3`, `5`, and an out-of-range index
  (must clamp, never throw).
- EDIT `src/app/globals.css` (+`--text-tick`), `src/lib/utils.ts` (+`'tick'`).
- EDIT `DashboardChildRow` — slot **four** strips (one per skill) after the name block, each
  labelled with its skill name.
- i18n: `Dashboard.cefr.pre_A1|A1|A2|B1|B2|C1` (from 134), `Dashboard.children.cefrLadder`
  (now takes a `{skill}` placeholder), `Dashboard.children.cefrNotAssessed` (now takes a `{skill}`
  placeholder).

## Depends on
- **145** (the row), **130** (household data), **091** (`getCefrStageIndex`, the client-side
  per-skill ladder lookup that replaces the deleted per-child `cefrStageIndex`). `CEFR_LADDER`
  comes from **134**.

## Steps
1. Add the token + registration; unit test the ladder helper (red→green).
2. Build ONE strip component parameterised by skill + band; wire the three visual rules off
   `getCefrStageIndex(skill.cefrBand)`.
3. Render it four times per child row, once per `children[].skills[]` entry, in `SKILL_ORDER`.
4. Six-catalog band labels, and the skill-parameterised `cefrLadder`/`cefrNotAssessed` strings.

## Project rules
- `.claude/rules/tailwind.md` — no arbitrary values; animate opacity only; OKLCH tokens.
- `.claude/rules/quality.md` — no misleading ARIA roles; decorative ticks hidden.
- `.qa/CONTRACTS.md` C-DASH-HOUSEHOLD ladder note; B-4 (no CEFR scale).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean; unit test green; `design-tokens.spec.ts` green with
  `--text-tick` registered.
- Playwright against live data: every child row has exactly **four** strips (one per skill), each
  with exactly 6 `[data-slot="dashboard-cefr-tick"]`; their `data-band` sequence is
  `pre_A1,A1,A2,B1,B2,C1` in order in every strip.
- `grep -rn "C2" src/modules/dashboard src/i18n/messages/en.json` returns zero CEFR-band hits.
- For each skill of each child in the live response, the count of `[data-reached="true"]` ticks
  equals `getCefrStageIndex(skill.cefrBand) + 1` (and is 0 when that skill's `cefrBand` is null) —
  recomputed in the test from the API body, never hardcoded. There is no per-child
  `cefrStageIndex` to assert against — AMENDMENT A1 deleted it.
- The bold tick's `data-band` equals that strip's skill's `cefrBand`.
- Null stub: a skill entry with `cefrBand: null, readiness: 'not_assessed'` ⇒ 0 reached ticks, no
  bold label, that strip's `aria-label` is the not-assessed string naming the skill.
- Computed: tick label `font-size: 10px`; reached bar colour resolves to
  `oklch(0.2692 0.0871 263.0388)`.
- Reduced motion ⇒ tick `animation-name: none`.
- axe clean (no `progressbar` without a value); six catalogs key-identical.
- No `[data-slot="dashboard-cefr-ladder"]` instance is fed a per-child `cefrBand`/`cefrStageIndex`
  — grep the diff for either identifier on the child object and find nothing (B-9 stays refused).

## Assumptions
- `getCefrStageIndex` always returns a valid index into the 6-item ladder for a non-null band; the
  helper clamps defensively regardless. Applied independently to each of the four skills.

## Evidence
<filled in as the task runs>
