---
id: 111
title: Detach the sidebar into the design's 248px floating card (24px radius, two-layer shadow, 28/16/16 padding)
layer: ui
kind: build
slice: The `<aside>` shell of the parent rail — its box, not its contents
target: src/modules/shell/components/AppSidebar.tsx
contract: n/a — pure presentation; design spec quoted below
design: .qa/design/screens/portal--detached-sidebar.html:2, .qa/design/spec/01-portal-dashboard.md#12-detached-sidebar--portal--detached-sidebarhtml231
status: TODO
depends_on: ["110"]
---

## Objective

Re-skin the sidebar CONTAINER from an attached, full-bleed, border-right rail into the design's
detached floating card: 248px wide, white, 24px radius, the design's two-layer navy shadow, no
border, `28px 16px 16px` padding, inset 24px from the viewport's top/left/bottom. Everything
inside it (logo, groups, items, user card) is other tasks' work — this task moves and re-skins the
box and proves nothing regressed.

## Contract

n/a. `.qa/design/spec/01-portal-dashboard.md` §1.2, verbatim:

```
width:248px; flex:none; background:#FFFFFF; border-radius:24px;
box-shadow: 0 1px 2px rgba(14,35,80,.04), 0 8px 32px rgba(14,35,80,.06);
display:flex; flex-direction:column; padding:28px 16px 16px; box-sizing:border-box
```
"Because the outer frame is `height:100vh` with `padding:24px`, the sidebar is a full-height
floating card of height `100vh - 48px`."

**PRESERVED BEHAVIOUR:** `collapsible="icon"` stays (the Ctrl+B icon rail is a working feature the
design export merely omits — `01-portal-dashboard.md` UNKNOWNS §1; see 124). `max-md:hidden` stays
on the desktop branch (it guards the pre-hydration frame, since the primitive's `isMobile` is
false until the media query subscribes). `--sidebar-width: 248px` stays. `[data-slot="sidebar"]`
must still compute to `width: 248px` open / `48px` collapsed, and `[data-slot="sidebar-inner"]`
must still paint a near-white surface (`shell.spec.ts` samples it and requires min channel > 250).
The `useStudentsQuery()` call in this component stays until 117 removes its last consumer.

## Design source

| Property | Design value | Token / utility |
|---|---|---|
| width | `248px` | `--sidebar-width` on the provider (already set, task 110) |
| surface | `#FFFFFF` | `--color-sidebar` → the primitive's own `bg-sidebar` (unchanged) |
| radius | `24px` | `--radius-panel-lg` (task 110) → `rounded-panel-lg` |
| shadow | `0 1px 2px rgba(14,35,80,.04), 0 8px 32px rgba(14,35,80,.06)` | `--shadow-panel` (task 110) → `shadow-panel` |
| border | **none** | remove `border-r border-sidebar-border` |
| padding | `28px 16px 16px` | `pt-7 px-4 pb-4` — split across `SidebarHeader`/`SidebarContent`/`SidebarFooter` |
| inset from viewport | 24px top/left/bottom | `inset-y-6 left-6 h-auto` on the container |

The vendored primitive (`src/components/ui/sidebar.tsx`, READ-ONLY) renders three nested boxes:
`[data-slot="sidebar"]` (the flow group), `[data-slot="sidebar-gap"]` (reserves
`w-(--sidebar-width)` in flow), `[data-slot="sidebar-container"]` (**this is where `Sidebar`'s
`className` lands** — `fixed inset-y-0 h-svh w-(--sidebar-width) … md:flex`), and inside it
`[data-slot="sidebar-inner"]` (`flex size-full flex-col bg-sidebar`).

So the card is produced entirely from the caller:

- on `Sidebar` className: `inset-y-6 left-6 h-auto border-0` — `inset-y-6`+`h-auto` makes the fixed
  box span `100svh − 48px`; `left-6` matches the frame's 24px gutter so the card lands exactly over
  the 248px gap element (frame gutter 24 + gap 248 → main starts at 296, which the frame's `gap-6`
  already reserves).
