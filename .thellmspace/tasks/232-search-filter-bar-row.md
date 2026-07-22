---
id: 232
title: Build the filter bar row — All-filters pill, divider, no-filters hint
layer: ui
kind: implement
slice: The design's §8.2 filter bar between the header and the list/map body
target: src/modules/school-search/components/SchoolFilterBar.tsx (new), src/modules/unified-search/components/UnifiedSearchScreen.tsx
contract: n/a (presentation over the existing school-search store)
design: .qa/design/screens/portal--main.html:162-169 · .qa/design/spec/01-portal-dashboard.md#8.2
status: TODO
depends_on: ["230"]
---

## Objective

A single horizontal bar under the header carrying the navy "All filters" pill, the hairline
divider, the applied-filter chips (task 233) and the "no filters applied" hint. It is the
design's filter affordance and the only one visible at phone widths.

## Contract

n/a — presentation. Quoted design spec (§8.2):

> Row: `display:flex; align-items:center; gap:8px; flex-wrap:wrap`.
> "All filters" button: `display:inline-flex; align-items:center; gap:7px; background:#0E2350;
> color:#fff; font-size:13px; font-weight:600; padding:9px 16px; border-radius:999px; border:none`,
> `style-hover="background:#16326E"`. Icon: SVG `13×13`, `stroke:currentColor`, `stroke-width:2`,
> path `M4 6h16M7 12h10M10 18h4`. Handler `openFilters` → `filtersOpen:true`.
> Divider: `width:1px; height:22px; background:#D8DFEA; margin:0 4px`.
> Empty state: `font-size:13px; color:#9AA6B8`, copy **"No filters applied — showing all schools"**.

## Design source

`.qa/design/screens/portal--main.html:162-169`.

| Element | Design | Implementation |
|---|---|---|
| Row | flex, gap 8, wrap, `align-items:center` | `flex flex-wrap items-center gap-2` |
| All-filters pill | `#0E2350` fill, white ink, 13/600, `9px 16px`, r999, gap 7px | `inline-flex items-center gap-1.75 rounded-full bg-navy-900 px-4 py-2.25 text-meta font-semibold text-primary-foreground hover:bg-navy-800` |
| Icon | 13×13, `stroke-width:2`, `M4 6h16M7 12h10M10 18h4` | lucide `SlidersHorizontal` at `size-3.25` `strokeWidth={2}` (same three-rule glyph; `.claude/rules` bans a second icon set) |
| Divider | 1×22px `#D8DFEA` | `h-5.5 w-px bg-border` (`--color-border` `#E3E8F0`; `#D8DFEA` has no token and is within 1 step of it — do **not** inline the hex) |
| Hint | 13px `#9AA6B8` | `text-meta text-body` — `#9AA6B8` is **2.46:1** on white and **2.18:1** on the page well; it cannot ship (`.claude/rules/quality.md`, WCAG AA) |
| Active count | — | when `countActiveSchoolFilters(filters) > 0` the pill carries the existing DS `CountBadge` |

Motion: `transition-colors duration-150 ease-out-expo` on the pill plus `active:scale-95`;
`motion-reduce:transition-none motion-reduce:active:scale-100`. The hint fades in/out with
`animate-in fade-in duration-150` when it appears, `motion-reduce:animate-none`.

375px: the row wraps to two lines; the All-filters pill keeps a 44px pointer target via an
`after:absolute after:-inset-1.5` expansion (the drawn pill stays at the design's height).

## Files

- `src/modules/school-search/components/SchoolFilterBar.tsx` (**new**, < 120 lines)
- `src/modules/unified-search/components/UnifiedSearchScreen.tsx` (mount it in schools mode)
- `src/modules/school-search/index.ts` (export the bar)
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `SchoolSearch.filterBar.allFilters`,
  `SchoolSearch.filterBar.noFilters`

## Depends on

- **230** — the bar sits directly under the header band.

## Steps

1. Create `SchoolFilterBar` as a dumb component: it takes `activeCount`, `onOpenFilters` and
   renders the pill, the divider, `{children}` (the chip row from 233) and the hint. All state
   comes from the store via selectors in the wrapper, never a whole-store subscription.
2. `activeCount` reuses the EXISTING `countActiveSchoolFilters` helper
   (`src/modules/school-search/lib/active-filter-count.ts`) — do not write a second counter.
3. `onOpenFilters` is wired to the dialog in task 234; until then it opens the existing
   `SearchFilterSheet` so the surface is never left with a dead button.
4. Add the two catalog keys to all six locales.

## Project rules

`.claude/rules/module-pattern.md`: components are dumb, ≤120 lines, no business logic; the count
helper stays in `lib/`. `.claude/rules/tailwind.md`: no arbitrary values, `gap-*` not margin.
`.claude/rules/quality.md`: never `<div onClick>` — the pill is a real `<button type="button">`;
44px pointer target.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `getByRole('button', { name: cat(en,'SchoolSearch.filterBar.allFilters') })` is
  visible at 375 AND 1280; its computed `border-radius` is `9999px` and its background resolves
  to `--navy-900`.
- With no filters applied the hint text equals `cat(en,'SchoolSearch.filterBar.noFilters')`;
  after clicking QLD in the rail the hint is gone and the pill shows a count badge of 1.
- The pill's pointer box measures ≥44×44 (`boundingBox()` on the `::after`-expanded hit area
  asserted via `elementFromPoint` at the box edge).
- Six catalogs key-identical; the seven W8 regression specs stay green.
- axe clean at both widths; reduced-motion removes the transition.
- Zero raw hex / arbitrary values in the diff.

## Assumptions

`#D8DFEA` (divider) and `#9AA6B8` (hint) have no token in
`.qa/design/spec/04-ds-foundations.md`'s TAILWIND V4 MAPPING; the nearest sanctioned tokens
(`--color-border`, `--color-body`) are used and the substitution is recorded here rather than
inventing a token W0 does not define.

## Evidence

_(filled in as the task runs)_
