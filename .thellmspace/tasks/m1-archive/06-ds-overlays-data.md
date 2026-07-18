---
id: 06
title: design-system module — overlays & data (SegmentedControl + overlay/data re-exports)
layer: ui
kind: build
slice: SegmentedControl composite + Dialog/DropdownMenu/Tooltip/Popover/Tabs/Table/Pagination/Breadcrumb/Separator/Accordion re-exports
target: src/modules/design-system/{components/segmented-control.tsx,index.ts}
contract: C-DS
status: DONE
depends_on: [01]
---
## Objective
Finish the design-system barrel: `SegmentedControl` (client, on ui/toggle-group) and
re-export the overlay + data-display primitive families.

## Contract (C-DS)
- SegmentedControl: 'use client'; wraps ui ToggleGroup (type single) — read
  ui/toggle-group.tsx first. Track: inline-flex rounded-xl bg-muted p-1; item: rounded-lg
  px-3.5 py-1.5 text-sm font-medium text-muted-foreground; active (data-state=on):
  bg-background text-foreground shadow-sm. Props: options {value,label}[], value,
  onValueChange (string), ariaLabel (aria-label on the group). Guard: ignore empty value
  changes (toggle-group fires '' on re-click → keep current).
- Re-exports (READ each ui file, mirror EXACT named exports):
  - ui/dialog → Dialog family
  - ui/dropdown-menu → DropdownMenu family
  - ui/tooltip → Tooltip, TooltipContent, TooltipTrigger (Provider already global)
  - ui/popover → Popover family
  - ui/tabs → Tabs family
  - ui/table → Table family
  - ui/pagination → Pagination family
  - ui/breadcrumb → Breadcrumb family
  - ui/separator → Separator
  - ui/accordion → Accordion family (needed by landing FAQ)

## Files
- CREATE src/modules/design-system/components/segmented-control.tsx
- EDIT src/modules/design-system/index.ts (grouped: // overlays, // data display)

## Steps
1. Read the 10 ui files for exact exports. 2. Implement SegmentedControl. 3. Barrel.
4. tsc+lint zero errors.

## Project rules
module-pattern, imports.md, law 11; client leaf only for SegmentedControl ('use client'
line 1).

## Done criteria
- SegmentedControl typed + switches value via onValueChange; all families re-exported with
  exact names; barrel compiles; tsc+lint zero errors; no ui/* modifications.
## Assumptions
- ToggleGroup single-selection API of the installed base-nova version applies; if its props
  differ, adapt to the actual ui file (read it) and note the deviation in Evidence.
## Evidence
PASS (independent verifier, 2026-07-17): all 10 overlay/data families re-exported verbatim; SegmentedControl Base-UI mapping proven against library source; tw-merge active-style override empirically tested; tsc 0, lint 0 errors; no ui/* edits.
(filled by builder/verifier)
