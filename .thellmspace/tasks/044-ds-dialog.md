---
id: 044
title: Rebuild the Dialog — blurred navy scrim (st-fade-in) and a pop-in panel, focus-trapped
layer: ui
kind: implement
slice: Dialog / Modal + AlertDialog confirm
target: src/modules/design-system/components/dialog-shell.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/showcase/dialog-demo.tsx, tests/e2e/ds-dialog.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--overlays.html, .qa/design/screens/ds--dark-mode.html, .qa/design/spec/05-ds-components.md#4.1
status: TODO
depends_on: [001, 003, 005, 006, 007, 008, 010, 011, 020, 021]
---

## Objective

Every destructive confirm in the mission (archive a child in W6, remove a saved search in W8)
uses this shell. Build it once with the export's live geometry and the two keyframes the design
itself declares, expressed through the Base UI `data-open` / `data-closed` attributes the
vendored primitive already emits.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §4.1, verbatim.

**Scrim** (`ds--dark-mode.html:34`):
```
position:fixed; inset:0; background:rgba(10,26,60,.45);
backdrop-filter:blur(2px); display:grid; place-items:center;
z-index:90; animation:st-fade-in .18s ease
```
**Live panel** (`:35`):
```
background:#FFFFFF; border-radius:16px;
box-shadow:0 28px 64px rgba(14,35,80,.3);
padding:24px; width:380px; max-width:calc(100vw - 48px); box-sizing:border-box;
animation:st-pop-in .18s ease
```
(the static specimen is `max-width:360px` with `--shadow-xl`; the **live** values are
authoritative because they are what the design actually renders.)

**Internals:** header `display:flex; align-items:flex-start; justify-content:space-between`;
title `17px / 700 / #0E2350`; close button 28×28 radius 8px, transparent, `color:#64748B`,
hover `#F1F5F9`, `aria-label="Close"`, 14×14 X at `stroke-width:2.4`. Body
`margin:8px 0 0; font-size:14px; line-height:1.55; color:#64748B`. Footer
`display:flex; justify-content:flex-end; gap:10px; margin-top:20px`; Cancel = outline
(`#FFFFFF / #16326E / 1px #CBD5E1`, `8px 15px`, radius 9px, hover `#F7F9FC`); confirm =
destructive (`#DC2626 / #FFFFFF`, `9px 16px`, radius 9px, hover `#B91C1C`).

Behaviour: clicking the scrim closes; clicking inside stops propagation. **No exit animation
exists in the export** (UNKNOWN) — one is authored.

## Design source

Tokens: scrim `--color-navy-950 / 0.45` (`rgba(10,26,60,.45)`), `backdrop-blur-[2px]` → W0
`--blur-scrim`; panel `bg-card`, `--radius-2xl` (16px), `--shadow-dialog`
(`0 28px 64px oklch(0.2692 0.0871 263.04 / 0.30)`); title 17px token weight 700
`text-foreground`; body `--font-size-body-sm` (14px) `--leading-snug` 1.55
`text-muted-foreground`. Dark: panel `bg-popover` `#162240`, per §8.7.

Motion (D-DESIGN-3, from the design's own keyframes):
- scrim `data-open:animate-in data-open:fade-in-0` / `data-closed:animate-out
  data-closed:fade-out-0`, `duration-[--duration-enter]` = **180ms**, `ease-out-quart`
  (= `st-fade-in`).
- panel `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95` /
  `data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95`, 180ms
  (= `st-pop-in`, whose `scale(.96)` is the `zoom-*-95` step).
Both neutralised by W0's reduced-motion block; the dialog must still open and close.

## Files

- `src/modules/design-system/components/dialog-shell.tsx` — **new**; composes `Dialog*` from
  `@/components/ui/dialog` (read-only) into `{ trigger, title, description, footer }`, plus a
  `ConfirmDialog` preset over `@/components/ui/alert-dialog` for destructive confirms.
- `types/primitives.types.ts` — `DialogShellProps`, `ConfirmDialogProps`.
- showcase `dialog-demo.tsx` (exists — re-point); `tests/e2e/ds-dialog.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **005** — the eight published type steps.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

Within W1:

- **020** — the Cancel / Confirm buttons.
- **021** — the 28px close button.

## Steps

1. Read `src/components/ui/dialog.tsx` — it already ships `data-open:animate-in
   data-open:fade-in-0 data-open:zoom-in-95 …` at `duration-100` and a `bg-black/10` scrim.
   Override the scrim colour/blur and the duration **from the wrapper's className**, never by
   editing that file.
2. Focus: the primitive traps focus and restores it on close; assert both rather than trusting.
   Escape closes (`.claude/rules/quality.md`).
3. Title/description wired through `DialogTitle`/`DialogDescription` so `aria-labelledby` /
   `aria-describedby` are real.
4. `max-width: calc(100vw - 48px)` — expressed as a W0 token, not an arbitrary class.
5. i18n title/body/buttons; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11 (`dialog.tsx`, `alert-dialog.tsx` read-only), law 8, law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (animate opacity/transform only —
  fade + zoom comply; `backdrop-filter` is a static property, not animated);
  `.claude/rules/quality.md` (focus trap, Escape, restore focus, no `<div onClick>` scrim —
  use the primitive's backdrop); `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-dialog.spec.ts` asserts on `/design-system`:
  - opening sets `data-open` on both scrim and panel; the panel's `animation-name` is non-`none`
    with `animation-duration: 180ms`;
  - scrim `background-color` = `--color-navy-950` at 0.45 alpha and `backdrop-filter` contains
    `blur(2px)`;
  - panel is 380px wide at 1280px and `min(380, 100vw − 48)` at 375px;
  - `getByRole('dialog')` has an accessible name from the title and description from the body;
  - focus is inside the panel after open, cycles within it on `Tab`, and returns to the trigger
    after `Escape`;
  - clicking the scrim closes; clicking the panel does not;
  - closing sets `data-closed` and the node is removed after the exit animation (assert both the
    intermediate `data-closed` state and the final removal).
- Reduced motion: `animation-duration` 0.01ms and the dialog still opens/closes and traps focus.
- 375px: panel never exceeds `100vw − 48px`, body scrolls inside the panel if tall, page does not
  scroll horizontally.
- axe zero serious/critical with the dialog open; six catalogs key-identical; zero banned-pattern
  hits.

## Assumptions

- The exit animation is authored (design UNKNOWN: "no exit animation exists anywhere").
- Live values (380px, `0 28px 64px / .3`) beat the static specimen (360px, `--shadow-xl`).

## Evidence
