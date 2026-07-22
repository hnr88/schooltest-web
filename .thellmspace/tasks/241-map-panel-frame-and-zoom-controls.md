---
id: 241
title: Re-skin the map panel frame and move the zoom controls to the design's top-right stack
layer: ui
kind: implement
slice: The design's §8.5 map panel box and its +/− control stack
target: src/modules/school-search/components/MapZoomControls.tsx, src/modules/school-search/components/SchoolsPane.tsx
contract: n/a (presentation over the existing Leaflet mount)
design: .qa/design/screens/portal--main.html:193-206 · .qa/design/spec/01-portal-dashboard.md#8.5
status: TODO
depends_on: []
---

## Objective

The map sits in the design's panel — 24px radius, white, subtle shadow, 420px minimum height,
with the pre-tile placeholder fill — and its zoom controls become the design's 40×40 rounded
squares stacked at the top right.

## Contract

n/a. Design spec quoted (§8.5):

> Panel: `background:#FFFFFF; border-radius:24px; box-shadow:0 1px 2px rgba(14,35,80,.04);
> position:relative; overflow:hidden; min-height:420px`.
> Map mount: `position:absolute; inset:0; background:#F4F6FA` — the placeholder colour visible
> before tiles load.
> **Zoom controls**: `position:absolute; right:20px; top:20px; display:flex;
> flex-direction:column; gap:8px; z-index:900`. Each button: `40×40; border-radius:12px;
> background:#FFFFFF; border:none; box-shadow:0 2px 10px rgba(14,35,80,.12); font-size:18px;
> font-weight:500; color:#0E2350`. Glyphs `+` and `−` (U+2212). Handlers `zoomIn`/`zoomOut`.

## Design source

`.qa/design/screens/portal--main.html:193-206`.

| Element | Design | Implementation |
|---|---|---|
| Panel | white, r24, `0 1px 2px rgba(14,35,80,.04)`, `overflow:hidden`, `min-height:420px` | the DS `MapPanelFrame` with `className="min-h-105 rounded-4xl"` — it already provides `overflow-hidden`, `bg-card`, `shadow-sm`, `role="region"` and the required accessible name (`SchoolSearch.map.region`) |
| Mount fill | `#F4F6FA` | `bg-muted` (`--color-muted` `#F1F5F9`) on the map container so the pre-tile state is a tinted surface, never white and never `#fff`/`#000` |
| Control stack | `right:20px; top:20px`, column, gap 8, `z-index:900` | `absolute right-5 top-5 z-20 flex flex-col gap-2` — z-20 sits above Leaflet's 400-800 panes and below the DS overlay layer; 900 would sit above the app's dialogs |
| Button | 40×40, r12, white, `0 2px 10px rgba(14,35,80,.12)`, 18/500, `#0E2350` | `size-10 rounded-xl bg-card text-navy-900 shadow-md` (`--shadow-md` = `0 2px 8px oklch(0.2692 0.0871 263.0388 / 8%)`) |
| Glyphs | `+` and `−` (U+2212) | keep the current lucide `Plus`/`Minus` at `size-4` — an icon with an `aria-label` beats a bare glyph, and the labels are already asserted |

The existing `reset` control (`SchoolSearch.map.reset`) is KEPT and joins the same stack; the
design has no reset, but `school-map.ts`'s helpers and the map spec use `zoomIn` by name and the
reset is real, working behaviour that D-SCOPE-3 forbids discarding.

Motion: `transition-[background-color,box-shadow,transform] duration-150 ease-out-expo`,
`hover:-translate-y-0.5`, `active:scale-95`, `focus-visible:ring-2 focus-visible:ring-ring`, all
with `motion-reduce:` variants (the current component already has this shape — preserve it).

375px: the desktop panel is hidden (task 248); inside the mobile map sheet the same stack renders
at `right-4 top-4` so it clears the sheet's grab area.

## Files

- `src/modules/school-search/components/MapZoomControls.tsx`
- `src/modules/school-search/components/SchoolsPane.tsx` (panel classes)
- `src/modules/school-search/components/SchoolResultsMap.tsx` (mount fill)

## Depends on

Nothing inside W8.

## Steps

1. Move the control stack from `bottom-6 left-6` to the design's `right-5 top-5`; keep all three
   buttons, their `aria-label`s and their catalog keys (`map.zoomIn`, `map.zoomOut`, `map.reset`)
   — `school-map.ts:49` resolves the `+` control by `map.zoomIn`.
2. Apply the panel radius/min-height through `MapPanelFrame`'s `className`; do not fork the DS
   component.
3. Set the pre-tile fill on the Leaflet container wrapper.
4. Confirm the controls stay above the tiles and below the filters dialog by opening the dialog
   with the map visible.

## Project rules

`schooltest-web/CLAUDE.md` §0.11 (wrap, never edit `src/components/ui/*`).
`.claude/rules/tailwind.md`: OKLCH only, no arbitrary values, animate transform/opacity.
`.claude/rules/quality.md`: labelled controls, 44px pointer target (40px drawn + `after:`
expansion), visible focus.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: the zoom-in button's bounding box is in the map panel's top-right quadrant
  (`box.x > panel.x + panel.width/2 && box.y < panel.y + panel.height/2`), its computed size is
  40×40 and `border-radius` 12px.
- The panel's computed `border-radius` is ≥ 24px and its `min-height` ≥ 420px at 1280.
- Clicking zoom-in still de-clusters (`school-map.spec.ts` scenario 1 passes unmodified, using
  the same `map.zoomIn` accessible name).
- Opening the filters dialog covers the zoom stack (z-order proof:
  `elementFromPoint` over the button returns the dialog scrim).
- Pointer target ≥44px; keyboard reachable; axe clean at 375 + 1280.
- Reduced motion: no transition on hover.
- Zero raw hex / arbitrary values in the diff.

## Assumptions

The design's `z-index:900` is replaced by a value inside the app's existing layer scale so the
map controls cannot paint over modals; recorded here rather than ported blindly.

## Evidence

_(filled in as the task runs)_
