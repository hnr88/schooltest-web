---
id: 242
title: Adopt the design's CARTO Light basemap and whole-Australia initial view
layer: frontend
kind: implement
slice: The design's §8.5 Leaflet configuration — tile source, initial centre/zoom, attribution
target: src/modules/school-search/components/SchoolResultsMap.tsx, src/modules/school-search/constants/school-search.constants.ts
contract: n/a (third-party tile source)
design: .qa/design/spec/01-portal-dashboard.md#8.5 · Parent Portal.dc.html:21-22, 787-796
status: TODO
depends_on: ["241"]
---

## Objective

The map renders the design's basemap and opens on the design's whole-Australia framing, so the
surface reads as the design rather than as stock OpenStreetMap.

## Contract

n/a — no app endpoint. Design spec quoted (§8.5, **Leaflet config**):

> - library: Leaflet **1.9.4**
> - `L.map(el, { zoomControl:false, attributionControl:false, scrollWheelZoom:true })`
> - initial view `setView([-28.6, 134.3], 4)` — whole-Australia framing
> - tiles: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`, `maxZoom:19`,
>   `subdomains:'abcd'` (CARTO Light)
> - `map.on('zoomend', refreshMarkers)`; `invalidateSize()` fired 100 ms after mount and 60 ms
>   after each update

## Design source

Constants changed in `src/modules/school-search/constants/school-search.constants.ts`:

| Constant | Today | Design |
|---|---|---|
| `AU_MAP_CENTER` | `[-28, 133]` | `[-28.6, 134.3]` |
| `AU_MAP_ZOOM` | `5` | `4` |
| tile URL | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`, `subdomains="abcd"`, `maxZoom={19}` |

New: `export const MAP_TILE_URL` and `MAP_TILE_SUBDOMAINS` in the constants file (a URL literal
in a component is a config object per `.claude/rules/module-pattern.md`).

**Attribution is NOT dropped.** The design sets `attributionControl:false`; CARTO's and
OpenStreetMap's licences both require attribution, so the existing `attribution` prop is kept and
styled small (`text-[--text-micro]`-equivalent utility `text-micro`, `text-muted-foreground`).
Removing it would be a licence breach, which no design instruction can authorise.

`scrollWheelZoom` stays `false` at the component with the existing `ScrollWheelZoomHandler`
Ctrl-to-zoom affordance (`SchoolSearch.map.ctrlScrollHint`) — the design's `true` traps page
scroll inside the map on a laptop, and the hint + handler are existing accessible behaviour
(D-SCOPE-3: functional wiring is preserved, not discarded).

`minZoom` follows `AU_MAP_ZOOM` (4) so the whole-Australia frame remains the floor;
`AU_MAP_MAX_BOUNDS` is unchanged.

Motion: none of its own. The initial view is applied by `setView` at mount, and
`useMapResultFocus`'s first-focus snap still applies (no tween on first paint).

375px: same tiles; the sheet-mounted map uses the same constants.

## Files

- `src/modules/school-search/constants/school-search.constants.ts`
- `src/modules/school-search/components/SchoolResultsMap.tsx`

## Depends on

- **241** — the panel frame and control placement land first so the tile swap is verified inside
  the final box.

## Steps

1. Add `MAP_TILE_URL`, `MAP_TILE_SUBDOMAINS`, `MAP_TILE_MAX_ZOOM` and update `AU_MAP_CENTER` /
   `AU_MAP_ZOOM`.
2. Point `<TileLayer>` at them, keeping `attribution` and adding CARTO's required credit
   alongside the OSM credit.
3. Re-run `school-map.spec.ts` FIRST: it starts at the AU view and requires ≥1
   `.school-map-cluster` badge before zooming. Zoom 4 is further out than 5, so clustering is at
   least as aggressive — the assertion is safe, but prove it rather than assume it.
4. Re-run `school-search-presentation.spec.ts`, which polls that a `.leaflet-tile` `<img>` has
   `naturalWidth > 0`.

## Project rules

`.claude/rules/module-pattern.md`: config objects in `constants/`.
`.claude/rules/quality.md`: no unattributed third-party assets; no bare `process.env`.
`schooltest-web/CLAUDE.md` §0.4: change nothing else in the map.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: at least one `.leaflet-tile` whose `src` contains `basemaps.cartocdn.com` reports
  `complete === true && naturalWidth > 0` within the existing poll window.
- `map.getZoom()` on first paint is 4 and the centre is within 0.05° of `[-28.6, 134.3]`.
- The attribution control is present and contains both credits.
- `school-map.spec.ts` (all seven scenarios) and `school-search-presentation.spec.ts` pass
  unmodified.
- axe clean at 375 + 1280.

## Assumptions

**Verification-gated:** if CARTO's CDN is not reachable from the test runner (no tile reaches
`naturalWidth > 0` within the poll), the builder KEEPS the OpenStreetMap tile URL, records the
failed request in Evidence, and the task lands with the centre/zoom change only. A basemap that
does not load is worse than one that does not match the design; the fallback decision is written
here so the verifier does not have to invent it.

## Evidence

_(filled in as the task runs)_
