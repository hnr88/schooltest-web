---
id: 243
title: Re-skin the map pins to the design's label pill and stem, with a selected variant
layer: ui
kind: implement
slice: The design's §8.5 individual pin — pill + stem, selected vs unselected
target: src/modules/school-search/lib/school-map-utils.ts, src/app/globals.css
contract: n/a (presentation of real coordinates)
design: .qa/design/spec/01-portal-dashboard.md#8.5 · Parent Portal.dc.html:749-756
status: TODO
depends_on: ["239"]
---

## Objective

Individual markers stop being round medallions and become the design's label pill with a stem.
The selected school's pin is the navy pill carrying the school's name; every other pin is the
white pill. The class hooks the e2e suite depends on are unchanged.

## Contract

n/a. Design spec quoted (§8.5, *Zoom ≥ 9 — individual pins*):

> `L.divIcon` with `iconSize:[0,0]`, `iconAnchor:[0,0]`, inner wrapper `display:flex;
> flex-direction:column; align-items:center; transform:translate(-50%,-100%); width:max-content`:
> - label pill: `font-size:12.5px; font-weight:700; padding:7px 13px; border-radius:999px;
>   box-shadow:0 2px 10px rgba(14,35,80,.25); white-space:nowrap`
>   - unselected: `background:#FFFFFF; color:#0E2350; border:1.5px solid #D8DFEA`, text = rating only
>   - selected: `background:#0E2350; color:#FFFFFF; border:1.5px solid #0E2350`, text =
>     `{rating} · {name}`
> - stem: `width:2px; height:7px`, `background:#0E2350` when selected else `#9AA6B8`
> - selected marker gets `zIndexOffset: 500`
> - click → select that school and `panTo(coords, {animate:true})`

## Design source

`Parent Portal.dc.html:749-756`, rendered through the existing `L.DivIcon` pattern and styled in
`src/app/globals.css` (Leaflet icons are raw HTML strings — Tailwind classes do not apply, so the
values below are CSS custom-property references, never re-typed hex):

| Part | Design | CSS |
|---|---|---|
| Pill | 12.5/700, `7px 13px`, r999, `0 2px 10px rgba(14,35,80,.25)` | `font-size:0.78125rem; font-weight:700; padding:7px 13px; border-radius:999px; box-shadow:0 2px 10px oklch(from var(--navy-900) l c h / 0.25)` |
| Unselected | white / `#0E2350` / `1.5px #D8DFEA` | `background:var(--card); color:var(--navy-900); border:1.5px solid var(--border)` |
| Selected | `#0E2350` / white / `1.5px #0E2350` | `background:var(--navy-900); color:var(--primary-foreground); border:1.5px solid var(--navy-900)` |
| Stem | `2×7px`, navy selected / `#9AA6B8` idle | `width:2px; height:7px; background:var(--navy-900)` / `var(--muted-foreground)` |
| zIndex | `zIndexOffset: 500` selected | keep the existing `zIndexOffset={isActive ? 1000 : 0}` and add 500 for selected |

**Pill text.** The design prints the school's rating. There is no rating field (task 246), so:
- unselected pill: the graduation-cap glyph the design itself uses for a single-item cluster
  (`stroke:#fff`, `stroke-width:2`) — a real, non-numeric mark;
- selected pill: `{name}`, truncated at 28 characters with `text-overflow: ellipsis` and
  `max-width: 220px` so a long school name cannot cover the map.

Motion: pill and stem animate `transform`/`box-shadow` over `180ms cubic-bezier(0.25, 1, 0.5, 1)`
(the existing `.school-map-marker__pin` transition — reuse it, do not add a second timing).
`@media (prefers-reduced-motion: reduce)` sets `transition: none` on both, next to the existing
reduced-motion blocks in `globals.css`.

375px: identical geometry inside the mobile map sheet.

## Files

- `src/modules/school-search/lib/school-map-utils.ts` (`SCHOOL_MAP_ICON`,
  `SCHOOL_MAP_ICON_ACTIVE`, plus a new `createSelectedPinIcon(name)` — the selected pill's text
  is per-school, so it cannot be a shared singleton)
- `src/app/globals.css` (`.school-map-marker*` rules)
- `src/modules/school-search/components/SchoolMapMarker.tsx` (icon choice + zIndexOffset)

## Depends on

- **239** — the selected pill needs `selectedSchoolId`.

## Steps

1. Rewrite `MARKER_PIN_HTML` as the pill+stem structure, keeping the OUTER class names
   `school-map-marker` and `school-map-marker--active` exactly — `tests/e2e/helpers/school-map.ts`
   counts `.school-map-marker` and `.school-map-marker--active`, and `school-map.spec.ts` asserts
   `pins === 9` and hover-sync in both directions.
2. Add a third state class `school-map-marker--selected` for the navy pill.
3. `iconSize`/`iconAnchor`: the design uses `[0,0]`/`[0,0]` with a `translate(-50%,-100%)` inner
   wrapper. Keep `popupAnchor` sane so the existing compact popup still opens above the pin.
4. Escape the school name before interpolating it into the DivIcon HTML string (it is untrusted
   API text going into `innerHTML`) — a helper in `lib/`, not inline.
5. Re-run the map spec before anything else.

## Project rules

`.claude/rules/tailwind.md`: OKLCH only — the CSS must reference `var(--…)` tokens, never a
re-typed hex. `.claude/rules/quality.md`: no XSS via unescaped interpolation; decorative SVG gets
`aria-hidden`; the marker keeps `title`/`alt` so it is announced.
`.claude/rules/module-pattern.md`: icon factories in `lib/`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: filter to a single school; its `.school-map-marker` contains a pill whose computed
  `border-radius` is 9999px, `font-weight` 700, `font-size` 12.5px; selecting the card adds
  `school-map-marker--selected`, the pill's background resolves to `--navy-900`, and its text
  equals the school name from the intercepted response body.
- A school named with `<` or `&` renders as text, not markup (inject via a filtered query or
  assert `innerHTML` is escaped).
- `school-map.spec.ts` passes unmodified: 9 pins after de-cluster, hover-sync both directions,
  `--active` count transitions 0 → 1 → 0.
- Reduced motion: computed `transition-property` on the pill is `none`.
- axe clean at 375 + 1280; the map still announces its marker count via the existing
  `SchoolSearch.map.markerCount` live region.
- Zero raw hex in the diff (CSS included).

## Assumptions

The design's rating text is replaced by the cap glyph / school name; the substitution is
authorised by task 246 and by D-SCOPE-1 rule 4.

## Evidence

_(filled in as the task runs)_
