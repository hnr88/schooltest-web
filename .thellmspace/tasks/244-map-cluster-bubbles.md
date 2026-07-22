---
id: 244
title: Re-skin the cluster bubbles and move the clustering threshold to zoom 9
layer: ui
kind: implement
slice: The design's §8.5 zoom-<9 cluster bubble
target: src/modules/school-search/lib/school-map-utils.ts, src/modules/school-search/constants/school-search.constants.ts, src/app/globals.css
contract: n/a (presentation of real grouped coordinates)
design: .qa/design/spec/01-portal-dashboard.md#8.5 · §11.4 · Parent Portal.dc.html:757-764
status: TODO
depends_on: ["242"]
---

## Objective

Below zoom 9 the map shows the design's blue count bubbles; at zoom 9 and above it shows
individual pins. The bubble is the design's exact 38px disc with its white ring, and a single-item
group shows the design's graduation-cap glyph instead of the digit "1".

## Contract

n/a. Design spec quoted (§8.5, *Zoom < 9 — city clusters*):

> - bubble: `38×38; border-radius:999px; background:#2563EB; border:3px solid #fff;
>   box-shadow:0 2px 10px rgba(14,35,80,.3); display:grid; place-items:center; color:#fff;
>   font-size:14px; font-weight:700`, `iconSize:[38,38]`, `iconAnchor:[19,19]`
> - content: the count when `> 1`; when exactly `1`, a graduation-cap SVG `15×15`, `stroke:#fff`,
>   `stroke-width:2`
> - click → `setView(cityCoords, 11, {animate:true})`

And §11.4: *"`zoomend` → `refreshMarkers()` — swaps cluster bubbles ↔ individual pins at the
zoom-9 threshold (an instant swap, not a tween)."*

## Design source

| Property | Design | Implementation |
|---|---|---|
| Size | 38×38, `iconAnchor:[19,19]` | `createClusterIcon` returns `iconSize:[38,38]`, `iconAnchor:[19,19]` for every count — the design does NOT scale the bubble with the count, so the current 36/42/48 ladder is dropped |
| Fill | `#2563EB` | `background: var(--primary)` |
| Ring | `3px solid #fff` | `border: 3px solid var(--card)` |
| Shadow | `0 2px 10px rgba(14,35,80,.3)` | `box-shadow: 0 2px 10px oklch(from var(--navy-900) l c h / 0.3)` |
| Type | 14 / 700, white | `font-size: 0.875rem; font-weight: 700; color: var(--primary-foreground)` |
| Count 1 | graduation-cap SVG 15×15, stroke 2 | inline SVG in the DivIcon HTML, `aria-hidden="true"` |
| Threshold | clusters below zoom 9 | `CLUSTER_DISABLE_AT_ZOOM: 15 → 9` |

**Design deviation, recorded:** the design clusters by a fixed three-city list
(`cityDefs`: Sydney / Melbourne / Brisbane). The corpus is 312 real schools across all eight
states with no city dimension in `SchoolHit`, so a fixed city list would be invented data.
Geographic clustering via the already-installed `react-leaflet-cluster` is kept; only the
threshold, the bubble skin and the single-item glyph are ported. This satisfies §11.4's
"cluster bubbles below zoom 9" without fabricating a taxonomy.

Motion: keep the existing `.school-map-cluster__circle` transition
(`transform`/`box-shadow`, `180ms cubic-bezier(0.25, 1, 0.5, 1)`) and its `:hover { scale(1.08) }`.
`MarkerClusterGroup` stays `animate={false}` (the design's swap is instant, and the existing
comment records it as the sanctioned de-jitter). Add/keep a `prefers-reduced-motion` block.

375px: identical inside the mobile map sheet.

## Files

- `src/modules/school-search/lib/school-map-utils.ts` (`createClusterIcon`)
- `src/modules/school-search/constants/school-search.constants.ts` (`CLUSTER_DISABLE_AT_ZOOM`)
- `src/app/globals.css` (`.school-map-cluster*`)

## Depends on

- **242** — the initial zoom (4) and tile source must be settled before the threshold is retuned.

## Steps

1. Set `CLUSTER_DISABLE_AT_ZOOM = 9` and confirm `SchoolMapClusterLayer`'s spiderfy branch
   (`map.getZoom() >= CLUSTER_DISABLE_AT_ZOOM`) still reads correctly at the new value.
2. Rewrite `createClusterIcon` to the fixed 38px geometry with the count-vs-glyph branch.
3. Update the CSS to the design's fill/ring/shadow/type using tokens only.
4. Give the bubble an accessible name: the DivIcon carries `role="img"` +
   `aria-label={SchoolSearch.map.clusterCount}` (ICU plural, six catalogs) so a screen reader is
   not handed a bare number in a div.
5. Re-run `school-map.spec.ts` — scenario 1 requires ≥1 bubble at the initial view and exactly 9
   pins once `declusterViaZoom` clears them.

## Project rules

`.claude/rules/tailwind.md`: OKLCH tokens only in the CSS.
`.claude/rules/i18n.md`: the cluster label is a user-facing string → six catalogs, ICU plural.
`.claude/rules/quality.md`: non-text content needs an accessible name.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: at the initial view ≥1 `.school-map-cluster` exists; its computed size is 38×38,
  `border-radius` 9999px, background resolves to `--primary`, border `3px`.
- Zooming to 9 removes every `.school-map-cluster` and shows 9 `.school-map-marker` for page 1
  (the seeded 12-row page has 3 null-coord umbrella rows) — i.e. `school-map.spec.ts` scenario 1
  passes unmodified with the new threshold.
- A group of exactly one renders the cap glyph and no digit.
- The bubble's accessible name announces the count (`getByRole('img', { name: … })`).
- Six catalogs key-identical.
- axe clean at 375 + 1280; reduced motion disables the hover scale.
- Zero raw hex in the diff.

## Assumptions

Lowering the threshold from 15 to 9 means schools de-cluster earlier. `school-map.spec.ts`'s
`declusterViaZoom` loops until no badge remains (up to 18 clicks), so it converges sooner rather
than failing — proven, not assumed, by running it.

## Evidence

_(filled in as the task runs)_
