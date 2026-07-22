---
id: 245
title: Add the floating selected-school card to the map panel
layer: frontend
kind: implement
slice: The design's §8.5 bottom-left map card — identity tile, name, meta, action
target: src/modules/school-search/components/MapSelectedSchoolCard.tsx (new)
contract: C-SEARCH-SCHOOLS (fields), G22 (no school detail read)
design: .qa/design/screens/portal--main.html:195-202 · .qa/design/spec/01-portal-dashboard.md#8.5
status: TODO
depends_on: ["239", "246"]
---

## Objective

When a school is selected, the map panel shows the design's floating card at bottom-left with the
school's identity, name and location. It is the visible confirmation that the camera moved to the
right place.

## Contract

Fields come from the already-fetched `SchoolHit` for `selectedSchoolId` — no request.
**G22** (`.qa/intake/api-inventory.md`): *"No school/agent detail read … A 'school detail' page
can only re-run a search and filter client-side"*. There is therefore no detail route to link to,
and the design's `View →` action (which binds no handler in the export either) is not shipped as
a dead link.

## Design source

`.qa/design/screens/portal--main.html:195-202`:

```
position:absolute; left:20px; bottom:20px; background:#FFFFFF; border-radius:16px;
box-shadow:0 8px 24px rgba(14,35,80,.14); padding:14px 18px; display:flex;
align-items:center; gap:14px; max-width:340px; z-index:900
```
- rating tile: `40×40; border-radius:12px; background:#0E2350; color:#fff; display:grid;
  place-items:center; flex:none; font-weight:700; font-size:13px`
- name `14px / 600 / #0E2350`
- meta `12.5px / #7C8698; margin-top:1px`
- action **"View →"** `13px / 600 / #2563EB` — no handler bound

| Element | Design | Implementation |
|---|---|---|
| Card | `left:20px; bottom:20px`, r16, `14px 18px`, `max-width:340px`, `0 8px 24px rgba(14,35,80,.14)` | `absolute bottom-5 left-5 z-20 flex max-w-85 items-center gap-3.5 rounded-panel bg-card px-4.5 py-3.5 shadow-lg` (`--radius-panel` = 1rem = 16px; `--shadow-lg` = `0 8px 24px navy/12%`) |
| Identity tile | 40×40, r12, navy, white 13/700 | `grid size-10 shrink-0 place-items-center rounded-xl bg-navy-900 text-meta font-bold text-primary-foreground` — content is the school's initials via the existing DS `getInitials` helper, **not** a rating (task 246) |
| Name | 14 / 600 / navy | `truncate text-body-sm font-semibold text-navy-900` |
| Meta | 12.5 / `#7C8698`, `mt:1px` | `mt-px truncate text-meta text-muted-foreground` — content is `getSchoolLocation(suburb, state)`, the existing helper |
| Action | `View →` 13/600 `#2563EB` | replaced by a real control: **"Centre on map"** (`SchoolSearch.map.recentre`), which re-runs the task-240 camera decision. A dead link is not "only add design that is functional" (D-SCOPE-1) |

Motion: enters with `animate-in fade-in slide-in-from-bottom-2 duration-200 ease-out-expo`, exits
with `animate-out fade-out slide-out-to-bottom-2 duration-150` (the DS `st-toast-in` shape:
`translateY(12px)` + opacity). `motion-reduce:animate-none` on both.

375px: inside the mobile map sheet the card spans `inset-x-4 bottom-4` (full width minus gutter)
so it never collides with the zoom stack at `right-4 top-4`.

## Files

- `src/modules/school-search/components/MapSelectedSchoolCard.tsx` (**new**, ≤120 lines)
- `src/modules/school-search/components/SchoolResultsMap.tsx` (mount it)
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `SchoolSearch.map.recentre`,
  `SchoolSearch.map.selectedLabel`

## Depends on

- **239** — the selection this card renders.
- **246** — the rating substitution it consumes.

## Steps

1. Read `selectedSchoolId` with a selector and resolve the hit from the query data already in the
   cache (pass `hits` down from the panel — the map leaf already receives them).
2. Render nothing when nothing is selected (no empty placeholder card).
3. The wrapper is `role="status" aria-live="polite"` with `SchoolSearch.map.selectedLabel` so the
   selection is announced once, not on every camera move.
4. The "Centre on map" control is a real `<button>` calling the task-240 camera hook's imperative
   entry point.
5. Add both keys to all six catalogs.

## Project rules

`.claude/rules/module-pattern.md`: component ≤120 lines, no logic; helpers already exist in
`lib/school-card.helpers.ts` and `design-system` (`getInitials`).
`.claude/rules/i18n.md`: six catalogs. `.claude/rules/quality.md`: never `<div onClick>`; live
region politeness; 4.5:1 contrast on the navy tile (white on `--navy-900` is 15.27:1).

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: with nothing selected the card is absent; selecting a card renders it with the name
  and `suburb, state` taken from the intercepted response body for that `documentId`.
- The identity tile shows the initials of that name and contains no digit-only rating.
- "Centre on map" moves the map centre (compare `getCenter()` before/after a manual drag).
- The card sits inside the map panel's bottom-left quadrant and does not overlap the zoom stack
  (bounding-box intersection is empty) at 1280 and inside the 375 sheet.
- `school-map.spec.ts` and `school-search-presentation.spec.ts` pass unmodified.
- axe clean with a selection active at both widths; reduced motion removes the enter animation.
- Six catalogs key-identical; zero raw hex / arbitrary values.

## Assumptions

The design's `View →` has no handler in the export; it is replaced by a working control rather
than shipped dead or linked to a route that G22 says cannot exist.

## Evidence

_(filled in as the task runs)_
