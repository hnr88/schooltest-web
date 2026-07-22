---
id: 124
title: Collapsed icon rail — keep the working Ctrl+B feature the export omits, re-skinned to the detached card
layer: ui
kind: build
slice: The 48px icon rail state of the detached sidebar, plus its toggle control
target: src/modules/shell/components/AppSidebar.tsx, src/modules/shell/components/SidebarNavItem.tsx, src/modules/shell/components/SidebarUserCard.tsx, src/modules/shell/components/AppTopbar.tsx
contract: n/a — the design has no collapsed variant; this task states what is authored and why
design: .qa/design/spec/01-portal-dashboard.md#unknowns (Sidebar collapsed behaviour), .qa/design/screens/portal--detached-sidebar.html:2-31
status: TODO
depends_on: ["115"]
---

## Objective

`01-portal-dashboard.md` UNKNOWNS opens with: "**Sidebar collapsed behaviour.** The task asks for
it. There is no collapsed/expanded state, no toggle button, no width variable, no `data-collapsed`
attribute, and no icon-only variant anywhere … The sidebar is a fixed `248px` in every state present
in the export." The app HAS a working 48px icon rail on Ctrl+B, asserted by e2e. This task
**re-skins it to the detached card and keeps every behaviour** — deleting a working feature because
the export omits it is explicitly out of bounds.

## Contract

n/a for visuals. The behavioural contract is the passing spec, `tests/e2e/shell.spec.ts:153-175`:

```
trigger (name Shell.topbar.toggleNav) is visible
click → [data-slot="sidebar"] computes width 48px
the logo img (name Shell.sidebar.logoAlt) is still visible in the rail
the Overview link still exposes aria-label = Shell.nav.overview
Control+B → width back to 248px
```
Every line of that must still pass, unchanged.

## Design source

Authored from the detached card's own tokens (there is no design to port — say so in the code
comment, citing UNKNOWNS §1):

| Property | Value | Rationale |
|---|---|---|
| rail width | `48px` | the primitive's `SIDEBAR_WIDTH_ICON = 3rem`; unchanged so the passing assertion holds |
| card radius | `24px` → keep `rounded-panel-lg` | same card, narrower; a different radius would read as a different component |
| card shadow | `shadow-panel` | unchanged |
| card padding | `pt-7 px-1 pb-4` | the existing `group-data-[collapsible=icon]:px-1` idiom, kept |
| item box | `40×40`, centred, `rounded-tile` (12px) | the existing `group-data-[collapsible=icon]:size-10!` rule, re-pointed to the design's 12px radius |
| item icon | `18px`, stroke-width `1.8` | matches the expanded rail (114) |
| active item | `bg-navy-900` + white glyph | same slab as 115, squared |
| logo | `mark` variant at 24px, `mb-4 ml-0` | 112 |
| group overlines | hidden | `group-data-[collapsible=icon]:hidden` |
| user card | avatar only, centred, still the menu trigger | 117 |
| tooltip | the item's label, from `SidebarMenuButton tooltip={label}` | already ships; it is the only way the label survives |

**Toggle control** (`SidebarTrigger` in the top row): re-skin to match the row's other pills —
`size-11 rounded-full bg-card shadow-pill` (the design's 44px floating circle idiom from
`portal--main.html:17`), `text-body` glyph at `size-4.5`, hover `shadow-md`,
`transition-shadow duration-200 ease-out-expo motion-reduce:transition-none`, plus the focus ring
from 123. Keep the `after:-inset-1.5` pointer expansion ONLY if the 44px box does not already
satisfy the target minimum — measure first; at `size-11` it does, so remove the now-redundant
pseudo-element and record that.

Motion: the width change is the vendored `transition-[width] duration-200 ease-linear` on
`sidebar-gap` and `sidebar-container`; add `motion-reduce:transition-none` from the caller. Labels
must not cross-fade (they are `hidden`, not faded) — animating them would animate layout, which
`.claude/rules/tailwind.md` forbids.

## Files

- `src/modules/shell/components/AppSidebar.tsx` — the `group-data-[collapsible=icon]:*` padding
  variants + `motion-reduce:transition-none`.
- `src/modules/shell/components/SidebarNavItem.tsx` — the collapsed size/radius/centering variants.
- `src/modules/shell/components/SidebarUserCard.tsx` — the collapsed avatar-only variant.
- `src/modules/shell/components/AppTopbar.tsx` — the `SidebarTrigger` class string.

## Depends on

- **115** — the expanded rail's final geometry and active slab must exist, since the collapsed rail
  is the same item squared.

## Steps

1. Read the in-file comments in `AppSidebar.tsx` and `SidebarNavItem.tsx` about the collapsed rail
   FIRST: they record two real, measured bugs — `SidebarContent`'s
   `group-data-[collapsible=icon]:overflow-hidden` clipping the first item's hit-area pseudo to
   43px (fixed with `-mt-0.75`/`pt-0.75`), and `overflow-hidden` on the button clipping it to
   40.5px. Neither may be reintroduced.
2. Apply the table above; keep `size-10!` (40px) and the symmetric `after:-inset-0.75`.
3. Re-skin the trigger; measure its real pointer target with `elementFromPoint` before deleting the
   pseudo-element.
4. `pnpm tsc --noEmit && pnpm lint`.
5. Extend `shell.spec.ts`'s collapsed test: after the toggle the card still computes
   `border-radius: 24px` and a non-`none` `box-shadow`; the active item computes `40×40` with
   `rgb(14, 35, 80)`; hovering it shows the tooltip with the catalog label; the trigger measures
   44×44.

## Project rules

- `CLAUDE.md` §0 law 11 — `sidebarMenuButtonVariants` and the collapsed width are vendored; every
  change is a caller class. Law 3 — never break existing logic.
- `.claude/rules/tailwind.md` — animate transform/opacity only (hence: no label fade); no arbitrary values.
- `.claude/rules/quality.md` — ≥44px targets, visible focus, tooltip is not a substitute for an
  accessible name (`aria-label` stays on every collapsed item).

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts` green with the
  FIVE pre-existing collapsed-rail assertions untouched and passing.
- New legs pass (24px radius + shadow retained collapsed, 40×40 navy active item, tooltip label,
  44×44 trigger).
- A real `elementFromPoint` scan shows every collapsed nav item ≥44×44 (both dimensions — the
  in-file comment records that a vertical-only expansion previously failed at 41px wide).
- Sign out is still reachable on the collapsed rail (click the avatar-only card → menu → Sign out →
  token null). This is the regression the collapsed state is most likely to hide.
- Motion: computed `transition-property` on the container includes `width`, duration `0.2s`, and
  `0s` under `emulateMedia({ reducedMotion: 'reduce' })`.
- Screenshot refreshed at `.qa/screenshots/shell-desktop-collapsed.png`.
- axe serious/critical = 0 at 1280 in the collapsed state (add that state to `shell-a11y.spec.ts`).
- No new strings → six catalogs unchanged.

## Assumptions

- The collapsed rail is authored, not ported. Its provenance comment must say exactly that and cite
  `01-portal-dashboard.md` UNKNOWNS §1, so a later reviewer does not go looking for a design slice
  that does not exist.

## Evidence

_(filled in as the task runs)_
