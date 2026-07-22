---
id: 141
title: Metric 4 — seven practice bars with heights NORMALISED from the week's max, not px==minutes
layer: ui
kind: implement
slice: Design metric inventory row 4
target: src/modules/dashboard/lib/practice-chart.ts, src/modules/dashboard/components/DashboardPracticeBar.tsx
contract: C-DASH-HOUSEHOLD
design: .qa/design/screens/portal--main.html:45-52 · .qa/design/spec/01-portal-dashboard.md#4.4 #10 (row 4)
status: TODO
depends_on: ["140", "130"]
---

## Objective
The seven-day bar chart, driven by `household.practiceByDay`, with heights computed as a share of
the week's maximum — the design's px values are NOT minutes and must not be copied.

## Contract
`C-DASH-HOUSEHOLD` →
> `"practiceByDay": [  // EXACTLY 7 entries, oldest -> newest, trailing 7 days incl. today
>    { "date": "2026-07-16", "weekday": "M", "seconds": 2040 } ]`

Seven entries are guaranteed by the contract; the client must still render defensively over
`practiceByDay.length` and never index `[0..6]` blindly.

## Design source
- Column (`:46-52`): `flex:1; display:flex; flex-direction:column; align-items:center; gap:8px`
  → `flex flex-1 flex-col items-center gap-2` (`gap-2` = 8px ✓).
- Bar: `width:100%; max-width:30px; height:{N}px; background:{colour}; border-radius:8px`
  → `w-full max-w-8 rounded-md` + an **inline** `style={{ height: \`${pct}%\` }}`.
  `max-w-8` = 2rem = 32px (design 30px, 2px delta). `rounded-md` = `calc(0.625rem * 0.8)` = 8px ✓
  exact. A Tailwind arbitrary height (`h-[88px]`) is banned AND wrong; a computed inline style is
  the only correct way to express a data-driven dimension and is not an arbitrary Tailwind value.
- **Normalisation — this is the whole point of the task.** Spec §4.4 IMPLICATION, quoted:
  > bar `height` in px equals the minutes value 1:1 for Thursday (`88px` ↔ `88 min`). If that holds
  > for all bars the week totals `34+52+42+88+60+26+14 = 316 min = 5h 16m`, which contradicts the
  > hero's `4h 20m` (`260 min`). The two numbers in the design are not derived from one dataset.
  > **A real implementation must normalise bar height to `min-height:120px` from the max value
  > rather than copy px = minutes.**

  Therefore, in `lib/practice-chart.ts`:
  - `maxSeconds = Math.max(...days.map(d => d.seconds))`
  - `pct = maxSeconds === 0 ? 0 : Math.round((d.seconds / maxSeconds) * 100)`
  - a non-zero day never renders invisibly: `pct = Math.max(pct, 6)` when `d.seconds > 0`
  - a genuinely zero day renders a 2px stub (`h-0.5`, no percentage) in the idle colour so the
    column is still present and labelled — an absent column would misrepresent the week.
- Highlight rule (spec §4.4): the max-value day is filled navy and its label goes weight 600 navy;
  all other days idle.
  - max bar → `bg-navy-900` (`--color-navy-900`, `#0E2350` ✓ exact)
  - idle bar → `bg-border` (`--color-border` = `oklch(0.9295 0.0121 259.823)`, `#E3E8F0`; design
    `#E4E9F2` has no token — nearest sanctioned, record the delta)
  - max label → `font-semibold text-navy-900`; idle label → `font-normal text-slate-400`
    (`--color-slate-400` = `oklch(0.7107 0.0351 256.7878)`, `#94A3B8`; design `#9AA6B8`)
  - Tie on the maximum ⇒ highlight the **latest** date among the tied days (deterministic).
  - `maxSeconds === 0` ⇒ **no** highlight at all; every column is idle (see 143 for the caption).
- Weekday letter: `font-size:11px` → `text-micro` (`--text-micro` = 0.6875rem = 11px ✓ exact).
  **Do NOT render the API's `weekday` field** — it is an English letter (`"M"`). Derive it from
  `date` with next-intl `useFormatter().dateTime(new Date(d.date), { weekday: 'narrow' })` so `zh`,
  `ko`, `ms`, `vi`, `th` get their own letter.
