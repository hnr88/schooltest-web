---
id: 235
title: Re-skin the filter groups to the design's 42px on/off chips, shared by rail and dialog
layer: ui
kind: implement
slice: The design's §8.6 filter groups — label + wrapped chip row, on/off states
target: src/modules/school-search/components/SchoolFilterControls.tsx, src/modules/design-system/components/choice-pill-group.tsx
contract: n/a (presentation over the existing store actions)
design: .qa/design/screens/portal--main.html:218-251 · .qa/design/spec/01-portal-dashboard.md#8.6
status: TODO
depends_on: ["234"]
---

## Objective

Every school filter group renders as the design's chip group: a 13/600 navy label over a wrapped
row of 42px pills with the design's exact on/off treatment. ONE controls component feeds both the
persistent rail and the overlay dialog.

## Contract

n/a. The store actions (`setStates`, `setSectors`, `setSchoolTypes`, `setToggles`,
`setFeeRange`) and the `aria-pressed` contract are unchanged — `school-filter-panel.spec.ts:29,33`
asserts `aria-pressed` flips on the QLD control.

Design spec quoted (§8.6):

> Each group: label `font-size:13px; font-weight:600; color:#0E2350; margin-bottom:9px`, then
> `display:flex; gap:8px; flex-wrap:wrap`.
> Chip button: `height:42px; padding:0 17px; border-radius:999px; font-size:13.5px;
> font-weight:500; background:{{bg}}; color:{{fg}}; border:1.5px solid {{border}}`.
>
> | State | background | color | border |
> |---|---|---|---|
> | on | `#0E2350` | `#FFFFFF` | `#0E2350` |
> | off | `#FFFFFF` | `#3D4A5C` | `#D8DFEA` |

## Design source

`.qa/design/screens/portal--main.html:223,231,239,247`.

| Property | Design | Implementation |
|---|---|---|
| Group label | 13 / 600 / `#0E2350`, `mb:9px` | `mb-2.25 text-meta font-semibold text-navy-900` — rendered as the existing `FilterRailSection` heading so `getByRole('heading', …)` in two specs keeps matching |
| Row | flex wrap, gap 8 | `flex flex-wrap gap-2` |
| Chip size | h42, `0 17px`, r999 | new `ChoicePillSize` `'lg'`: `h-10.5 px-4.25 rounded-full` |
| Chip type | 13.5 / 500 | `text-body-sm font-medium` (`--text-body-sm` = 0.84375rem = 13.5px) |
| ON | `#0E2350` fill / white ink / `#0E2350` 1.5px border | `border-navy-900 bg-navy-900 text-primary-foreground font-semibold` |
| OFF | white / `#3D4A5C` / `#D8DFEA` 1.5px | `border-input bg-card text-body` (`--color-body` `#475569`, 7.58:1; the design's `#3D4A5C` is 9:1 and equally fine, but only `--color-body` exists as a token) |
| Border width | 1.5px | `border-[1.5px]` is an arbitrary value → use `border` (1px) and record the 0.5px deviation, OR add `--border-chip: 1.5px` in W0's foundation. Prefer `border` + note |

The design's four groups (City / School type / Programs / Minimum rating) are NOT the app's
filter vocabulary. City, Programs and Minimum rating have no counterpart in
`POST /api/search/schools` (`.qa/intake/api-inventory.md` §10) — see task 246. The groups
rendered are the REAL ones, keeping their existing heading keys so both specs stay green:
`filterPanel.location` (states), `filterPanel.schoolProfile` (sectors + school types),
`filterPanel.features` (scholarship / ATAR / ELICOS), plus the fee range control.

Motion: `transition-colors duration-150 ease-out-expo` on background/border/ink,
`active:scale-95`, `motion-reduce:transition-none motion-reduce:active:scale-100`. The check
glyph the current pill shows when selected is kept (it is the non-colour selection cue AA
requires) and fades in with `animate-in fade-in duration-150`.

375px: groups wrap; the 42px drawn height already exceeds the 44px pointer minimum with the
existing `after:` expansion — keep it.

## Files

- `src/modules/design-system/components/choice-pill-group.tsx` (add the `lg` size + the navy
  on-state variant; **do not** change the existing `md`/`sm` output — other screens use them)
- `src/modules/design-system/types/choice.types.ts` (`ChoicePillSize` gains `'lg'`)
- `src/modules/school-search/components/SchoolFilterControls.tsx` (use `size="lg"`)
- `src/modules/school-search/components/SchoolFiltersDialog.tsx` (render the same controls)

## Depends on

- **234** — the dialog is one of the two hosts for these groups.

## Steps

1. Extend `ChoicePillGroup` with `size="lg"` and a `tone="navy"` selected treatment; default tone
   stays the current blue so no other surface changes.
2. Point `SchoolFilterControls` at the new size/tone. Do not touch the store wiring.
3. Render `<SchoolFilterControls />` inside `SchoolFiltersDialog`'s body as well. Because the
   dialog unmounts its content when closed, the controls exist at most twice in the DOM
   (rail + open dialog) and both write the same store — verify no duplicated `aria-pressed`
   ambiguity by scoping every spec locator to its container.
4. Keep the fee-range control (`SchoolFeeRangeFilter`) in both hosts.

## Project rules

`schooltest-web/CLAUDE.md` §0.4 (touch nothing not requested — the `md` pill must render
byte-identically after this change). `.claude/rules/tailwind.md`: no arbitrary values.
`.claude/rules/quality.md`: selection must not be colour-only; 44px targets; `aria-pressed` on
toggles.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: in the rail, the QLD chip's computed height is 42px, `border-radius` 9999px,
  `font-size` 13.5px; pressing it flips `aria-pressed` to `true`, its background resolves to
  `--navy-900` and its ink to `--primary-foreground`; a real `POST /api/search/schools` carrying
  `states:['QLD']` is observed (this is exactly `school-filter-panel.spec.ts` — it must pass
  unmodified).
- The SAME QLD chip inside the open dialog reflects `aria-pressed="true"` without a second
  request (shared store).
- The `md`-size pill on `/dashboard/children` (or any other consumer) is visually unchanged —
  assert its computed height is still the pre-change value.
- Contrast: on-state ink vs fill ≥ 4.5:1 measured by axe; off-state ink ≥ 4.5:1 on `--card`.
- Six catalogs untouched (no new strings) or key-identical if any are added.
- axe clean at 375 + 1280 with the dialog open and closed; reduced-motion kills the transition.

## Assumptions

The design's 1.5px chip border is rendered at 1px unless W0 lands a border-width token; the
deviation is recorded rather than shipped as an arbitrary value, per `.claude/rules/tailwind.md`.

## Evidence

_(filled in as the task runs)_
