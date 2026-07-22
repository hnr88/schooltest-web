---
id: 247
title: Lay out the desktop list/map split on the design's fixed 340px list rail
layer: ui
kind: implement
slice: The design's §8.3 two-column body
target: src/app/globals.css (grid utilities), src/modules/school-search/components/SchoolsPane.tsx
contract: n/a (layout)
design: .qa/design/screens/portal--main.html:171 · .qa/design/spec/01-portal-dashboard.md#8.3 · §9
status: TODO
depends_on: ["237", "241"]
---

## Objective

At desktop widths the results list becomes the design's fixed-width column beside a fluid map,
each pane owning its own scroller, so the page itself never grows a scrollbar.

## Contract

n/a. Design spec quoted (§8.3):

> ```
> display:grid; grid-template-columns:340px 1fr; gap:20px; flex:1; min-height:0
> ```
> Fixed 340px list rail, fluid map. **Not** responsive — no `auto-fit`, no media query.

and §8.4 (list scroll container):

> `display:flex; flex-direction:column; gap:14px; overflow-y:auto; min-height:0;
> padding:2px 4px 8px 2px`

## Design source

`.qa/design/screens/portal--main.html:171,173`.

Named grid utilities in `src/app/globals.css` (the file already owns
`grid-cols-search-workspace` = `15.5rem | 1fr | 1.2fr` and `grid-cols-search-list`
= `15.5rem | 1fr`; both are retuned, not replaced, so every consumer keeps its class name):

```
@utility grid-cols-search-workspace {           /* rail · list · map */
  grid-template-columns: 15.5rem 21.25rem minmax(0, 1fr);   /* 248px · 340px · fluid */
}
@utility grid-cols-search-list {                /* rail · list (map hidden) */
  grid-template-columns: 15.5rem minmax(0, 1fr);
}
```

- gap: `gap-5` (design 20px).
- list column: `flex flex-col gap-3.5 overflow-y-auto min-h-0 pr-1` (design gap 14px, its own
  scroller) — reuse the existing `scroll-region` utility so the keyboard scroll affordance and
  the thin scrollbar stay consistent.
- map column: `min-h-0 min-w-0`, panel `min-h-105` (420px) from task 241.

**The 248px filter rail is retained** in front of the design's two columns. The design has no
rail, but `school-filter-panel.spec.ts:13-14` and `school-search-presentation.spec.ts:59-60`
require `[data-slot="school-filter-panel"]` to be VISIBLE at 1280×800 without opening anything,
and `.qa/PLAN.md` makes breaking a passing spec a failure. At 1280 the columns compute to
248 + 340 + 20×2 gaps → map ≈ 632px, which also satisfies
`school-search-presentation.spec.ts:86` (`mapBox.width >= resultsBox.width`).

Motion: the map column mounts/unmounts with the Map/List toggle; wrap it in
`animate-in fade-in duration-200 ease-out-expo` / `animate-out fade-out duration-150`, with
`motion-reduce:animate-none`. No width/height animation (`.claude/rules/tailwind.md` allows
transform + opacity only).

375px: task 248 owns the collapse. This task must not regress it — below `lg` the panes stack and
the document takes one ordinary scroll, exactly as today.

## Files

- `src/app/globals.css` (the two `@utility` grid definitions)
- `src/modules/school-search/components/SchoolsPane.tsx`
- `src/modules/school-search/components/SchoolResults.tsx` (list scroller gap/padding)

## Depends on

- **237** — card geometry determines whether 340px is enough.
- **241** — the map panel's min-height is part of the row's intrinsic height.

## Steps

1. Retune the two named grid utilities. Do NOT introduce a third — `AgentsPane` uses
   `grid-cols-search-list` and must keep working (task 251 confirms it).
2. Apply `gap-5` and the design's list-column scroll box.
3. Verify the row is still `lg:min-h-0 lg:h-full` so each pane scrolls internally and
   `document.scrollingElement.scrollHeight <= clientHeight` at 1280.
4. Re-run the map + presentation specs, which measure both columns.

## Project rules

`.claude/rules/tailwind.md`: named `@utility` grid tracks instead of arbitrary
`grid-cols-[340px_1fr]`; `gap-*` for sibling spacing; 4pt scale.
`.claude/rules/quality.md`: the scroller keeps its `tabIndex`/`role`/`aria-label`
(axe `scrollable-region-focusable` is serious — `SearchResultsPanel` already carries them).

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright at 1280×800: the results column's bounding box width is 340px ±2, the map column is
  wider than it, and `document.scrollingElement.scrollWidth <= 1280`.
- The page itself does not scroll: `scrollHeight <= clientHeight + 1` on the dashboard
  scrollport, while the list column's own `scrollHeight > clientHeight` with 12 cards.
- `[data-slot="school-filter-panel"]` is still visible at 1280 →
  `school-filter-panel.spec.ts` and `school-search-presentation.spec.ts` pass unmodified.
- Toggling the map (`SchoolSearch.map.showList`) widens the list column — `school-map.spec.ts`
  scenario 4 passes unmodified.
- axe clean at 1280; reduced motion removes the column fade.
- Zero arbitrary values in the diff.

## Assumptions

Retaining the filter rail is a documented deviation from §8.3, forced by the regression baseline;
it is recorded here and in task 234 rather than silently resolved.

## Evidence

_(filled in as the task runs)_
