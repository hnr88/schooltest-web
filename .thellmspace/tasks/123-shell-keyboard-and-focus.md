---
id: 123
title: Shell keyboard path — Ctrl+B, a complete visible focus ring set, and a proven Sheet focus trap
layer: a11y
kind: implement
slice: Keyboard operation of the whole shell: tab order, focus visibility, the rail shortcut, and the mobile drawer's focus trap
target: src/modules/shell/components/*.tsx, tests/e2e/shell.spec.ts, tests/e2e/shell-a11y.spec.ts
contract: n/a — WCAG 2.2 AA + the design's explicit focus gap
design: .qa/design/spec/01-portal-dashboard.md#unknowns, .qa/design/spec/04-ds-foundations.md#unknowns
status: TODO
depends_on: ["115", "117", "118", "122"]
---

## Objective

Close the design's single largest accessibility hole across the whole re-skinned shell: it declares
**no focus state anywhere** and actively removes the browser's. Author one consistent ring from the
design's own `--ring` token, prove every shell control is keyboard-reachable in a sensible order,
prove the mobile Sheet traps focus and restores it, and prove Ctrl+B still works.

## Contract

n/a. The two design specs state the gap in their own words:

- `01-portal-dashboard.md` UNKNOWNS: "**Focus states.** No `:focus`, `:focus-visible`, or `outline`
  declaration exists in any of the four files read. `input { outline:none }` is set inline on both
  search inputs, which removes the default ring with nothing replacing it."
- `04-ds-foundations.md` UNKNOWNS §1: "`tokens.css` defines `--ring: rgba(37,99,235,0.35)` but
  nothing in the markup consumes it."

`.claude/rules/quality.md` requires: "keyboard reachable; visible focus rings; modals trap focus and
close on Escape; never `<div onClick>`."

**PRESERVED BEHAVIOUR:** `Control+B` toggles the desktop rail (vendored
`SIDEBAR_KEYBOARD_SHORTCUT`, asserted in `shell.spec.ts:173`); `Escape` closes the Sheet
(`shell.spec.ts:265`); `a11y-auth.spec.ts`'s forward-focus-order test on `/dashboard/children`
must still pass unchanged.

## Design source

One ring, everywhere, built from the design's token:

```
focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
```
`--color-ring` = `oklch(0.5461 0.2152 262.8809 / 35%)` (= `rgba(37,99,235,.35)`, `tokens.css:47`).
Inside the rail use `ring-sidebar-ring` (same value, `--sidebar-ring`). On the navy active slab add
`focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar` so the ring lands on the white card
(115 already specifies this — this task verifies it, does not re-author it).

Where the ring must exist (audit list — every one is asserted):

| # | Control | Owner task |
|---|---|---|
| 1 | rail logo link | 112 |
| 2-5 | the four nav links (idle + active) | 114 / 115 |
| 6 | rail user card trigger | 117 |
| 7 | user-menu items (Settings, Sign out) | vendored `DropdownMenuItem` — verify, do not restyle |
| 8 | rail toggle (`Shell.topbar.toggleNav`) | 118 / 124 |
| 9 | breadcrumb links | 119 |
| 10 | search pill | 120 |
| 11 | notification bell | 121 |

Ring geometry check: a 2px ring at 35% alpha on white measures **~1.8:1** against the surface,
below the 3:1 WCAG 2.2 SC 1.4.11 non-text minimum. Add `--shadow-ring-focus`
(`0 0 0 3px oklch(0.5461 0.2152 262.88 / 0.16)`, mapping §F) UNDER the ring so the composite edge
reads, OR raise the ring to the solid `--color-primary` at 2px (**5.17:1** on white). **Pick the
solid-primary ring**, record the measured 1.8:1 that forced the choice, and apply it uniformly —
a translucent ring that fails 1.4.11 is not a focus indicator.

Motion: focus rings never animate (instant, per WCAG's no-flash guidance). The Sheet's focus
restoration is behavioural, not animated.

## Files

- `src/modules/shell/components/*.tsx` — ring class alignment only, on the controls listed above.
- `tests/e2e/shell.spec.ts` — a new `test()` inside the existing describes (file stays under the
  200-line rule; if it would exceed, split into `tests/e2e/shell-keyboard.spec.ts` and say so).
- `tests/e2e/shell-a11y.spec.ts` — extend, do not replace.

## Depends on

- **115, 117, 118, 122** — every control must be in its final place before the keyboard path
  through them is asserted; otherwise the order assertion is written against a shell that changes
  underneath it.

## Steps

1. Walk the real app with the keyboard at 1280 and write down the actual tab order. Expected:
   logo → Overview → My children → Search → Settings → user card → rail toggle → breadcrumb link(s)
   → search pill → bell → page content.
2. Fix any control that is unreachable, reachable but ringless, or reachable out of order. Do not
   add `tabIndex` to make order "nicer" — fix DOM order instead.
3. Verify `Control+B` still toggles and that focus is not lost when the rail collapses (the
   focused nav item becomes icon-only; it must stay focused — assert `document.activeElement`).
4. Verify the Sheet at 375: opening moves focus into the panel, `Tab` cycles inside it (assert that
   after N tabs `document.activeElement` is still inside the dialog), `Escape` closes it AND
   returns focus to the toggle button that opened it.
5. `pnpm tsc --noEmit && pnpm lint`.

## Project rules

- `.claude/rules/quality.md` — WCAG AA: keyboard reachable, visible focus, focus trap + Escape,
  never `<div onClick>`.
- `CLAUDE.md` §0 law 11 — the trap itself belongs to the vendored Sheet; verify it, never re-implement it.
- `.claude/rules/testing.md` + `D-VERIFY-1` — proof is a real Playwright run, not a code reading.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- A real Playwright keyboard walk at 1280 asserts all 11 controls above are reached by `Tab` in the
  recorded order, and that each one's focused computed style differs from its unfocused style
  (`box-shadow` or `outline` non-`none`).
- Measured: the focus indicator's colour against its surface is **≥ 3:1** (WCAG 2.2 SC 1.4.11);
  log the real number.
- `Control+B` collapses and re-expands the rail (existing legs) AND `document.activeElement` is
  unchanged across the toggle.
- At 375: opening the Sheet moves focus inside it; 12 consecutive `Tab` presses never leave the
  dialog; `Escape` closes it and focus returns to the toggle (assert by element identity).
- `pnpm exec playwright test tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts tests/e2e/a11y-auth.spec.ts`
  green — including the pre-existing forward-focus-order test on `/dashboard/children`.
- axe serious/critical = 0 at 1280, 375, and 375-Sheet-open.
- No new strings → six catalogs unchanged.

## Assumptions

- The vendored `Sheet` (Radix/Base UI) already implements the trap and the restore; this task
  proves it under the re-skinned contents rather than adding a second mechanism.

## Evidence

_(filled in as the task runs: the recorded tab order, the measured ring ratio, the focus-restore
element identity check, e2e output)_
