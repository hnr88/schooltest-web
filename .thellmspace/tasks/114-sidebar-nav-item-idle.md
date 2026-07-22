---
id: 114
title: Nav item base — 11/14 padding, 12px radius, 14.5px label, 18px icon, plus the hover and focus the design never drew
layer: ui
kind: build
slice: The rail nav item in its IDLE / hover / focus states (active state is 115)
target: src/modules/shell/components/SidebarNavItem.tsx
contract: n/a — pure presentation; design spec quoted below
design: .qa/design/screens/portal--detached-sidebar.html:6-14,18-23, .qa/design/spec/01-portal-dashboard.md#12-detached-sidebar--portal--detached-sidebarhtml231, .qa/design/spec/05-ds-components.md#51-sidebar
status: TODO
depends_on: ["113"]
---

## Objective

Re-skin the rail nav item to the detached design's geometry and idle treatment, and author the
hover + focus states the export omits — taking hover from the design system's OWN navigation card
(`ds--navigation.html:5-18`) rather than inventing one.

## Contract

n/a. `.qa/design/spec/01-portal-dashboard.md` §1.2, verbatim:

```
display:flex; align-items:center; gap:12px; padding:11px 14px;
border-radius:12px; font-size:14.5px; cursor:pointer
font-weight / background / color are state-driven
Icon: inline SVG 18×18, viewBox="0 0 24 24", fill:none, stroke:currentColor,
stroke-width:1.8, stroke-linecap:round, stroke-linejoin:round. Icon inherits the item's color.
```
State table (`Parent Portal.dc.html:797-801`):

| State | font-weight | background | color |
|---|---|---|---|
| active | `600` | `#0E2350` | `#FFFFFF` |
| inactive | `500` | `transparent` | `#7C8698` |

"There is **no hover style and no focus style declared on sidebar nav items** in this file."

**PRESERVED BEHAVIOUR:** each item stays a `next-intl` `<Link>` inside `SidebarMenuButton`
(`render={<Link …/>}`), keeps `aria-label={label}` (the collapsed-rail test reads it), keeps
`tooltip={label}`, keeps `onNavigate` → `setOpenMobile(false)` (closing the mobile Sheet on
navigation), and keeps the `NavCountBadge` slot for `myChildren`. `shell.spec.ts` asserts each
link's exact text and `href`.

## Design source

| Property | Design value | Token / utility |
|---|---|---|
| gap | `12px` | `gap-3` |
| padding | `11px 14px` | `py-2.75 px-3.5` |
| radius | `12px` | `--radius-tile` (0.75rem) → `rounded-tile` |
| label size | `14.5px` | the `@theme` step whose value is `0.90625rem` — today `--text-lede` → `text-lede`. Never `text-[14.5px]`. |
| idle weight | `500` | `font-medium` |
| idle ink | `#7C8698` → **REJECTED** | see below |
| icon | `18×18`, stroke-width `1.8` | `[&_svg]:size-4.5` + `strokeWidth={1.8}` on the lucide icon |
| icon colour | `currentColor` | inherit — never set a separate icon colour |

**Authored a11y correction:** the design's idle ink `#7C8698` measures **3.67:1** on `#FFFFFF` —
below AA for 14.5px normal text. Substitute `--color-sidebar-foreground` (`#475569`, **7.58:1**),
which is the design system's OWN idle nav ink (`05-ds-components.md` §5.1: "Nav item — default …
`color:#475569`") and is already what ships, so this is also a zero-regression choice. Record the
measured 3.67:1 next to the class string.

**Hover** (design system §5.1, verbatim): `background:#F1F5F9` → `hover:bg-muted`;
`color:#0E2350` → `hover:text-foreground`. The DS declares `transition:background .12s`; this build
uses `transition-colors duration-200 ease-out-expo` because `shell.spec.ts` already asserts the
computed transition contains `background-color` and `0.2s`, and `.claude/rules/tailwind.md` mandates
an exponential easing. `motion-reduce:transition-none` is mandatory.

