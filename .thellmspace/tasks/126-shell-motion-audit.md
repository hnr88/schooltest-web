---
id: 126
title: Shell motion — one audited set of transitions from the design system's six keyframes, each with a reduced-motion variant
layer: ui
kind: verify
slice: Every animation and transition in the app shell, and its prefers-reduced-motion counterpart
target: src/modules/shell/components/*.tsx, src/app/[locale]/dashboard/layout.tsx, tests/e2e/shell.spec.ts
contract: n/a — motion is authored under D-DESIGN-3; the design has none
design: .qa/design/spec/01-portal-dashboard.md#11-animations, .qa/design/spec/04-ds-foundations.md#02-keyframes--the-complete-animation-inventory-src1924, .qa/design/spec/04-ds-foundations.md#i-motion--animate----ease-
status: TODO
depends_on: ["115", "122", "124"]
---

## Objective

Audit the whole re-skinned shell's motion as one system: exactly one duration/easing vocabulary,
only the design system's six keyframes, only `transform`/`opacity` (plus the two documented colour
exceptions), and a `prefers-reduced-motion` variant on **every** one of them — proven by reading
computed styles in both media states.

## Contract

n/a. The design's own finding, `01-portal-dashboard.md` §11.1-11.2, verbatim:

> **None.** `grep "transition:"` returns zero hits in `portal--main.html`,
> `portal--detached-sidebar.html` and `app--parent-overview.html`. … **None.** `grep "@keyframes"`
> returns zero hits in `Parent Portal.dc.html`.

and §11.5: "Nothing in these files specifies: view-change transitions …, card hover lift, …, focus
rings, or `prefers-reduced-motion` handling."

`.qa/DECISIONS.md` **D-DESIGN-3** makes motion part of done and fixes the palette: the six
keyframes `st-fade-in`, `st-pop-in`, `st-toast-in`, `st-spin`, `st-shimmer`, `st-rec-pulse` plus
Tailwind transitions, no new dependency, always a reduced-motion variant.

## Design source

The shell's complete authored motion inventory — this table IS the deliverable:

| # | Element | Property | Duration | Easing | Reduced-motion | Owner |
|---|---|---|---|---|---|---|
| 1 | sidebar card mount | `st-fade-in` (opacity) | 180ms | `--ease-out-quart` | `motion-reduce:animate-none` | 111 |
| 2 | top row mount | `st-fade-in` | 180ms | `--ease-out-quart` | `motion-reduce:animate-none` | 118 |
| 3 | nav item idle↔hover | `background-color`, `color` | 200ms | `--ease-out-expo` | `motion-reduce:transition-none` | 114 |
| 4 | nav item idle↔active | same | 200ms | `--ease-out-expo` | same | 115 |
| 5 | rail collapse/expand | `width` (vendored) | 200ms | `ease-linear` | `motion-reduce:transition-none` | 124 |
| 6 | user card hover | `background-color` | 200ms | `--ease-out-expo` | same | 117 |
| 7 | user-menu chevron | `transform: rotate` | 200ms | `--ease-out-expo` | same | 117 |
| 8 | user menu open | `st-pop-in` (opacity+scale) | 180ms | `--ease-out-quart` | `motion-reduce:animate-none` | 117 |
| 9 | search pill hover | `box-shadow` | 200ms | `--ease-out-expo` | same | 120 |
| 10 | bell hover | `box-shadow` | 200ms | `--ease-out-expo` | same | 121 |
| 11 | unread badge appear | `st-pop-in` | 180ms | `--ease-out-quart` | `motion-reduce:animate-none` | 121 |
| 12 | mobile Sheet enter/exit | vendored slide+fade | ~200ms | vendored | must compute `none` under reduce | 122 |
| 13 | breadcrumb link hover | `color` | 200ms | `--ease-out-expo` | same | 119 |
| 14 | logo hover | `opacity` | 200ms | `--ease-out-expo` | same | 112 |

Rules this audit enforces (`.claude/rules/tailwind.md:19-20` + mapping §I):
- **Animate `transform` and `opacity` only.** Rows 3/4/6/9/10/13 are `background-color`/`color`/
  `box-shadow` — the mapping's documented exception (§I notes 1-2). No other property may appear.
  **Fail the audit on any `width`, `height`, `margin`, `padding`, `top`, `left` transition** except
  row 5, which is the vendored primitive's and is named here so it is not mistaken for ours.
- **Exponential easings only** — `--ease-out-quart` `cubic-bezier(0.25,1,0.5,1)`,
  `--ease-out-expo` `cubic-bezier(0.16,1,0.3,1)`. No `ease`, no `ease-in-out`, no `linear` (except
  row 5, vendored).
- **No new dependency.** `tw-animate-css` is already imported at `src/app/globals.css:2`.

## Files

- `src/modules/shell/components/*.tsx` + `src/app/[locale]/dashboard/layout.tsx` — align any row
  that deviates from the table (most were set by their own task; this pass makes them consistent).
- `src/app/globals.css` — only if a keyframe from the six is missing (W0 owns them; do not
  duplicate an existing one).
- `tests/e2e/shell.spec.ts` — one motion test that walks the table.

## Depends on

- **115, 122, 124** — the last three surfaces that own motion must be final before the inventory
  can be closed.

## Steps

1. Grep the shell for every motion class: `rg -n "transition|animate-|duration-|ease-" src/modules/shell src/app/\[locale\]/dashboard`.
2. Reconcile the output against the table; fix deviations (wrong duration, missing
   `motion-reduce:`, a non-exponential easing, a layout property).
3. Confirm each of the six keyframes used exists once in `globals.css` and is referenced by name,
   not re-declared locally.
4. `pnpm tsc --noEmit && pnpm lint`.
5. Write the motion test: for each row, read the computed `transitionProperty`/`transitionDuration`
   or `animationName`/`animationDuration` in the default media, then re-read under
   `page.emulateMedia({ reducedMotion: 'reduce' })` and assert `0s` / `none`.

## Project rules

- `.claude/rules/tailwind.md` — transform/opacity only; exponential easings; no arbitrary values.
- `.qa/DECISIONS.md` D-DESIGN-3 — motion is part of done, built from the six keyframes, always with
  a reduced-motion variant, never a new dependency.
- `CLAUDE.md` §0 law 11 — the Sheet's and the rail's own transitions are vendored: audit them,
  document them, never edit them.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- A single Playwright test asserts all 14 rows in BOTH media states against the running app, and
  its output (property, duration, easing, reduced value) is pasted into Evidence as the audit record.
- A grep leg proves no shell element transitions a layout property:
  `transitionProperty` on every element under `[data-slot="sidebar"]`, `header`, and
  `[data-slot="topbar-actions"]` contains none of `width|height|margin|padding|top|left`
  (documented exception: the vendored `sidebar-gap`/`sidebar-container` `width`).
- `rg -n "ease-in-out|ease-linear|transition-all" src/modules/shell` returns zero hits (except the
  named vendored case, which lives in `ui/`).
- The existing `shell.spec.ts` motion leg (`background-color`, `0.2s` on the active nav item) still
  passes untouched.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts` green.
- 375 + 1280 both audited (rows 12 and 5 are viewport-specific).
- axe serious/critical = 0 (motion does not affect axe, but the run is the regression gate).
- No new strings → six catalogs unchanged.

## Assumptions

- `--ease-out-quart` is emitted by W0 (mapping §I). If it is not yet present, use the existing
  `--ease-out-expo` for every row and record the substitution — do not add a bespoke easing token
  from this wave.

## Evidence

_(filled in as the task runs: the full 14-row computed-style audit, in both media states)_
