---
id: 240
title: Implement the design's animated map camera — setView below zoom 9, panTo above
layer: frontend
kind: implement
slice: §11.4 — the only real motion in the design, driven by card/pin/cluster selection
target: src/modules/school-search/hooks/use-map-selection-camera.ts (new), src/modules/school-search/lib/map-camera.ts (new)
contract: n/a (client map behaviour)
design: .qa/design/spec/01-portal-dashboard.md#11.4 · .qa/design/screens/portal--main.html:193
status: TODO
depends_on: ["239", "241"]
---

## Objective

Selecting a school moves the Leaflet camera exactly as the design specifies: an animated
`setView(coords, 11)` when the map is zoomed out past the cluster threshold, an animated `panTo`
otherwise. Under `prefers-reduced-motion` the camera snaps.

## Contract

n/a. Design spec quoted (§11.4, the whole table):

| Trigger | Behaviour | Export line |
|---|---|---|
| Click a school card, map zoom `< 9` | `map.setView(coords, 11, { animate: true })` | 843 |
| Click a school card, map zoom `>= 9` | `map.panTo(coords, { animate: true })` | 844 |
| Click a map pin | select school, then `map.panTo(coords, { animate: true })` | 775 |
| Click a city cluster bubble | `map.setView(cityCoords, 11, { animate: true })` | 783 |
| `zoomend` | `refreshMarkers()` — instant swap at the zoom-9 threshold, not a tween | 793 |
| Mount / update | `setTimeout(() => map.invalidateSize(), 100)` on mount, `60` ms on update | 795, 746 |

> Durations/easings are Leaflet 1.9.4 defaults; the export does not override them.

## Design source

Constants to add to `src/modules/school-search/constants/school-search.constants.ts`:

```
export const MAP_SELECTION_ZOOM = 11;          // design: setView(coords, 11)
export const MAP_CLUSTER_ZOOM_THRESHOLD = 9;   // design: cluster below 9, pins at/above
export const MAP_INVALIDATE_MOUNT_MS = 100;    // design :795
export const MAP_INVALIDATE_UPDATE_MS = 60;    // design :746
```

Motion policy: the camera tween is Leaflet's own (`animate: true`), gated by the EXISTING
`prefersReducedMotion()` helper in `src/modules/school-search/lib/school-map-utils.ts` — the same
gate `use-map-result-focus.ts` and `SchoolMapClusterLayer.tsx` already use. Under reduced motion
every call passes `animate: false`. No CSS animation is involved, so there is no
`motion-reduce:` class here; the gate IS the variant.

375px: the desktop map column is collapsed (task 248). The hook must no-op when no map instance
is mounted, and must run when the mobile map sheet mounts one — selecting a card then opening the
sheet lands on the selected school.

## Files

- `src/modules/school-search/lib/map-camera.ts` (**new**, pure: `(currentZoom, target) →
  { kind: 'setView', center, zoom } | { kind: 'panTo', center }`)
- `src/modules/school-search/hooks/use-map-selection-camera.ts` (**new**, applies it to the map)
- `src/modules/school-search/constants/school-search.constants.ts` (the four constants)
- `src/modules/school-search/components/SchoolResultsMap.tsx` (mount the hook)
- `src/modules/school-search/components/SchoolMapMarker.tsx` (pin click → select + panTo)
- `src/modules/school-search/components/SchoolMapClusterLayer.tsx` (cluster click → setView 11)

## Depends on

- **239** — `selectedSchoolId` is this camera's input.
- **241** — the map panel frame owns the map instance handed to the hook.

## Steps

1. Write `map-camera.ts` as a pure decision function so the `< 9 → setView(11)` /
   `>= 9 → panTo` rule is unit-testable without Leaflet.
2. `use-map-selection-camera.ts` subscribes to `selectedSchoolId` (equality selector), resolves
   the hit's `latitude`/`longitude` (skip when either is null — the corpus has 36 null-coord
   rows), and applies the decision with `animate: !prefersReducedMotion()`.
3. Pin click: add a `click` handler to the existing `eventHandlers` memo in `SchoolMapMarker`
   that calls `setSelectedSchoolId(hit.documentId)`. The camera hook then does the panTo — do not
   call `panTo` twice.
4. Cluster click: keep the existing `flyToBounds` spiderfy branch for zoom ≥ the
   de-cluster threshold, and use `setView(clusterCentre, MAP_SELECTION_ZOOM, { animate })` below
   it, matching the design.
5. Keep the existing `useMapResultFocus` result-set framing. Its first-focus snap and its
   `focusedKeyRef` guard prevent it from fighting the selection camera; verify by asserting the
   camera does not bounce (two consecutive `moveend` events with different centres).
6. Apply `invalidateSize` at the design's 100 ms / 60 ms timings inside the panel, not in a
   component body.

## Project rules

`.claude/rules/module-pattern.md`: pure logic in `lib/`, effects in `hooks/`, no logic in
components. `.claude/rules/state-data.md`: selectors only. `.claude/rules/quality.md`: no
`window` access at module top level. `.claude/rules/testing.md`: Playwright is the proof.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright (new `tests/e2e/school-map-camera.spec.ts`): at the default AU view
  (`map.getZoom() < 9`), selecting a card ends with `map.getZoom() === 11` and the map centre
  within 200 m of the hit's `latitude`/`longitude` taken from the intercepted response body
  (read via `page.evaluate` on the Leaflet instance exposed for test, or by comparing the
  selected pin's viewport position to the container centre).
- After that, selecting a SECOND card leaves the zoom at 11 (panTo branch, zoom unchanged) and
  moves the centre.
- Clicking a pin selects its card (`aria-pressed="true"`) and pans.
- Clicking a cluster below the threshold ends at zoom 11.
- With `emulateMedia({ reducedMotion: 'reduce' })` the centre reaches the target within 250 ms
  (snap, not a >1 s tween) — the same technique `school-map.spec.ts:127-143` already uses.
- `school-map.spec.ts` passes unmodified (clusters at zoom 5, de-cluster, 9 pins, hover-sync,
  Map/List toggle, mobile sheet, axe, SSR guard).
- axe clean; zero `any`; no `.leaflet-container` in the SSR HTML.

## Assumptions

Leaflet's default tween duration/easing is used verbatim — the design overrides neither.

## Evidence

_(filled in as the task runs)_
