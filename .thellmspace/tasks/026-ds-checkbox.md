---
id: 026
title: Rebuild the Checkbox — 18px box, 5px radius, 1.5px border, white tick, disabled row
layer: ui
kind: implement
slice: Checkbox + its clickable row label
target: src/modules/design-system/components/checkbox-row.tsx, src/modules/design-system/types/choice.types.ts, src/modules/design-system/components/showcase/choice-controls.tsx, tests/e2e/ds-checkbox.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--forms.html, .qa/design/spec/04-ds-foundations.md#5.5
status: TODO
depends_on: [001, 004, 007, 010, 011, 013, 022]
---

## Objective

One checkbox, drawn exactly as `[FRM:44-61]`, used by the wizard (W7), notification preferences
(W9) and the search filter rails (W8). Wraps `@/components/ui/checkbox`; never edits it.

## Contract

n/a. `.qa/design/spec/04-ds-foundations.md` §5.5, verbatim:

- Row: `display:flex; align-items:center; gap:10px; cursor:pointer; user-select:none`.
- Box: `display:inline-grid; place-items:center; width:18px; height:18px; border-radius:5px;
  border:1.5px solid <border>; background:<bg>; transition:all .15s`.
- Tick (checked only): `<svg width=11 height=11 stroke=#FFFFFF stroke-width=3.2
  stroke-linecap=round stroke-linejoin=round>` path `M20 6 9 17l-5-5`.
- Row label: `font-size:14px; color:#0E2350`.

| state | border | background | tick | extra |
|---|---|---|---|---|
| unchecked | `#CBD5E1` | `#FFFFFF` | none | — |
| checked | `#2563EB` | `#2563EB` | white ✓ | — |
| disabled | `#CBD5E1` | `#F1F5F9` | none | **row** gets `opacity:.5; cursor:not-allowed`, label `#64748B` |
| hover / focus-visible | not specified (UNKNOWN 3) | | | authored below |

Design-time values on the board: `Shuffle question order` **checked**, `Show results immediately`
**unchecked**, third row `Disabled option`.

## Design source

Tokens: `#CBD5E1` → `border-input`; `#FFFFFF` → `bg-card`; `#2563EB` → `bg-primary` +
`border-primary`; tick `text-primary-foreground`; `#F1F5F9` → `bg-muted`; `#64748B` →
`text-muted-foreground`; `#0E2350` → `text-foreground`. Radius `--radius-xs` (5px = 0.3125rem).
Border width 1.5px — W0 must expose it as a named token (`--border-control`), never `border-[1.5px]`.

Motion: the design's `transition:all .15s` is narrowed to
`transition-[background-color,border-color] duration-150 ease-out-quart` (`transition:all` is
banned by `.claude/rules/quality.md` intent and animates layout properties); the tick itself
enters with `data-checked:animate-in data-checked:zoom-in-95 duration-150` — opacity+scale only,
compliant with `.claude/rules/tailwind.md`. Reduced-motion from W0.

Focus-visible: authored from `--ring`; keep the vendored primitive's
`focus-visible:ring-3 focus-visible:ring-ring/50` on the box.

## Files

- `src/modules/design-system/components/checkbox-row.tsx` — **new**; `{ label, description?,
  checked, onCheckedChange, disabled }`, renders `<label>` wrapping the primitive so the whole
  row is the hit target (never `<div onClick>`).
- `src/modules/design-system/types/choice.types.ts` — `CheckboxRowProps`.
- `src/modules/design-system/index.ts`, showcase `choice-controls.tsx`,
  `tests/e2e/ds-checkbox.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

Within W1:

- **022** — shares `describedBy` for the optional description line.

## Steps

1. Wrap `Checkbox` from `@/components/ui/checkbox`; forward `checked`/`onCheckedChange` so the
   component stays controlled and stateless (rules: components are dumb).
2. Row is a real `<label htmlFor>` — the 10px gap and 18px box come from tokens.
3. Disabled: `opacity-50 cursor-not-allowed` on the row **and** `disabled` on the input, so the
   pointer state and the AT state agree.
4. i18n three showcase labels; six catalogs.
5. E2E.

## Project rules

- `CLAUDE.md` law 11 (checkbox primitive read-only), law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (no `w-[18px]`, no
  `border-[1.5px]`, no `transition-all`); `.claude/rules/quality.md` (never `<div onClick>`,
  keyboard reachable, visible focus); `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-checkbox.spec.ts` asserts on `/design-system`:
  - `getByRole('checkbox', { name: 'Shuffle question order' })` is checked; clicking the **label
    text** (not the box) toggles it → proves the row is the hit target;
  - box `boundingBox()` is 18×18 and `border-radius` is 5px;
  - checked box `background-color` equals the resolved `--color-primary`; the tick is present;
  - the disabled row has `cursor: not-allowed`, `opacity: 0.5`, and the input is `disabled`;
  - `Space` toggles the focused checkbox and the focus ring is visible.
- Motion: 150ms colour transition; tick has a non-`none` `animation-name` on check; both `0.01ms`
  under `reducedMotion: 'reduce'`.
- 375px + 1280px, no horizontal overflow; hit target ≥44px via the row.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.

## Assumptions

- Hover and focus-visible are authored (UNKNOWN 3 / 1). Hover = `border-primary` at 150ms only;
  no fill change, so an unchecked box never reads as checked.

## Evidence
