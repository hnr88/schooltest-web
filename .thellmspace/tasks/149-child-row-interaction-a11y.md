---
id: 149
title: Child-row interaction states — hover, visible focus ring, keyboard traversal, contrast
layer: a11y
kind: implement
slice: The interaction layer the design omits on the "My children" rows
target: src/modules/dashboard/components/DashboardChildRow.tsx
contract: n/a (a11y)
design: .qa/design/spec/01-portal-dashboard.md#UNKNOWNS #11.3 · .qa/design/screens/portal--main.html:66
status: TODO
depends_on: ["145", "146", "147"]
---

## Objective
Make every child row reachable, operable and visible under keyboard and pointer. The design ships
none of this and cannot be followed here.

## Contract
n/a. The governing findings, quoted:
- `.qa/PLAN.md` finding 2: "**The design has no focus states at all** and explicitly sets
  `outline:none` on both search inputs. WCAG 2.2 AA and `.claude/rules/quality.md` both require
  visible focus. Focus rings are therefore authored from the design's own `--ring` token. Fixing the
  markup, never suppressing the rule."
- `.qa/design/spec/01-portal-dashboard.md` §5: "**No hover, focus, selected or disabled state is
  declared on the row.**"
- §UNKNOWNS: "Hover state for sidebar nav items, **'My children' rows**, school cards,
  recommendation rows, and 'Coming up' rows. None declared."

## Design source
- **Focus ring**, authored from `--ring` = `oklch(0.5461 0.2152 262.8809 / 35%)` (globals.css:241):
  `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
  focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-panel`.
  `rounded-panel` = 16px so the ring hugs the row rather than the full 24px card corner.
  The ring must be ≥3:1 against BOTH the card background and the row hover background
  (WCAG 2.2 SC 1.4.11) — measure both, and if the 35%-alpha ring fails, use `ring-blue-600` (the
  solid `#2563EB`, 4.62:1 on white) and record the substitution.
- **Hover**: `hover:bg-surface-well/60` with
  `transition-colors duration-150 ease-out-expo motion-reduce:transition-none` (from 145). Hover is
  a pointer affordance only — nothing appears on hover that is not present without it.
- **Active/pressed**: `active:bg-surface-well` (no transform — a row that jumps under the cursor
  reads as broken at this density).
- **Keyboard traversal**: rows are `<Link>`s, so `Tab` order is DOM order top→bottom. Nothing inside
  a row is focusable (avatar, ticks, pill and chevron are all `aria-hidden` or plain text), so each
  child costs exactly one tab stop. `Enter` activates. No `tabindex` above 0 anywhere.
- **Accessible name**: `Dashboard.children.openChild` = `"Open {name}'s progress"` (from 145) —
  because the row's visible text is a name plus decorative data, the link's computed name must be a
  sentence a screen-reader user can act on.
- **Touch target**: the row is `py-5` + a 44px avatar ⇒ ≥ 84px tall, comfortably over the 44×44
  minimum (WCAG 2.5.8). At 375px after the 157 reflow it stays ≥ 44px — assert it.
- **Contrast**: name `#0E2350` on `#FFFFFF` = 14.7:1 ✓; meta `--color-muted-foreground` (`#64748B`)
  on white = 4.76:1 ✓; tick label `--color-slate-400` (`#94A3B8`) on white = 2.85:1 ✗ for text —
  this is why the tick labels are `aria-hidden` decoration behind a real `aria-label` (146), and it
  must stay that way. Do not "fix" the contrast by darkening the design's tick labels; do not expose
  them to AT.

## Files
- EDIT `src/modules/dashboard/components/DashboardChildRow.tsx` — the state classes and the
  accessible name.

## Depends on
- **145**, **146**, **147** — the complete row.

## Steps
1. Add focus-visible/hover/active classes.
2. Measure the ring's contrast against card and hover backgrounds; substitute if it fails.
3. Verify one tab stop per row and that nothing inside a row is focusable.

## Project rules
- `.claude/rules/quality.md` — visible focus rings, keyboard reachable, never `<div onClick>`,
  no nested interactive inside a link.
- `.claude/rules/tailwind.md` — animate transform/opacity only; `motion-reduce:` variant required.
- WCAG 2.2 AA: 1.4.3 contrast, 1.4.11 non-text contrast, 2.4.7 focus visible, 2.5.8 target size.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright keyboard: from the "See details" link, `Tab` lands on row 1, then row 2, …; the number
  of tab stops inside `[data-slot="dashboard-profile-roster"]` equals `1 + children.length`.
- Focused row has a non-zero computed `box-shadow` (or `outline-width`) that is absent when focused
  by mouse click (i.e. `:focus-visible`, not `:focus`).
- Ring contrast measured against the card background ≥ 3:1, recorded in Evidence.
- `Enter` on a focused row navigates to `/dashboard/children/<that documentId>`.
- Accessible name: `getByRole('link', { name: /Open .*'s progress/ })` count equals
  `children.length`.
- Row height ≥ 44px at 1280px and at 375px.
- `page.emulateMedia({ reducedMotion: 'reduce' })` ⇒ row `transition-duration: 0s`.
- axe with `withTags(['wcag2a','wcag2aa','wcag22aa'])` on `/dashboard`: zero serious/critical.
- Zero banned-pattern hits.

## Assumptions
- `focus-visible` behaviour is the browser's; no polyfill is added.

## Evidence
<filled in as the task runs>
