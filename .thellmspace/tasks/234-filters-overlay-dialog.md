---
id: 234
title: Build the Filters overlay dialog shell with enter/exit motion and a focus trap
layer: ui
kind: implement
slice: The design's §8.6 filters modal — scrim, 560px card, sticky header, close button
target: src/modules/school-search/components/SchoolFiltersDialog.tsx (new)
contract: n/a (presentation over the school-search store)
design: .qa/design/screens/portal--main.html:211-258 · .qa/design/spec/01-portal-dashboard.md#8.6
status: TODO
depends_on: ["232"]
---

## Objective

The "All filters" pill opens the design's modal: navy scrim, a 560px rounded card with a sticky
header and footer, and a scrolling body that will host the filter groups (task 235) and the
footer actions (task 236). It replaces `SearchFilterSheet` for the schools pane at every width.

## Contract

n/a. Design spec quoted (§8.6):

> **Scrim**: `position:fixed; inset:0; background:rgba(14,35,80,.42); z-index:2000; display:grid;
> place-items:center; padding:24px`. Click → `closeFilters`.
> **Dialog**: `background:#FFFFFF; border-radius:24px; width:560px; max-width:100%; max-height:88vh;
> overflow-y:auto; box-shadow:0 28px 56px rgba(0,0,0,.22); display:flex; flex-direction:column`.
> **Header**: sticky. `display:flex; align-items:center; justify-content:space-between;
> padding:22px 28px; border-bottom:1px solid #EEF1F6; position:sticky; top:0; background:#fff;
> border-radius:24px 24px 0 0`. `<h2>` **"Filters"** — `17px; font-weight:600; color:#0E2350`.
> Close button: `34×34; border-radius:999px; background:#F4F6FA; border:none; display:grid;
> place-items:center; color:#0E2350; font-size:15px`, glyph `✕` (U+2715).

## Design source

`.qa/design/screens/portal--main.html:211-218`.

| Element | Design | Implementation |
|---|---|---|
| Scrim | `rgba(14,35,80,.42)` | `bg-navy-900/42` — `--color-navy-900` is exactly `#0E2350` |
| Card | white, r24, 560px, `max-h:88vh`, `overflow-y:auto` | `w-140 max-w-full max-h-[88svh] overflow-y-auto rounded-4xl bg-card` — `--radius-4xl` is `calc(var(--radius) * 2.6)` = 26px; if W0 has landed a 24px `--radius-dialog`, use that instead of a bracket value. `88svh` (not `vh`) so mobile browser chrome cannot clip the footer |
| Shadow | `0 28px 56px rgba(0,0,0,.22)` | `--shadow-xl` (`0 20px 48px oklch(0.2692 0.0871 263.0388 / 18%)`) — pure-black shadows are banned by `CLAUDE.md` §5.12; the navy-tinted xl is the sanctioned equivalent |
| Header | sticky, `22px 28px`, 1px `#EEF1F6` rule | `sticky top-0 flex items-center justify-between border-b border-divider bg-card px-7 py-5.5` (`--color-divider` = `#EEF2F7`) |
| Title | 17 / 600 / `#0E2350` | `text-panel-title font-semibold text-navy-900` (`--text-panel-title` = 1.0625rem = 17px) |
| Close | 34×34, r999, `#F4F6FA` fill | `grid size-8.5 place-items-center rounded-full bg-muted text-navy-900` + `aria-label` from `SchoolSearch.filterPanel.close` |

Motion (D-DESIGN-3 — the design specifies none; §11.5 lists it as a gap):
- scrim: `data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out
  data-[state=closed]:fade-out duration-150`
- card: `data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95
  data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95
  duration-180 ease-out-quart` — this is the DS `st-pop-in` keyframe shape
  (`opacity:0; transform:scale(.96)` → `opacity:1; transform:none`), exit 150 ms.
- both carry `motion-reduce:animate-none`. Only `opacity`/`transform` animate
  (`.claude/rules/tailwind.md`).

375px: `max-w-full` with `p-4` gutter on the scrim (design uses 24px; 16px at phone width so the
card is not squeezed below 343px), body scrolls, header and footer stay pinned.

## Files

- `src/modules/school-search/components/SchoolFiltersDialog.tsx` (**new**, ≤120 lines: shell only)
- `src/modules/school-search/components/SchoolFilterBar.tsx` (wire the trigger)
- `src/modules/school-search/index.ts`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `SchoolSearch.filterPanel.close`

## Depends on

- **232** — the All-filters pill is this dialog's trigger.

## Steps

1. Build on the DS `Dialog`/`DialogTrigger`/`DialogContent`/`DialogTitle` primitives re-exported
   from `@/modules/design-system` (`primitives/surfaces.ts`). **Never** hand-roll the scrim/trap:
   the primitive already gives Escape-to-close, scrim click, focus trap and restore, and
   `aria-modal`.
2. `DialogTitle` renders `SchoolSearch.filterPanel.title` (key already exists and is asserted by
   `unified-search.spec.ts:218-226` through the catalog, so re-copy is safe, key removal is not).
3. Keep `data-slot="school-filter-panel"` OFF this dialog — that slot belongs to the persistent
   desktop rail, which `school-filter-panel.spec.ts:13` and
   `school-search-presentation.spec.ts:59` require to be visible WITHOUT opening anything.
   Give the dialog `data-slot="school-filters-dialog"`.
4. Replace the schools pane's `SearchFilterSheet` usage with this dialog (the agents pane keeps
   the sheet until task 251). `unified-search.spec.ts:218` resolves the surface by
   `getByRole('dialog')`, which the DS Dialog satisfies.
5. Body/footer are slots filled by tasks 235 and 236.

## Project rules

`schooltest-web/CLAUDE.md` §0.11 (wrap shadcn, never edit `src/components/ui/*`).
`.claude/rules/quality.md`: modals trap focus and close on Escape; visible focus; never
`<div onClick>`. `.claude/rules/tailwind.md`: OKLCH only, transform/opacity animation only.
`.claude/rules/module-pattern.md`: ≤120 lines per component.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: clicking All-filters opens `getByRole('dialog')`; `Escape` closes it and focus
  returns to the trigger; clicking the scrim closes it; Tab cycles inside the dialog only
  (assert `document.activeElement` stays within `[data-slot="school-filters-dialog"]` across 12
  Tab presses).
- Computed style of the card: `border-radius` ≥ 24px, `max-height` ≤ 88% of viewport height,
  background resolves to `--card`; the scrim's `background-color` alpha is `0.42`.
- `[data-slot="school-filter-panel"]` is STILL visible at 1280 without opening the dialog
  (`school-filter-panel.spec.ts` + `school-search-presentation.spec.ts` stay green).
- At 375 the dialog fits the viewport with no horizontal page scroll and the header stays pinned
  while the body scrolls.
- Reduced motion: the open transition reports no animation.
- axe clean with the dialog OPEN (dialog name, no aria-hidden focus trap violations).
- Six catalogs key-identical.

## Assumptions

The persistent desktop filter rail is RETAINED alongside this overlay. The design has no rail,
but two passing specs assert it and `.qa/PLAN.md` makes "breaking a passing e2e spec a failure,
not progress". Both surfaces render the same controls component (task 235), so there is one
source of filter truth, not two.

## Evidence

_(filled in as the task runs)_
