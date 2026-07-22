---
id: 172
title: Build the dashed "Add a child" tile and the portal zero-children state
layer: ui
kind: build
slice: The always-present add-child affordance at the end of the card grid, and the honest zero-children screen when the parent has no children at all.
target: src/modules/children/components/AddChildTile.tsx (new), src/modules/children/components/ChildrenEmptyState.tsx, src/i18n/messages/*.json
contract: C-STUDENT-LIST (empty collection) · C-STUDENT-CREATE (the wizard it routes to)
design: .qa/design/screens/portal--my-children-list.html (L35-41) · .qa/design/screens/app--empty-state.html · .qa/design/spec/02-portal-children.md §A.6, §A.7
status: TODO
depends_on: ["166", "167"]
---

## Objective

Ship the dashed tile as the last grid child on every non-empty list, and resolve the design's
recorded UNKNOWN ("Portal zero-children state" — no branch exists) by keeping the existing portal
empty state and re-dressing it, instead of importing the App-chrome student-code card.

## Contract

`C-STUDENT-LIST` returns `{ data: [], meta: { pagination: { total: 0 } } }` for a parent with no
children — the real state a freshly registered parent hits (`tests/e2e/students-list.spec.ts:118`).
The tile and the empty state both route to `/dashboard/children/new`, which is the existing
`C-STUDENT-CREATE` wizard. **No student-code linking endpoint exists** in `.qa/intake/api-inventory.md`,
so `app--empty-state.html`'s `Enter student code, e.g. NH-4823-EM` input and its `Link child` button
are NOT built — that would invent an API.

## Design source

`portal--my-children-list.html` L35-41 (AddChildTile):
- Tile: `border:1.5px dashed #C4CEDC` (W0 `--color-portal-dashed`, `oklch(0.8480 0.0224 256.74)`),
  `border-radius:24px` (`rounded-3xl`), `min-height:220px` (`min-h-55`), `grid place-items-center`,
  `color:#7C8698` (`text-portal-muted`), no background fill (the page well shows through).
- Hover: `border-color:#2563EB; color:#2563EB` — one step recolours border, icon (`stroke=currentColor`)
  and both labels.
- Icon puck L37: 44px (`size-11`), `rounded-full`, `bg-card`, `box-shadow 0 1px 2px rgba(14,35,80,.06)`
  (`--shadow-sm`), `grid place-items-center`, `margin:0 auto 12px` (`mx-auto mb-3`); SVG 18x18,
  `stroke-width 2`, `stroke-linecap round`, path `M12 5v14M5 12h14`. **The puck stays white on hover.**
- Title L38: 14px / 600 (`text-sm font-semibold`) — `Add a child`.
- Sub L39: 12.5px / `margin-top:3px` (`text-meta mt-1`) — the design's `Takes about 3 minutes` is
  hardcoded copy in the export; keep it as a catalog string since the wizard really is 5 short steps.

`app--empty-state.html` (§A.7) contributes only the composition of the zero state: centred column,
`gap:22px`, 96px medallion `background:#EFF5FF` (`bg-blue-50`) with a 42px `stroke:#2563EB`
`stroke-width:1.8` user-plus glyph, `h1` 27px/700/`-0.015em`, `p` 15px/`line-height:1.6`/`#64748B`.
Rendered in the PORTAL chrome (24px radii, navy pill button), not the App chrome.

## Files

- `src/modules/children/components/AddChildTile.tsx` (new).
- `ChildrenEmptyState.tsx` — re-dressed; keep `Children.emptyTitle` / `Children.emptyDescription`
  exactly (asserted by `students-list.spec.ts:129-130`).
- Catalogs: `Children.addChildTileTitle`, `Children.addChildTileHint`.

## Depends on

- `166` (page container + the primary Add button whose action this duplicates), `167` (grid).

## Steps

1. Tile is a `<Link href="/dashboard/children/new">` styled as the tile — never a `<div onClick>`;
   it is one tab stop with a visible `--color-ring` focus ring.
2. Render it as the last child of the grid whenever `rows.length > 0`; when the parent has zero
   children render `ChildrenEmptyState` instead (and NOT the tile alone), so
   `students-list.spec.ts` still finds `Children.cardListLabel` absent in the empty case.
3. Keep the empty state's existing CTA wired to the wizard; add nothing that promises a code-link flow.
4. Motion: border/text colour transition 200ms `ease-out-quart`; the medallion in the empty state
   enters with `st-pop-in` 180ms; both `motion-reduce:` inert.

## Project rules

- `.claude/rules/quality.md` — never `<div onClick>`, visible focus, 44px target (the tile is 220px).
- `.claude/rules/tailwind.md` — dashed border width 1.5px needs a W0 token or `border-[1.5px]` is
  banned; use the W0 `--border-width-hairline-2` style token rather than a bracket value.
- `.claude/rules/i18n.md` — six catalogs.
- `.qa/DECISIONS.md` D-SCOPE-1.4 — no invented student-code linking.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: seeded parent sees exactly one tile after the last card and clicking it opens
  `/dashboard/children/new`; a freshly registered parent (throwaway-parent helper) sees
  `Children.emptyTitle` + `Children.emptyDescription`, no tile, and `Children.cardListLabel` absent.
- No element anywhere offers a student-code input.
- Motion present + reduced-motion inert; 375px tile is full width with `min-h-55` preserved; 1280px it
  shares the 3-col track.
- axe zero serious/critical on both states; six catalogs key-identical.
- `students-list.spec.ts` (both the seeded and the empty-parent test) green.

## Assumptions

The existing `ChildrenEmptyState` copy stays; only its chrome changes (D-SCOPE-3: presentation may be
superseded, wiring preserved).

## Evidence

<!-- filled in as the task runs -->
