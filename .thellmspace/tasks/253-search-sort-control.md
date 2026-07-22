---
id: 253
title: Re-skin the sort control as the design's dropdown chip and keep both panes on one component
layer: ui
kind: implement
slice: The sort affordance in the results panel header, for schools and agents
target: src/modules/search-shared/components/SearchSortMenu.tsx, src/modules/search-shared/lib/chip-variants.ts
contract: C-SEARCH-SCHOOLS (sortBy enum), C-SEARCH-AGENTS (sortBy enum)
design: .qa/design/spec/05-ds-components.md (dropdown chip) · .qa/design/spec/01-portal-dashboard.md#8.2 (chip geometry)
status: TODO
depends_on: ["231"]
---

## Objective

Sorting keeps its one shared control, redrawn as the design's pill that carries its current value
and opens a radio menu — matching the filter bar's chip vocabulary so the toolbar reads as one
row of objects.

## Contract

Sort values are server enums and may not be extended:

- schools — `relevance | name-asc | name-desc | fee-asc | fee-desc` (default `relevance`
  server-side; the app's `DEFAULT_SORT_BY` is `name-asc` and `storeToRequest` omits it when it
  equals the default). `.qa/intake/api-inventory.md` §10.
- agents — `relevance | experience | name_asc | name_desc | recently_verified`.
  `.qa/intake/api-inventory.md` §11.

An unknown `sortBy` is a `400 "invalid search payload"` — the menu must only ever emit values
from `SORT_OPTIONS`.

## Design source

The Find-a-school design has no sort control; the chip vocabulary it does define (§8.2) supplies
the geometry, and `.qa/design/spec/05-ds-components.md`'s dropdown chip supplies the shape.

| Property | Value |
|---|---|
| Trigger | `inline-flex items-center gap-1.75 rounded-full border border-input bg-card px-4 py-2.25 text-meta font-medium text-body` |
| Active (non-default value) | `border-navy-900 bg-navy-900 text-primary-foreground font-semibold` — the design's on-chip state |
| Label | `{Sort}: {current}` using the existing `SchoolSearch.sort.label` / `AgentSearch.sort.label` |
| Chevron | lucide `ChevronDown` `size-4`, `group-data-popup-open:rotate-180` |
| Menu | DS `DropdownMenuContent align="end"`, `--radius-lg` box, `--shadow-lg`, radio items with the existing `sortOptions.*` labels |

Motion: chevron `transition-transform duration-200 ease-out-expo` (already present — keep it);
trigger `transition-colors duration-150 ease-out-expo`; menu enters with the DS popup's
`animate-in fade-in zoom-in-95 duration-150` and exits at 100 ms. All with `motion-reduce:`
variants.

375px: the chip sits in the wrapped actions cluster next to Filters and Show-map; its pointer box
is ≥44px via the `after:` expansion; the menu opens `align="end"` and never overflows the
viewport (`collision padding` from the DS primitive).

## Files

- `src/modules/search-shared/components/SearchSortMenu.tsx`
- `src/modules/search-shared/lib/chip-variants.ts` (align the shared chip variant with the
  design's on/off pair so the filter chips, the map toggle and the sort chip are one object)
- `src/modules/school-search/components/SchoolSortMenu.tsx` / `agent-search/AgentSortMenu.tsx`
  (bindings only — no behaviour change)

## Depends on

- **231** — the results-panel header band the control sits in.

## Steps

1. Retune `chipVariants` to the design's on/off values; audit every consumer
   (`MapToggle`, `MobileMapSheet`, `SearchFilterSheet`, `SearchSortMenu`) so none of them changes
   behaviour, only skin.
2. Apply the trigger/menu treatment in `SearchSortMenu`.
3. Leave the option lists and the store bindings alone — `SORT_OPTIONS`,
   `SORT_OPTION_LABEL_KEYS` and both `setSort` actions are unchanged.
4. Re-run `unified-search-states.spec.ts` (agents `name_desc` sort) and
   `agent-search-polish.spec.ts` (sort label regex).

## Project rules

`schooltest-web/CLAUDE.md` §0.11 (wrap the shadcn dropdown, never edit it).
`.claude/rules/tailwind.md`: no arbitrary values; transform/opacity animation.
`.claude/rules/quality.md`: the trigger has an accessible name including the current value; menu
items are `menuitemradio` with `aria-checked`; Escape closes; focus returns to the trigger.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: the sort trigger's accessible name contains
  `cat(en,'SchoolSearch.sort.label')` and the current option label; opening it exposes five
  `menuitemradio` items; choosing "Tuition: low to high" fires one
  `POST /api/search/schools` with `sortBy:'fee-asc'` and the first card's `h3` changes.
- Choosing the default option again produces a body with **no** `sortBy` key (the
  `storeToRequest` omission rule still holds).
- The trigger's computed background resolves to `--navy-900` while a non-default sort is active
  and to `--card` at the default.
- Escape closes the menu and focus returns to the trigger; the chip's pointer box is ≥44×44 at
  375.
- `unified-search-states.spec.ts` and `agent-search-polish.spec.ts` pass unmodified.
- axe clean at 375 + 1280 with the menu open; reduced motion stops the chevron rotation.
- Zero raw hex / arbitrary values in the diff.

## Assumptions

The schools default stays `name-asc` (the app's existing `DEFAULT_SORT_BY`), not the server's
`relevance`: changing it would reorder every result set and break the deterministic page-1
ordering three specs rely on.

## Evidence

_(filled in as the task runs)_
