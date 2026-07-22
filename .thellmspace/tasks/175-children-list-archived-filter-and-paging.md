---
id: 175
title: Keep the archived filter and roster paging working on the card grid
layer: ui
kind: wire
slice: The toolbar above the grid — "Include archived" toggle, the "Showing x-y of n" readout, and the pager that appears once the roster runs past one page.
target: src/modules/children/components/ChildrenToolbar.tsx, src/modules/children/components/ChildrenRosterPager.tsx, src/modules/children/hooks/use-roster-pagination.ts
contract: C-STUDENT-LIST (filters[status][$in], pagination)
design: .qa/design/spec/02-portal-children.md §A.4 (grid) · .qa/design/spec/05-ds-components.md (pagination)
status: TODO
depends_on: ["167", "174"]
---

## Objective

The portal slice has no toolbar and no pager, but both are live behaviour today. Carry them onto the
card grid in the portal idiom so nothing regresses and a parent with many children can still page.

## Contract

`C-STUDENT-LIST` — `GET /api/my/students` with `pagination[pageSize]<=100` and the optional
`filters[status][$in]=active,archived,enrolled` used by `useStudentsQuery({ includeArchived: true })`.
Archived children are returned ONLY with that filter; the default list is active+enrolled. Paging in
the current UI is client-side over the fetched page (`use-roster-pagination.ts`) — keep that exact
behaviour, do not silently switch to server paging in this task.

## Design source

- Toggle: portal pill idiom from §A.3 — `rounded-full`, 13.5px/600 (`text-body-sm font-semibold`),
  inactive `bg-card text-navy-900 border border-portal-border` (`#D8DFEA`), active
  `bg-navy-900 text-white`; hover on the inactive state `border-color:#0E2350` (§B.1's secondary
  button rule). 200ms colour transition, `motion-reduce:transition-none`.
- Readout: 13px `#7C8698` (`text-caption text-portal-muted`), the existing `Children.showing`
  (`Showing {from}-{to} of {total}`).
- Pager: the design-system pagination component from W1, 36px targets, `rounded-full` controls;
  keys `Children.pagerLabel`, `pagerPage`, `pagerPrevious`, `pagerNext`, `pagerGoTo` already exist.

## Files

- `ChildrenToolbar.tsx` — pill toggle + readout, placed between the page header and the grid.
- `ChildrenRosterPager.tsx` — re-dressed; sits after the grid, not inside a panel.
- `use-roster-pagination.ts` — unchanged logic; only its consumers move.

## Depends on

- `167` (grid), `174` (archived cards must render their status pill).

## Steps

1. `Children.includeArchived` stays the toggle's exact accessible name (`dashboard-students.spec.ts`
   clicks `button` by that name, `exact: true`) and becomes `aria-pressed`-bearing.
2. When `includeArchived` is on, archived cards render with the `Children.statusArchived` pill and a
   muted card treatment (`opacity-90`, no hover elevation) so an archived child is visually distinct.
3. The add-child tile stays the last grid child on every page of the grid.
4. Readout numbers come from the pagination hook, never recomputed in JSX.

## Project rules

- `.claude/rules/module-pattern.md` — pagination logic stays in `hooks/`.
- `.claude/rules/quality.md` — the toggle is a real `<button aria-pressed>`, keyboard operable.
- `CLAUDE.md` §0.3 — do not change the query shape.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: toggling `Include archived` issues a request carrying
  `filters[status][$in]` (asserted on the request URL) and the archived child's card appears with
  `Children.statusArchived`; toggling back removes it.
- With more children than one page, the pager renders, page 2 shows the remaining cards, and the
  readout matches `from`/`to`/`total`.
- Motion: toggle colour transition 200ms; page change re-runs the grid entrance (`st-fade-in` 180ms);
  reduced-motion inert.
- 375px: toolbar wraps to two rows, pager controls stay >=44px; no h-scroll. 1280px: single row.
- axe zero serious/critical; `dashboard-students.spec.ts` green.

## Assumptions

Client-side paging remains correct because `pageSize` is 100 and no seeded parent has more children
than that; a server-paging move is out of this wave.

## Evidence

<!-- filled in as the task runs -->
