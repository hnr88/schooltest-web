---
id: 135
title: Build the hero stat row with the servable stats only — two cells, one separator, no third slot
layer: ui
kind: implement
slice: The hero stat row (design §3) rendered honestly around the BLOCKED "coming up" stat
target: src/modules/dashboard/components/DashboardHeroStats.tsx, src/modules/dashboard/components/DashboardHeroStat.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--main.html:31-37 · .qa/design/spec/01-portal-dashboard.md#3 #4.1 #4.2 #4.3
status: TODO
depends_on: ["133", "130"]
---

## Objective
The bottom row of the navy panel. The design shows three stats; only two have a data source. This
task builds the row so it renders **two** stats and **one** separator — never an empty third cell,
never a dash, never a zero standing in for the blocked number.

## Contract
`C-DASH-HOUSEHOLD` → `household.testsCompletedThisWeek` (rendered by 136) and
`household.practiceSecondsThisWeek` (rendered by 137).

The middle stat is **BLOCKED B-1** and is not rendered:
> **B-1** | `coming up` hero stat (`2`) | `portal--main.html:34` | No scheduling model exists
> anywhere: no `scheduled_at`/`due_at`/`assignment`/`sitting` field on any content-type; `class` is
> only `{name, year_band, teacher, students}`. Nothing to count.

**Explicitly forbidden in this task:** substituting a different metric into the third slot (e.g.
`resultsPublished` or `childCount`). The design's third slot is "coming up"; putting another number
under a different label is inventing a design element. The row is two cells wide. Recorded here so
the omission is a decision, not an oversight.

## Design source
- Row (`portal--main.html:31`): `display:flex; flex-wrap:wrap; gap:16px 24px; margin-top:auto;
  padding-top:28px; position:relative` → `relative mt-auto flex flex-wrap gap-y-4 gap-x-6 pt-7`.
  `gap-y-4` = 16px ✓, `gap-x-6` = 24px ✓, `pt-7` = 28px ✓. `data-slot="dashboard-hero-stats"`.
- Stat cell: `flex:none` → `shrink-0`, `data-slot="dashboard-hero-stat"` +
  `data-metric="tests-completed" | "practice-week"` so e2e can address them.
  - value: `font-size:24px; font-weight:700; letter-spacing:-0.02em`, inherited `#fff`
    → `text-h3 font-bold tracking-tight text-primary-foreground`
    (`--text-h3` = 24px ✓; `tracking-tight` = -0.025em vs -0.02em, 0.005em delta accepted).
  - sub-label: `font-size:12px; color:#8FA3C7; margin-top:3px`
    → `mt-0.5 text-xs text-navy-muted` (`text-xs` = 12px ✓, `--color-navy-muted` = `#8FA3C7` ✓,
    `mt-0.5` = 2px vs 3px).
- Separator (`:33`,`:35`): `<div style="width:1px;background:rgba(255,255,255,.12)">` full row
  height → `w-px self-stretch bg-navy-muted/30` (`#8FA3C7` at 30% reads as white-12% on navy and
  keeps the token rule). `aria-hidden="true"`. **Exactly one** separator, between the two cells.
- Semantics: the row is a `<dl>`; each cell is `<div><dd>{value}</dd><dt>{label}</dt></div>` so the
  value/label pair is announced as a pair. The visual order (value above label) is preserved with
  `flex flex-col` — do not reorder the DOM to fake it.
- Motion: the two values fade+rise in with a 60ms stagger —
  `animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out-expo motion-reduce:animate-none`,
  second cell `style={{ animationDelay: '60ms' }}`. Transform + opacity only, per tailwind rules.
- 375px: `flex-wrap` already handles it; the separator gets `max-sm:hidden` because a vertical rule
  between stacked cells is wrong — instead the second cell gets `max-sm:pt-4`.

## Files
- CREATE `src/modules/dashboard/components/DashboardHeroStat.tsx` — one cell (value, label, metric
  id). ≤40 lines.
- CREATE `src/modules/dashboard/components/DashboardHeroStats.tsx` — the `<dl>` row + separator.
- EDIT `DashboardHeroPanel` usage in `DashboardScreen` to slot it after the headline.

## Depends on
- **133** — the panel. **130** — the household data.
- 136 and 137 supply the two cells' formatted values and labels; this task ships the row with both
  cells present and may land in either order — the cells are addressed by `data-metric`.

## Steps
1. Build `DashboardHeroStat` (dumb, `dd`/`dt`).
2. Build the row with exactly two children and one `aria-hidden` separator.
3. Add the stagger + reduced-motion variant.

## Project rules
- `.claude/rules/tailwind.md` — animate transform/opacity only; exponential easing; no arbitrary
  values (`animationDelay` as an inline style is a runtime value, not a Tailwind arbitrary value,
  and is allowed).
- `.claude/rules/quality.md` — `<dl>`/`<dt>`/`<dd>` for stat pairs; decorative rule `aria-hidden`.
- `.qa/CONTRACTS.md` B-1 — the third slot is refused, not filled.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `[data-slot="dashboard-hero-stat"]` count is **exactly 2**;
  `[data-metric="coming-up"]` count is **0**.
- The separator count inside the row is exactly 1 and it is `aria-hidden`.
- Computed styles: value `font-size: 24px`, `font-weight: 700`; label `font-size: 12px`.
- Motion: with `page.emulateMedia({ reducedMotion: 'reduce' })` the cells' computed
  `animation-name` is `none`; without it, `animation-name` is non-`none` on first paint.
- 375px: cells stack, separator hidden, no horizontal overflow.
- Grep: `grep -rn "coming.up\|comingUp" src/modules/dashboard` returns nothing outside task 138's
  documentation. axe clean; six catalogs key-identical.

## Assumptions
- none

## Evidence
<filled in as the task runs>