- the inner card gets its radius/shadow through an arbitrary VARIANT (allowed; arbitrary VALUES are
  not): `[&>[data-slot=sidebar-inner]]:rounded-panel-lg [&>[data-slot=sidebar-inner]]:shadow-panel`.
  Do **not** add a ring — the design has no border on this card, and the primitive only adds one
  under `variant="floating"`, which is not used (it would also change the collapsed gap from 48px
  to 64px and break a passing assertion).
- keep `variant` at its default (`"sidebar"`) for exactly that reason.

Motion (D-DESIGN-3, the design declares none — authored): the card mounts with the design system's
`st-fade-in` keyframe, `180ms`, `--ease-out-quart` → `animate-fade-in motion-reduce:animate-none`.
The width change on Ctrl+B keeps the primitive's `transition-[width] duration-200 ease-linear` and
gains `motion-reduce:transition-none` from the caller.

## Files

- `src/modules/shell/components/AppSidebar.tsx` — only the `<Sidebar>` element's `className` and
  the padding classes on `SidebarHeader` / `SidebarContent` / `SidebarFooter`. Replace the stale
  block comment (it describes the attached white rail and the `.qa/CONTRAST-SPEC.md` seam) with a
  short one citing `portal--detached-sidebar.html:2`.

## Depends on

- **110** — `--radius-panel-lg`, `--shadow-panel` and the frame's 24px gutter must exist first, or
  `left-6` lands on the wrong x and `rounded-panel-lg` is an unknown utility.

## Steps

1. Read `src/components/ui/sidebar.tsx` lines 195-250 and confirm where `className` lands before
   writing a single class (it is `sidebar-container`, not the inner card).
2. Edit `AppSidebar.tsx`'s `<Sidebar>` className to the list above; keep `collapsible="icon"`,
   `h-svh`→`h-auto`, `max-md:hidden`.
3. Move the padding onto the three slots: header `pt-7 px-4 pb-0`, content `px-4`, footer
   `px-4 pt-0 pb-4` (the design's `28px 16px 16px`), keeping the existing
   `group-data-[collapsible=icon]:px-1` variants for the rail.
4. `pnpm tsc --noEmit && pnpm lint`.
5. Extend the existing `shell.spec.ts` sidebar test (do NOT create a new spec) with a card leg:
   `[data-slot="sidebar-inner"]` has `border-radius: 24px`, a non-`none` `box-shadow` containing
   two shadow layers, and its bounding box's `x >= 24` and `y >= 24` at 1280×800.

## Project rules

- `CLAUDE.md` §0 law 11 — never edit `src/components/ui/sidebar.tsx`. Every change is a caller
  class. Law 3 — read the surrounding code before editing; the comments in this file record real
  clipping bugs (`overflow-hidden` on `SidebarContent`) that must not be reintroduced.
- `.claude/rules/tailwind.md` — no arbitrary values; animate transform/opacity only (the width
  transition is the vendored primitive's, left as-is and documented, not authored here).
- `.claude/rules/quality.md` — the rail keeps its `<nav>` landmark and visible focus.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts` green, with the
  PRE-EXISTING legs untouched and passing: width `248px`, collapsed `48px`, `sidebar-inner` min
  channel > 250, 4 catalog-labelled links.
- New leg passes: inner radius `24px`, two-layer shadow, card inset ≥24px on x and y at 1280.
- Motion: `getComputedStyle(sidebarInner).animationName` includes the fade keyframe on first paint;
  under `page.emulateMedia({ reducedMotion: 'reduce' })` it computes `none`. Both asserted.
- 375px: the desktop branch stays hidden, the Sheet still opens (asserted by the existing mobile
  test), no horizontal scroll.
- axe serious/critical = 0 on `/dashboard` at 1280 and 375 (`shell-a11y.spec.ts`, unchanged file).
- No string changed → six catalogs untouched at 1151 keys.

## Assumptions

- The 24px gutter comes from the frame (110), so `left-6`/`inset-y-6` are the only offsets needed;
  if 110 chose different gutter utilities, mirror them here rather than hard-coding.

## Evidence

_(filled in as the task runs)_
