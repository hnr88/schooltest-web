---
id: 118
title: Top row — drop the 64px white bar for the design's chrome-less row over the page well
layer: ui
kind: build
slice: The shell's top row frame: the container, its height/padding/order, and the removal of the bar chrome
target: src/modules/shell/components/AppTopbar.tsx
contract: n/a — pure presentation; design spec quoted below
design: .qa/design/screens/portal--main.html:7-22, .qa/design/spec/01-portal-dashboard.md#2-dashboard--top-bar-greeting-row, .qa/design/spec/01-portal-dashboard.md#13-main-scroll-column--portal--mainhtml2
status: TODO
depends_on: ["110"]
---

## Objective

The detached composition has **no top chrome**: `<main>` is a bare scroll column and the controls
that live in today's white 64px bar sit directly on the `#EEF1F6` well as floating white pills.
Re-frame `AppTopbar` accordingly — remove the bar's background, border and fixed height, adopt the
design's row rhythm, and keep every control the app needs and the specs assert.

## Contract

n/a. `.qa/design/spec/01-portal-dashboard.md` §1.3 + §2, verbatim:

```
<main> — flex:1; min-width:0; display:flex; flex-direction:column; overflow-y:auto
Dashboard inner wrapper — display:flex; flex-direction:column; gap:28px; padding:8px 4px 8px 8px

Top row — display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap
Right cluster — display:flex; align-items:center; gap:10px
```

**PRESERVED BEHAVIOUR:** the row keeps, in DOM order: the `SidebarTrigger` (accessible name
`Shell.topbar.toggleNav`, the only visible way to reach the icon rail and the mobile Sheet, and the
partner of the Ctrl+B shortcut `shell.spec.ts` asserts), `TopbarBreadcrumb` (nav landmark named
`Shell.topbar.breadcrumbLabel`, with `[data-slot="topbar-page-title"]`), the search pill
(`SEARCH_HREF`), and `NotificationBell`. The user chip moved to the rail in 117 and must NOT be
duplicated here.

## Design source

**Composition decision, authored and recorded.** The design's top row is the DASHBOARD's greeting
row (date + `<h1>Good morning, Maria` on the left, search + bell on the right) — page content, not
shell. The app additionally requires a breadcrumb and a rail toggle, which the export has nowhere.
Resolution: the **shell** owns a chrome-less row carrying `toggle · breadcrumb · ⟶ · search · bell`
with the design's right-cluster spec verbatim; the **page** (W5's dashboard, W6's children, …)
keeps its own `<h1>` below it. One `<h1>` per page is preserved, and no control is orphaned.

| Property | Design value | Utility |
|---|---|---|
| container | no background, no border, no fixed height | remove `h-16 border-b border-border bg-card` |
| row padding | `8px 4px 8px 8px` (main's inner wrapper) | `px-2 pt-2 pb-0` on the row; the trailing `4px` right inset is the scroll gutter |
| row gap | `10px` right cluster / `20px` between halves | `gap-2.5` inside the cluster, `gap-5` on the row |
| alignment | `align-items:center` for the cluster | `items-center` |
| wrap | `flex-wrap:wrap` (§9 lists the greeting row among 9 wrap points) | `flex-wrap` |
| control height | `44px` | `h-11` on every pill (120/121) |

Motion: the row itself does not animate. It gains `animate-fade-in motion-reduce:animate-none`
(design system `st-fade-in`, 180ms, `--ease-out-quart`) on mount so the shell resolves instead of
snapping — the one place D-DESIGN-3 asks for at this level.

375px: `flex-wrap` + `gap-2.5`; the search pill stays `max-lg:hidden` (existing behaviour — the
mobile search entry is the nav's Search destination), so the row is `toggle · breadcrumb · bell`
and fits 375 with room. Row padding drops to `px-1` (`max-md:px-1`).

## Files

- `src/modules/shell/components/AppTopbar.tsx` — the `<header>` element's className and the
  ordering/wrapping of its children. The `SidebarTrigger`'s own pill styling is task 124's; the
  search pill is 120's; the bell is 121's; the breadcrumb is 119's. Remove the `UserMenu` import
  and usage (moved by 117) — leaving both would ship two sign-out chips.

## Depends on

- **110** — the row sits on the page well; without the frame's background this reads as a white
  block on white.

## Steps

1. Rewrite the `<header>` className: `flex shrink-0 flex-wrap items-center gap-5 px-2 pt-2
   max-md:px-1 animate-fade-in motion-reduce:animate-none`. Keep `<header>` as the element (it is a
   `banner`-adjacent landmark inside `<main>`; it must stay a `<header>`, not a `<div>`).
2. Keep the `<span aria-hidden className="flex-1" />` spacer; group search + bell in the existing
   `[data-slot="topbar-actions"]` div at `gap-2.5`.
3. Remove `UserMenu` (117 owns its new home). Verify no other file imports it.
4. `pnpm tsc --noEmit && pnpm lint`.
5. Extend `shell.spec.ts`'s breadcrumb test with a row leg: the header's computed
   `background-color` is `rgba(0, 0, 0, 0)`, its `border-bottom-width` is `0px`, and its bounding
   box height is ≥ 44 and ≤ 72 (the row is now content-sized, not pinned to 64).

## Project rules

- `.claude/rules/quality.md` — semantic landmarks and one `<h1>` per page: the shell contributes NO
  `<h1>`; ordered headings stay the page's job.
- `.claude/rules/tailwind.md` — no arbitrary values; `gap-*` for sibling spacing, never margin.
- `.claude/rules/module-pattern.md` — `AppTopbar` stays a dumb composition (no data fetching).
- `CLAUDE.md` §0 law 4 — do not restyle the controls here; each has its own task.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts tests/e2e/dashboard.spec.ts tests/e2e/unified-search.spec.ts`
  green: the toggle (Ctrl+B + click), the breadcrumb text/page-title, and the bell all still resolve.
- New legs pass (transparent background, no bottom border, content-sized height).
- Exactly ONE element in the page matches `getByRole('button', { name: Shell.topbar.userMenuLabel })`
  (proves 117's move did not leave a duplicate).
- Motion: header `animation-name` non-`none` on load, `none` under `emulateMedia({reducedMotion:'reduce'})`.
- 375px: no horizontal scroll (`scrollWidth <= clientWidth`), the toggle's pointer target ≥44×44,
  the breadcrumb truncates rather than pushing the row wide.
- axe serious/critical = 0 at 1280 + 375.
- No new strings → six catalogs unchanged.

## Assumptions

- The design's `8px 4px 8px 8px` belongs to `<main>`'s inner wrapper, which in this app is the
  page's own container; the row takes the top/left/right of it so the shell and the page share one
  visual gutter. If W5's dashboard container ends up owning that padding, the row must not double
  it — coordinate by measuring, not by guessing.

## Evidence

_(filled in as the task runs)_
