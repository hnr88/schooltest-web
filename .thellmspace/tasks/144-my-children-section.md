---
id: 144
title: Build the "My children" section — header, "See details" link, 24px list card
layer: ui
kind: build
slice: The "My children" section frame (design §5), without rows
target: src/modules/dashboard/components/DashboardChildrenPanel.tsx
contract: n/a (presentation)
design: .qa/design/screens/portal--main.html:59-64 · .qa/design/spec/01-portal-dashboard.md#5
status: TODO
depends_on: ["131"]
---

## Objective
The full-width section between the hero grid and the note grid: a section heading with a trailing
link, over a white 24px card whose rows (145-149) supply their own padding.

## Contract
n/a. Quoted design, `portal--main.html:60,64`:
> header: `display:flex; align-items:baseline; justify-content:space-between; margin-bottom:14px`
> list card: `background:#FFFFFF; border-radius:24px; padding:6px 28px;
> box-shadow:0 1px 2px rgba(14,35,80,.04)`

## Design source
- Section header row → `mb-3.5 flex items-baseline justify-between` (`mb-3.5` = 14px ✓).
  - `<h2>` **"My children"** — `19px / 600 / letter-spacing -0.01em / #0E2350`
    → `text-h4 font-semibold tracking-tight text-navy-900`. `--text-h4` = 1.125rem (18px) vs the
    design's 19px — 1px delta, accepted over a new token. Key `Dashboard.children.title`.
  - Action **"See details →"** — `13.5px / 500 / #7C8698`, `style-hover="color:#2563EB"`, handler
    `goKids` → `text-body-sm font-medium text-muted-foreground transition-colors duration-150
    ease-out-expo hover:text-blue-600 motion-reduce:transition-none`.
    `--text-body-sm` = 0.84375rem (13.5px) ✓ exact; `--color-blue-600` = `oklch(0.5461 0.2152
    262.8809)` (`#2563EB`) ✓ exact.
    **It must be a real `<Link>` to `/dashboard/children`** from `@/i18n/routing`'s locale-aware
    navigation — never a `<div onClick>` (`.claude/rules/quality.md`). The `→` is a decorative
    glyph: put it in a `aria-hidden` span so the accessible name is just "See details".
    Focus: the design declares none (PLAN finding 2); author
    `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm`.
- List card → `rounded-portal bg-card px-7 py-1.5 shadow-sm` (`px-7` = 28px ✓, `py-1.5` = 6px ✓).
  Spec §5 note: "the small vertical padding (`6px`) — rows supply their own `20px` top/bottom
  padding". Do not add `py` to the card to compensate.
- `data-slot="dashboard-profile-roster"` on the card. **This slot name is deliberate and is
  preserved from the current implementation** — `tests/e2e/dashboard.spec.ts` asserts
  `[data-slot="dashboard-profile-roster"] a[href^="/dashboard/children/"]` survives a reload, and
  `roster.locator('a[href="/dashboard/children"]')` on mobile. Keeping the name keeps three
  functional regression assertions green through the redesign.
- Section element: `<section aria-labelledby="dashboard-children-title">` with the `h2` carrying
  that id — semantic landmark per `.claude/rules/quality.md`.
- 375px: header stays a two-item baseline row (both items are short); card `px-5`.

## Files
- CREATE `src/modules/dashboard/components/DashboardChildrenPanel.tsx` — header + card + `children`.
- EDIT `DashboardScreen` — mount between the two grids.
- i18n: `Dashboard.children.title`, `Dashboard.children.seeDetails`.

## Depends on
- **131** — `rounded-portal` and the section stack.

## Steps
1. Build the section, heading, link and card.
2. Confirm the legacy `data-slot` is on the card, not the section.
3. Six-catalog keys.

## Project rules
- `.claude/rules/quality.md` — semantic `<section>` + `aria-labelledby`; internal nav via `<Link>`;
  visible focus.
- `.claude/rules/i18n.md` — locale-aware `Link` from `next-intl/navigation`, never a bare `<a>`.
- `.claude/rules/tailwind.md` — token colours, no arbitrary values.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `[data-slot="dashboard-profile-roster"]` is visible; it contains
  `a[href="/dashboard/children"]`; clicking it lands on `/dashboard/children` and
  `[data-surface="children-roster"]` is visible (the existing mobile assertion, preserved).
- Computed: card `border-radius: 24px`; `h2` `font-size: 18px`, `font-weight: 600`.
- Hover: the link's colour changes to the blue token on `hover` and back — asserted by computed
  style before/after `hover()`. With `reducedMotion: 'reduce'` its `transition-duration` is `0s`.
- Keyboard: `Tab` reaches the link and `focus-visible` yields a non-zero ring.
- axe clean; heading order h1→h2 unbroken; six catalogs key-identical.

## Assumptions
- The `→` glyph is decorative in every locale.

## Evidence
<filled in as the task runs>
