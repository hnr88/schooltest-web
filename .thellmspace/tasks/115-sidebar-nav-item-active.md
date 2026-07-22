---
id: 115
title: Nav item ACTIVE state — the design's navy #0E2350 slab, 600 weight, white ink, and the e2e re-baseline that keeps it honest
layer: ui
kind: build
slice: The rail nav item's active/current-page state, including its focus ring on the navy slab
target: src/modules/shell/components/SidebarNavItem.tsx, tests/e2e/shell.spec.ts
contract: n/a — pure presentation; design spec quoted below
design: .qa/design/screens/portal--detached-sidebar.html:6, .qa/design/spec/01-portal-dashboard.md#12-detached-sidebar--portal--detached-sidebarhtml231
status: TODO
depends_on: ["114"]
---

## Objective

Move the rail's active state from the current solid **blue** `#2563EB` pill (a mission-2 decision
taken from `ds--navigation.html`) to the detached portal design's solid **navy** `#0E2350` slab
with white ink at weight 600 — and re-baseline the e2e assertions that pin the old colour, without
weakening a single one.

## Contract

n/a. `.qa/design/spec/01-portal-dashboard.md` §1.2 nav-state table (`Parent Portal.dc.html:797-801`):

| State | font-weight | background | color |
|---|---|---|---|
| **active** | `600` | `#0E2350` | `#FFFFFF` |
| inactive | `500` | `transparent` | `#7C8698` |

Geometry does not change between states (same `padding:11px 14px`, same `border-radius:12px`, same
`font-size:14.5px`) — only weight, background and colour move.

**Design↔design conflict, resolved and recorded:** `ds--navigation.html:5-18` (the design SYSTEM's
navigation card) gives the active item `background:#2563EB; color:#FFFFFF`. `portal--detached-sidebar.html`
(the PORTAL shell this wave targets) gives `#0E2350`. The wave brief names the detached sidebar as
the target composition, and `D-DESIGN-1` makes the cited slice the authority, so **`#0E2350` wins
for the parent rail**. Recorded here so a later reviewer sees a decision, not a drift.

**PRESERVED BEHAVIOUR:** `isNavItemActive()` (exact match for `/dashboard`, prefix match for the
rest) is NOT touched — the active *logic* already works and `shell.spec.ts` asserts it in two
places (`overview` active on `/dashboard`, `myChildren` not). The `data-active` attribute must keep
appearing on the active `<a>`. The active `NavCountBadge` must stay legible on the new slab.

## Design source

| Property | Design value | Token / utility |
|---|---|---|
| active background | `#0E2350` | `--color-navy-900` (`oklch(0.2692 0.0871 263.0388)`, exact hex match) → `data-active:bg-navy-900` |
| active ink | `#FFFFFF` | `--color-sidebar-primary-foreground` → `data-active:text-sidebar-primary-foreground` |
| active weight | `600` | `data-active:font-semibold` |
| active hover | not declared | hold the slab: `data-active:hover:bg-navy-900 data-active:hover:text-sidebar-primary-foreground` |
| count badge on the slab | not declared | invert: `bg-card text-navy-900` (white fill, navy ink — the existing inversion idiom, now navy-keyed) |

Contrast, measured: white on `#0E2350` = **15.27:1** (was 5.17:1 on `#2563EB`) — a strict
improvement, and the assertion that guards it (`activeRatio >= 4.5`) is left in place unchanged.

**Focus on the slab** (authored — the export has no focus state): a 35%-alpha brand ring on a navy
slab is nearly invisible, so the active item gets `focus-visible:ring-2 focus-visible:ring-sidebar-ring
focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar` — the offset lifts the ring onto the
white card where it reads. Idle items keep 114's ring (no offset).

Motion: unchanged from 114 — `transition-colors duration-200 ease-out-expo motion-reduce:transition-none`.
Do NOT animate the slab in with a transform; the design flips state instantly and the rules allow
only transform/opacity, so the colour transition is the whole of it.

## Files

- `src/modules/shell/components/SidebarNavItem.tsx` — the `data-active:*` fragment of
  `NAV_ITEM_CLASSES`, `ACTIVE_BADGE_CLASSES`, and the block comment (rewrite: cite
  `portal--detached-sidebar.html:6` + `Parent Portal.dc.html:797-801`, record the ds↔portal
  conflict and the 15.27:1 reading).
- `tests/e2e/shell.spec.ts` — re-baseline only (below).

## Depends on

- **114** — the shared geometry/idle classes must already be the design's; otherwise the active
  legs would be re-baselined twice.

## Steps

1. Replace `data-active:bg-sidebar-primary` / `data-active:text-sidebar-primary-foreground` /
   the two `data-active:hover:*` classes with the navy set above. Keep `data-active:font-semibold`.
2. Update `ACTIVE_BADGE_CLASSES` to `bg-card text-navy-900`.
3. Add the offset focus ring under `data-active:`.
4. `pnpm tsc --noEmit && pnpm lint`.
5. Re-baseline `shell.spec.ts` — **strengthen, never delete**:
   - the two class-name regex legs (`/data-active:bg-sidebar-primary/`,
     `/data-active:text-sidebar-primary-foreground/`) are REPLACED by a computed-colour leg: read
     the active item's `backgroundColor`, convert via the spec's existing canvas helper, and assert
     each channel is within ±2 of `rgb(14, 35, 80)`. A class name can be renamed; a measured colour
     cannot be faked.
   - `toHaveAttribute('data-active', /.*/)`, `idle` not active, `font-weight: 600`, `idleBg ===
     'rgba(0, 0, 0, 0)'`, `activeBg !== idleBg`, `activeRatio >= 4.5`, and the `0.2s` /
     `background-color` motion leg all stay **exactly as they are**.
   - the geometry legs stay at 114's new values (`12px`, `11px 14px`).
6. Add a leg: with the active item focused via keyboard, its computed `box-shadow` is not `none`
   and differs from the idle item's focused shadow (proving the offset variant applies).

## Project rules

- `.claude/rules/testing.md` + `D-VERIFY-1` — proof is a real Playwright run against the running
  app; re-baselining an assertion is only legitimate when the new value is the design's and the
  assertion gets no weaker. Deleting a leg is a failure.
- `.claude/rules/tailwind.md` — OKLCH tokens only; `bg-[#0E2350]` is a failure.
- `.claude/rules/quality.md` — AA contrast, visible focus.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts tests/e2e/dashboard.spec.ts`
  green against the running app; the re-baselined file has the SAME number of assertions or more.
- Measured: active background = `rgb(14, 35, 80)` ±2 per channel; active text/background ratio
  ≥ 15:1 (assert ≥ 4.5, log the real number into Evidence).
- Navigating `/dashboard` → `/dashboard/children` moves the slab (assert `data-active` present on
  My children and absent on Overview after the click) — the pre-existing behaviour, re-proven.
- Reduced motion: `transition-duration: 0s`.
- 375px (Sheet open): the active slab renders with the same computed background, ≥44px target,
  axe serious/critical = 0.
- No new strings → six catalogs unchanged.

## Assumptions

- `--color-sidebar-primary-foreground` resolves to the design's `#FFFFFF`. If W0 tinted it per
  `04-ds-foundations.md` §B's footnote (`oklch(0.9930 0.0020 258)`), use the W0 token and record
  the new measured ratio — do NOT write `text-white` or `#fff`.

## Evidence

_(filled in as the task runs)_
