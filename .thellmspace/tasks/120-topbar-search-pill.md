---
id: 120
title: Search pill — the design's 240×44 white capsule with a 16px magnifier, on the well
layer: ui
kind: build
slice: The shell's search entry point in the top row
target: src/modules/shell/components/AppTopbar.tsx, src/modules/design-system/components/topbar-search-trigger.tsx
contract: n/a — pure presentation; design spec quoted below
design: .qa/design/screens/portal--main.html:13-16, .qa/design/spec/01-portal-dashboard.md#2-dashboard--top-bar-greeting-row
status: TODO
depends_on: ["118"]
---

## Objective

Re-skin the top row's search control to the design's floating capsule — 240×44, fully round, white
on the well, one-layer navy shadow, 16px magnifier — keeping it a real navigation control to
`SEARCH_HREF` (`/dashboard/search`) rather than turning it into a dead input.

## Contract

n/a. `.qa/design/spec/01-portal-dashboard.md` §2, verbatim (`portal--main.html:13-16`):

```
Search pill: display:flex; align-items:center; gap:10px; background:#FFFFFF;
border-radius:999px; height:44px; padding:0 18px; width:240px;
box-shadow:0 1px 2px rgba(14,35,80,.05)
Magnifier SVG 16×16, stroke:#7C8698, stroke-width:2, stroke-linecap:round
<input placeholder="Search"> — border:none; outline:none; background:none; font-size:14px;
flex:1; color:#0E2350; placeholder colour #9AA6B8 from global CSS
```

**PRESERVED BEHAVIOUR:** the control keeps `href={SEARCH_HREF}`, the accessible name
`Shell.topbar.searchLabel` and the placeholder text `Shell.topbar.searchPlaceholder`; it stays
hidden below `lg` (`max-lg:hidden`) — the mobile search entry is the rail's Search destination, and
`tests/e2e/unified-search.spec.ts` reaches `/dashboard/search` by that route.

## Design source

| Property | Design value | Token / utility |
|---|---|---|
| width | `240px` | `w-60` |
| height | `44px` | `h-11` |
| radius | `999px` | `rounded-full` |
| surface | `#FFFFFF` | `--color-card` → `bg-card` |
| shadow | `0 1px 2px rgba(14,35,80,.05)` | `--shadow-pill` (task 110) → `shadow-pill` |
| padding | `0 18px` | `px-4.5` |
| gap | `10px` | `gap-2.5` |
| icon | 16×16, stroke-width 2 | `size-4` + `strokeWidth={2}` |
| icon ink | `#7C8698` → **REJECTED** | `text-muted-foreground` (`#64748B`) — see below |
| label size | `14px` | `text-sm` |
| label ink | `#0E2350` | `text-foreground` |
| placeholder ink | `#9AA6B8` → **REJECTED** | `text-muted-foreground` (`#64748B`) |

**Authored a11y corrections (two, both measured):** on the pill's white surface `#7C8698` is
**3.67:1** and `#9AA6B8` is **2.46:1**. Placeholder text is text and must clear AA, so both become
`--color-muted-foreground` (`#64748B`, **4.76:1** on white). The design also sets `outline:none` on
this input (`01-portal-dashboard.md` UNKNOWNS §2 flags it) — the app does the opposite: the trigger
carries `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`, which replaces
the ring rather than removing it.

**Border:** the current build adds `border border-input` to give the pill an edge against the white
topbar. On the new `#EEF1F6` well a white pill has a **1.13:1** surface step of its own plus the
shadow, so the border is dropped — the reason it existed is gone. Record that.

Motion: `transition-shadow duration-200 ease-out-expo motion-reduce:transition-none`, hover lifts to
`--shadow-md`. Shadow is neither transform nor opacity, so keep it to the shadow token swap only
(the documented colour/shadow exception, `04-ds-foundations.md` mapping §I note 1) — no scale, no
translate, so nothing reflows.

## Files

- `src/modules/design-system/components/topbar-search-trigger.tsx` — the component's own class
  string (it is a design-system component this module owns; `src/components/ui/*` is untouched).
- `src/modules/shell/components/AppTopbar.tsx` — drop the `border border-input` override, keep
  `max-lg:hidden`.

## Depends on

- **118** — the row must be transparent over the well first, otherwise "white pill on white bar"
  is still the composition and the border removal reads as a regression.

## Steps

1. Read `topbar-search-trigger.tsx` and note every consumer (`rg -n "TopbarSearchTrigger" src/`) —
   if any surface other than `AppTopbar` renders it, restyle without breaking that surface, or
   scope the new look with a variant prop.
2. Apply the geometry table; set the icon to `size-4 strokeWidth={2}`.
3. `pnpm tsc --noEmit && pnpm lint`.
4. Extend `shell.spec.ts` (desktop describe): the trigger computes `width: 240px`,
   `height: 44px`, `border-radius` ≥ 22px, `box-shadow` non-`none`, `border-width: 0px`; its
   placeholder text's computed colour has a ≥4.5 ratio against the pill's background; clicking it
   navigates to `/dashboard/search`.

## Project rules

- `CLAUDE.md` §0 law 11 — do not edit `src/components/ui/*`; this component lives in
  `src/modules/design-system/components/`, which the module owns.
- `.claude/rules/tailwind.md` — no arbitrary values; `w-60`/`h-11`/`px-4.5` are real scale steps.
- `.claude/rules/quality.md` — visible focus ring is mandatory even though the design sets
  `outline:none`; labelled controls; ≥44px target (the pill is exactly 44px tall).
- `.claude/rules/i18n.md` — placeholder and label come from `t()`, never a literal.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/unified-search.spec.ts tests/e2e/shell-a11y.spec.ts`
  green — the search destination still reachable from the pill AND from the rail link.
- New legs pass (240×44, round, shadow, no border, ≥4.5 placeholder contrast, navigation works).
- Keyboard: `Tab` focuses the pill and the computed `box-shadow`/`outline` shows a visible ring
  (assert it differs from the unfocused reading).
- Motion: `transition-duration` `0.2s`, `0s` under `emulateMedia({ reducedMotion: 'reduce' })`.
- 375px: the pill is hidden (`toBeHidden()`), the row still has no horizontal scroll, and
  `/dashboard/search` is still reachable via the rail's Search link inside the Sheet.
- axe serious/critical = 0 at 1280 + 375.
- No new strings → six catalogs unchanged.

## Assumptions

- The design draws a live `<input>`; the app ships a link-shaped trigger to the real unified-search
  screen. That is existing, working behaviour (`D28`/unified search) and is preserved — a second
  search input in the shell would be a duplicate surface, not a feature.

## Evidence

_(filled in as the task runs)_
