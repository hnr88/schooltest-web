---
id: 239
title: Add click-to-select on school cards with the design's selected border and shadow
layer: frontend
kind: implement
slice: The design's §8.4 selection model — `selectSchool(i)` and the selected card treatment
target: src/modules/school-search/stores/use-school-search-store.ts, src/modules/school-search/components/SchoolCard.tsx
contract: n/a (client selection state; no HTTP effect)
design: .qa/design/screens/portal--main.html:175 · .qa/design/spec/01-portal-dashboard.md#8.4
status: TODO
depends_on: ["237"]
---

## Objective

A card can be SELECTED (a persistent choice), distinct from the existing HOVER highlight. The
selected card carries the design's navy border and large shadow, and it is the input the map
camera (task 240) and the map's floating card (task 245) read.

## Contract

n/a — in-memory client state only. It must NOT enter `SchoolSearchFilters` and must NOT reach
`storeToRequest`: a selection that changed the request body would re-page the results and refetch
(the same trap `activeSchoolId` documents in the store today).

Design behaviour quoted (§8.4):

> Click → `selectSchool(i)`; if the map zoom `< 9` it `setView(coords, 11, {animate:true})`,
> otherwise `panTo(coords, {animate:true})` (`Parent Portal.dc.html:842-844`).
> Default `selected: 1` → Riverside College (`:735`).

## Design source

`.qa/design/screens/portal--main.html:175`. Selected vs default treatment is the table in §8.4:

| State | border | box-shadow |
|---|---|---|
| default | `1.5px solid transparent` | `0 1px 2px rgba(14,35,80,.04)` → `border-transparent shadow-sm` |
| selected | `1.5px solid #0E2350` | `0 8px 24px rgba(14,35,80,.12)` → `border-navy-900 shadow-lg` |

Selection precedence: `selected` outranks `hover-active`. A card that is both renders the
selected treatment plus the hover lift.

Motion: `transition-[border-color,box-shadow,transform] duration-200 ease-out-expo` (already on
the card from 237). Selection additionally runs `animate-in` on the map's floating card, owned by
245. `motion-reduce:transition-none`.

The design auto-selects index 1 on load. **Not ported**: auto-selecting an arbitrary result would
move the map camera before the user asked, and the first page is a real, ordered corpus, not the
design's 8-row fixture. Default is `selectedSchoolId: null`.

375px: selection still works (tap), and the design's map-side effects are no-ops while the map
column is collapsed (task 248) — selecting then opening the map sheet flies to the selection.

## Files

- `src/modules/school-search/stores/use-school-search-store.ts` (`selectedSchoolId: string|null`
  + `setSelectedSchoolId`, alongside the existing transient `activeSchoolId`/`isMapOpen`)
- `src/modules/school-search/components/SchoolCard.tsx`

## Depends on

- **237** — the card frame carries the selected treatment.

## Steps

1. Add `selectedSchoolId` + `setSelectedSchoolId` to the store next to the existing transient
   fields, with the same "NOT part of SchoolSearchFilters" comment contract. `setSelectedSchoolId`
   MUST NOT touch `page`.
2. `clearFilters()` and `reset()` clear the selection (a selection pointing at a hit that is no
   longer in the corpus is a lie).
3. The card becomes an interactive element with real semantics: keep the outer `div` for
   `data-slot`/`data-active` (specs address it) and make the card's `h3` title a
   `<button type="button">` (or wrap the clickable region in one) carrying
   `aria-pressed={isSelected}` and the school name as its accessible name. **Never**
   `<div onClick>` (`.claude/rules/quality.md`).
4. Read `isSelected` with a boolean equality selector
   (`useSchoolSearchStore((s) => s.selectedSchoolId === hit.documentId)`) so only the two cards
   whose state flips re-render.
5. Selecting a second card deselects the first; clicking the selected card again keeps it
   selected (the design has no toggle-off).

## Project rules

`.claude/rules/state-data.md`: always use selectors; one store per concern; transient UI state
never joins the query key. `.claude/rules/quality.md`: keyboard reachable, visible focus,
`aria-pressed` on a toggle, never `<div onClick>`. `.claude/rules/module-pattern.md`: ≤120 lines.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: clicking the second card sets `aria-pressed="true"` on it and `false` on the first;
  its computed `border-color` resolves to `--navy-900` and its `box-shadow` matches `--shadow-lg`.
- Selecting a card fires **zero** `POST /api/search/schools` (request counter before/after) —
  proves the selection stayed out of the query key.
- The selection is reachable and togglable by keyboard (Tab to the card, Enter selects).
- Hover-sync still works: `school-map.spec.ts` scenario 3 passes unmodified, and a card can be
  simultaneously `data-active="true"` and `aria-pressed="true"`.
- Applying a filter that removes the selected school clears the selection (no stale card).
- axe clean at 375 + 1280; reduced-motion removes the transition.
- Zero raw hex / arbitrary values / `any`.

## Assumptions

The design's default selection (`selected: 1`) is deliberately not ported; recorded above with
its reason.

## Evidence

_(filled in as the task runs)_