- Accessibility: the plot is a `<ul>` of `<li>` columns; each column has an accessible name from
  `t('Dashboard.practice.barLabel', { day, minutes })` = `"{day}: {minutes} minutes"` with `day`
  formatted `weekday: 'long'`. The bar itself is `aria-hidden` and the `<li>` carries the label, so
  a screen reader gets seven readable data points instead of seven blank boxes. `role="img"` +
  `aria-label` on the plot summarising the week is NOT used — per-point text is better.
- Motion: each bar `animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out-expo` with an
  inline `animationDelay` of `index * 40ms`, plus `motion-reduce:animate-none`. Transform + opacity
  only — height/width must never be transitioned (`.claude/rules/tailwind.md`).
- 375px: seven `flex-1` columns at `gap-3.5` fit inside a 375px card (≈ 24px per column) — verified,
  no scroll, labels stay legible at 11px. `max-w-8` keeps them from ballooning at 1280px.

## Files
- CREATE `src/modules/dashboard/lib/practice-chart.ts` — `toPracticeBars(days): PracticeBar[]`
  (`{ date, seconds, minutes, pct, isMax }`). Pure.
- CREATE `src/modules/dashboard/types/practice-chart.types.ts` — `PracticeBar`.
- CREATE `src/modules/dashboard/components/DashboardPracticeBar.tsx` — one column.
- CREATE `tests/unit/practice-chart.test.ts` — all-zero week; single non-zero day; tie on max;
  a 1-second day (must clamp to 6%); the contract's own example week.
- EDIT `DashboardPracticeChart.tsx` — render the `<ul>`.
- i18n: `Dashboard.practice.barLabel`.

## Depends on
- **140** (card + plot area), **130** (household data).

## Steps
1. Unit test first (red), then `toPracticeBars` (green).
2. Build the column component with the inline percentage height and the derived narrow weekday.
3. Wire the `<ul>`, the accessible names, and the staggered entrance.

## Project rules
- `.claude/rules/tailwind.md` — animate transform/opacity ONLY; no arbitrary values; OKLCH tokens.
- `.claude/rules/module-pattern.md` — normalisation is business logic ⇒ `lib/`; type ⇒ `types/`.
- `.claude/rules/quality.md` — every data point keyboard-independent but screen-reader readable;
  never a `<div onClick>`.
- `.claude/rules/testing.md` — TDD; Playwright is the proof.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean; new unit test green.
- Playwright against live data: read `GET /api/my/progress`; assert exactly 7
  `[data-slot="dashboard-practice-bar"]` elements; for each, the element's computed `height`
  divided by the plot's content height, rounded, equals the `pct` the test recomputes from
  `practiceByDay` — proving normalisation, not px==minutes.
- Assert explicitly that **no** bar's computed height in px equals its minutes value unless that is
  also the normalised value (i.e. the px==minutes bug is absent): with a stubbed week
  `[10,20,30,40,50,60,70]` minutes, the tallest bar is ~120px and the smallest ~17px, NOT 70px/10px.
- Highlight: the bar whose `seconds` is max has computed `background-color` resolving to
  `oklch(0.2692 0.0871 263.0388)` and exactly one bar does.
- All-zero stub: `page.route` a week of zeros ⇒ 7 columns present, none highlighted, each 2px tall.
- Locale: at `/zh/dashboard` the weekday letters differ from the `en` render (proving the narrow
  letter is derived, not the API's `"M"`).
- Reduced motion: `emulateMedia({ reducedMotion: 'reduce' })` ⇒ every bar's `animation-name` is
  `none`.
- 375px: plot fits, `scrollWidth <= clientWidth` on the card. axe clean (each `<li>` has a name).
- Six catalogs key-identical; zero banned-pattern hits; `grep -rn "h-\[" src/modules/dashboard`
  returns nothing.

## Assumptions
- The plot's content box is the 120px `min-h-30` unless the card stretches; percentages are relative
  to whatever it resolves to, which is the correct behaviour.

## Evidence
<filled in as the task runs>