**Focus** (authored — nothing in the export): `focus-visible:ring-2 focus-visible:ring-sidebar-ring
focus-visible:outline-none`, `--sidebar-ring = oklch(0.5461 0.2152 262.8809 / 35%)` (= the design's
own `--ring` token, `tokens.css:47`, which nothing in the export consumes).

**Pointer target:** the drawn item is `11+11+~20 = 42px` tall — under 44px. Keep the existing
`relative` + `after:absolute after:-inset-0.75` idiom AND the `overflow-visible` override (the
vendored `sidebarMenuButtonVariants` sets `overflow-hidden`, which CLIPS the pseudo-element — the
in-file comment records a real measured 40.5px failure). Keep `min-w-0 truncate` on the label span.

## Files

- `src/modules/shell/components/SidebarNavItem.tsx` — `NAV_ITEM_CLASSES`, the icon's
  `strokeWidth`, and the file's leading comment (rewrite it to cite
  `portal--detached-sidebar.html:6` + the two measured contrast numbers). Active-state classes are
  left exactly as they are; 115 owns them.

## Depends on

- **113** — the group/spacer structure and `gap-0.5` list rhythm must be in place, otherwise the
  item's 11px vertical padding is measured against the old 6px gap.

## Steps

1. Rewrite `NAV_ITEM_CLASSES`: `gap-3`, `px-3.5 py-2.75`, `rounded-tile`, `text-lede`,
   `font-medium`, `text-sidebar-foreground`, `hover:bg-muted hover:text-foreground`,
   `transition-colors duration-200 ease-out-expo motion-reduce:transition-none`,
   `focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none`,
   `[&_svg]:size-4.5`, plus the untouched `relative overflow-visible after:absolute after:-inset-0.75`
   and the `group-data-[collapsible=icon]:*` rail overrides.
2. Set `strokeWidth={1.8}` on `<item.icon />` (was `2`).
3. `pnpm tsc --noEmit && pnpm lint`.
4. Re-baseline in `shell.spec.ts` — **retarget, never delete**: the two existing geometry legs
   `toHaveCSS('border-radius','10px')` → `'12px'` and `toHaveCSS('padding','10px 12px')` →
   `'11px 14px'`. Add: idle item computes `font-size: 14.5px`, `font-weight: 500`, background
   `rgba(0, 0, 0, 0)` (already asserted), and a computed idle-ink-vs-rail contrast `>= 4.5`.
5. Add a hover leg: `link.hover()` then the computed `background-color` is no longer transparent,
   and a focus leg: `link.focus()` then `box-shadow` is not `none`.

## Project rules

- `CLAUDE.md` §0 law 11 — the vendored `sidebarMenuButtonVariants` is read-only; every override is
  a caller class (this is why `overflow-visible` exists here — do not "tidy" it away).
- `.claude/rules/tailwind.md` — no arbitrary values (`text-[14.5px]`, `p-[11px]` are failures);
  exponential easings only; colour transitions are the documented exception (mapping §I note 1).
- `.claude/rules/quality.md` — visible focus, 4.5:1 text, ≥44px pointer targets.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts` green — the
  4-link count/label/href legs and the `0.2s` `background-color` motion leg untouched and passing;
  the two geometry legs passing at their NEW design values.
- A real `elementFromPoint` scan measures the idle item's pointer target ≥44×44 at 1280 AND on the
  collapsed rail (the symmetric inset exists for exactly that reason).
- Reduced motion: computed `transition-duration` is `0s` under `emulateMedia({reducedMotion:'reduce'})`.
- 375px (inside the Sheet): same geometry, target ≥44px, no horizontal scroll.
- axe serious/critical = 0 at 1280 + 375 + Sheet-open.
- No new strings → six catalogs unchanged.

## Assumptions

- lucide-react's `LayoutDashboard`, `Users`, `Search`, `Settings` are kept as the icon set: the
  design's inline SVGs are a 4-rect grid, a two-person glyph, a magnifier and a gear — the same
  glyphs at the same 24-unit viewBox. Swapping to hand-inlined SVG would add markup with no visual
  gain and is not requested.

## Evidence

_(filled in as the task runs)_
