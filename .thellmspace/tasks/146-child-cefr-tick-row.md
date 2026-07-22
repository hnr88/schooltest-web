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
sits on the ladder this system actually has.

## Contract
`C-DASH-HOUSEHOLD` → `children[].cefrBand` (nullable) and `children[].cefrStageIndex`
(0-based, null when `cefrBand` is null), plus the contract's ladder note, quoted verbatim:

> **`CEFR_LADDER`** is exactly the API enum, in order: `["pre_A1","A1","A2","B1","B2","C1"]`
> (`result/content-types/result/schema.json`, `docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:43-53`).
> **The design draws six ticks labelled `A1 A2 B1 B2 C1 C2`; `C2` does not exist in this system and
> `pre_A1` does.** The UI renders the real ladder with the design's tick visual. Recorded as a
> design↔data conflict, not silently reconciled.

So: six ticks, same visual, labels `pre-A1 A1 A2 B1 B2 C1`. **`C2` must appear nowhere.**

## Design source
- Strip (`portal--main.html:72`): `flex:1; display:flex; align-items:center; gap:6px;
  min-width:120px` → `flex min-w-30 flex-1 items-center gap-1.5`
  (`gap-1.5` = 6px ✓, `min-w-30` = 7.5rem = 120px ✓ exact).
  `data-slot="dashboard-cefr-ladder"`.
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
- Rendering rule, translated from the design's 1-based `journeyStage`
  (`Parent Portal.dc.html:976-978`) to the contract's 0-based `cefrStageIndex`:
  | design | shipped |
  |---|---|
  | bar `bg = j < journeyStage ? '#0E2350' : '#EEF1F6'` | `reached = cefrStageIndex !== null && j <= cefrStageIndex` → `bg-navy-900` else `bg-divider` |
  | label `fg = j === journeyStage-1 ? '#0E2350' : '#9AA6B8'` | `current = j === cefrStageIndex` → `text-navy-900` else `text-slate-400` |
  | label `font-weight = j === journeyStage-1 ? 700 : 500` | `current` → `font-bold` else `font-medium` |
  `--color-navy-900` = `oklch(0.2692 0.0871 263.0388)` ✓; `--color-divider` =
  `oklch(0.9595 0.008 253.8534)`; `--color-slate-400` = `oklch(0.7107 0.0351 256.7878)`.
- **`cefrBand === null`** (child never assessed — contractual): all six ticks unreached, all labels
  muted, no bold tick, and the strip carries
  `aria-label={t('Dashboard.children.cefrNotAssessed')}` = "No official result yet". Never default
  to index 0 (that would assert the child sits at `pre_A1`, which is a claim, not an absence).
- Accessibility: the strip is NOT a progress bar (a CEFR band is a lookup, not a scale — B-4). It
  renders as a single element with
  `aria-label={t('Dashboard.children.cefrLadder', { band })}` = `"CEFR band: {band}"`, and every
  tick is `aria-hidden`. This deliberately avoids `role="progressbar"` with a `valuenow`, which
  would re-introduce the banned scale semantics.
- Motion: the reached ticks fade in left→right — `animate-in fade-in duration-200 ease-out-expo`
  with an inline `animationDelay` of `j * 40ms`, `motion-reduce:animate-none`. Opacity only; no
  width animation (banned).
- 375px: `min-w-30` (120px) plus the name block does not fit at 375px — 157 moves the strip onto its
  own line under the name. Keep the strip `w-full` capable by not hard-coding a width.

## Files
- CREATE `src/modules/dashboard/lib/cefr-ladder.ts` — `toCefrTicks(cefrStageIndex): CefrTick[]`
  over `CEFR_LADDER` (the constant added in 134). Pure.
- CREATE `src/modules/dashboard/components/DashboardCefrLadder.tsx`.
- CREATE `tests/unit/cefr-ladder.test.ts` — `null`, `0`, `3`, `5`, and an out-of-range index
  (must clamp, never throw).
- EDIT `src/app/globals.css` (+`--text-tick`), `src/lib/utils.ts` (+`'tick'`).
- EDIT `DashboardChildRow` — slot the strip after the name block.
- i18n: `Dashboard.cefr.pre_A1|A1|A2|B1|B2|C1` (from 134), `Dashboard.children.cefrLadder`,
  `Dashboard.children.cefrNotAssessed`.

## Depends on
- **145** (the row), **130** (household data). `CEFR_LADDER` comes from **134**.

## Steps
1. Add the token + registration; unit test the ladder helper (red→green).
2. Build the strip; wire the three visual rules off `cefrStageIndex`.
3. Six-catalog band labels.

## Project rules
- `.claude/rules/tailwind.md` — no arbitrary values; animate opacity only; OKLCH tokens.
- `.claude/rules/quality.md` — no misleading ARIA roles; decorative ticks hidden.
- `.qa/CONTRACTS.md` C-DASH-HOUSEHOLD ladder note; B-4 (no CEFR scale).

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean; unit test green; `design-tokens.spec.ts` green with
  `--text-tick` registered.
- Playwright against live data: every row has exactly 6 `[data-slot="dashboard-cefr-tick"]`; their
  `data-band` sequence is `pre_A1,A1,A2,B1,B2,C1` in order.
- `grep -rn "C2" src/modules/dashboard src/i18n/messages/en.json` returns zero CEFR-band hits.
- For each child in the live response, the count of `[data-reached="true"]` ticks equals
  `cefrStageIndex + 1` (and is 0 when `cefrStageIndex` is null) — recomputed in the test from the
  API body, never hardcoded.
- The bold tick's `data-band` equals the child's `cefrBand`.
- Null stub: a child with `cefrBand: null, cefrStageIndex: null` ⇒ 0 reached ticks, no bold label,
  strip `aria-label` is the not-assessed string.
- Computed: tick label `font-size: 10px`; reached bar colour resolves to
  `oklch(0.2692 0.0871 263.0388)`.
- Reduced motion ⇒ tick `animation-name: none`.
- axe clean (no `progressbar` without a value); six catalogs key-identical.

## Assumptions
- `cefrStageIndex` is always a valid index into the 6-item ladder when non-null; the helper clamps
  defensively regardless.

## Evidence
<filled in as the task runs>
