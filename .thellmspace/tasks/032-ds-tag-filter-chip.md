---
id: 032
title: Rebuild the removable Tag and the filter chips (active, removable, dashed "Add filter")
layer: ui
kind: implement
slice: Tag + FilterChip + AddFilterChip
target: src/modules/design-system/components/tag.tsx, src/modules/design-system/components/filter-chip-group.tsx, src/modules/design-system/types/data-display.types.ts, src/modules/design-system/components/showcase/tag-demo.tsx, tests/e2e/ds-filter-chip.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--badges.html, .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/04-ds-foundations.md#6.4, .qa/design/spec/05-ds-components.md#6.1b,#6.1c
status: TODO
depends_on: [001, 002, 006, 007, 010, 011, 021, 030]
---

## Objective

The chips that carry applied filters on the dashboard (W5) and both search surfaces (W8). Three
shapes, one component family. `Tag` and `FilterChipGroup` already exist and are re-cut here.

## Contract

n/a. Verbatim:

**Removable tag** `[BDG:20]`: `display:inline-flex; align-items:center; gap:6px;
font-size:12.5px; font-weight:600; color:#16326E; background:#EFF5FF;
padding:4px 6px 4px 11px; border-radius:999px` — the **asymmetric padding** (right inset 6px)
seats the ✕. Icon `<svg width=12 height=12 stroke=#64748B stroke-width=2.4 stroke-linecap=round>`
paths `M18 6 6 18` + `m6 6 12 12`. Example label `Grade 7`.

**Active filter chip** (`ds--dashboard-components.html:10-11`): `display:inline-flex;
align-items:center; gap:6px; font-size:12.5px; font-weight:600; color:#FFFFFF; background:#2563EB;
padding:6px 6px 6px 13px; border-radius:999px`; trailing 12×12 ✕ `stroke:currentColor;
stroke-width:2.4`. Labels `Grade 7`, `Live` — sourced from the applied filter set.

**Add-filter chip** (`:12`): `display:inline-flex; align-items:center; gap:6px;
background:#FFFFFF; color:#16326E; border:1px dashed #CBD5E1; font-size:12.5px; font-weight:600;
padding:6px 13px; border-radius:999px; cursor:pointer`; hover `background:#F7F9FC`; leading 12×12
plus at `stroke-width:2.4`. Label `Add filter`.

## Design source

Tokens: `#16326E` `text-secondary-foreground` · `#EFF5FF` `bg-secondary` · `#64748B`
`text-muted-foreground` · `#2563EB` `bg-primary` · `#FFFFFF` `text-primary-foreground` /
`bg-card` · `#CBD5E1` `border-input` (dashed) · `#F7F9FC` `bg-background`.
Type `--font-size-caption` (12.5px); radius `--radius-full`.

Motion: the ✕ button gets `transition-[background-color,color] duration-150 ease-out-quart`
(the export declares none — D-DESIGN-3 requires it); a chip removed from the group leaves with
`animate-out fade-out-0 zoom-out-95 duration-150` and a new chip enters with `st-pop-in`
(`--animate-pop-in`, 180ms). Reduced-motion from W0.

## Files

- `src/modules/design-system/components/tag.tsx` — `Tag` with `onRemove?`.
- `src/modules/design-system/components/filter-chip-group.tsx` — re-cut: `FilterChipGroup`
  renders active chips + the dashed add-chip trigger; keep its current props so
  `src/modules/school-search` / `agent-search` keep compiling.
- `types/data-display.types.ts` — `TagProps`, `FilterChipOption`, `FilterChipGroupProps`.
- showcase `tag-demo.tsx`, `tests/e2e/ds-filter-chip.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **002** — the hover / disabled interaction colour roles taken from the design's `style-hover`.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

Within W1:

- **030** — the badge base.
- **021** — the 26px dismiss-button geometry for the ✕.

## Steps

1. The ✕ is a **real `<button>`** with `aria-label` = `t('tagRemove', { label })` (that key already
   exists in the catalogs) — never a clickable span.
2. Asymmetric padding via logical properties (`ps-*` / `pe-*`), not `pr-[6px]`.
3. Group renders `role="list"` + `role="listitem"` only if it is genuinely a list; otherwise leave
   it a plain flex row — do not add fake landmarks.
4. Exit animation requires the removed node to stay mounted for 150ms; implement with the
   `tw-animate-css` `data-[closed]` pattern used by the overlay primitives, not a `setTimeout`.
5. i18n `DesignSystem.filterAdd`, reuse `tagGrade` / `tagRemove`; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 3 (school-search / agent-search consume `FilterChipGroup` — read them first),
  law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (animate opacity/transform only;
  no arbitrary padding); `.claude/rules/quality.md` (never `<div onClick>`; the ✕ must be keyboard
  reachable and ≥44px effective target); `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-filter-chip.spec.ts` asserts on `/design-system`:
  - `getByRole('button', { name: /Remove tag Grade 7/ })` exists and removing it drops the chip
    from the DOM;
  - the active chip's `background-color` = resolved `--color-primary` and its `padding-inline-end`
    is 6px vs `padding-inline-start` 13px;
  - the add-chip has `border-style: dashed` and changes background on hover over 150ms;
  - `Tab` reaches every ✕ and `Enter` removes.
- Motion: removal plays a non-`none` `animation-name`; `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: chips wrap onto multiple rows; hit targets ≥44px; no horizontal overflow.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `school-filter-panel.spec.ts` and `agent-search-polish.spec.ts` still green.

## Assumptions

- `FilterChipGroup`'s existing prop shape is preserved; only its rendering changes. If a prop must
  change, the consuming module's call sites are updated in the same commit.

## Evidence
