---
id: 029
title: Build the Slider control — 120px track, 16px thumb, fixed-width value readout
layer: ui
kind: implement
slice: Slider + its numeric readout, as used by the settings list
target: src/modules/design-system/components/slider-control.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/showcase/choice-controls.tsx, tests/e2e/ds-slider.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/05-ds-components.md#6.11b
status: TODO
depends_on: [001, 004, 007, 008, 010, 013, 028]
---

## Objective

The only range control in the export. Ship it once so W9's settings surface has it, wrapping
`@/components/ui/slider`.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §6.11b (`ds--dashboard-components.html:137-140`),
verbatim:

- Cluster: `display:flex; align-items:center; gap:10px; flex:none`.
- Track: `position:relative; width:120px; height:6px; border-radius:999px; background:#EEF2F7`.
- Fill: `width:60%; height:100%; border-radius:999px; background:#2563EB`.
- Thumb: `position:absolute; left:60%; top:50%; transform:translate(-50%,-50%); width:16px;
  height:16px; border-radius:50%; background:#FFFFFF; border:2px solid #2563EB;
  box-shadow:0 1px 4px rgba(14,35,80,.2); cursor:grab`.
- Value readout: `font-size:13px; font-weight:700; color:#0E2350; width:36px` — the **fixed
  width is load-bearing**: it stops the track shifting as digits change.

Row context (§6.11): title `Passing threshold`, description `Scores below this show as at-risk`,
value `60%`.

No hover, focus, disabled or transition is declared (UNKNOWNS 2, 3, 4).

## Design source

Tokens: `#EEF2F7` → `bg-rule` (`--color-rule`); `#2563EB` → `bg-primary` / `border-primary`;
thumb `bg-card`; shadow `0 1px 4px oklch(0.2692 0.0871 263.04 / 0.20)` → W0 `--shadow-thumb`
(add it if W0 did not, in this commit, as an OKLCH `@theme` entry with the hex recorded as
provenance per D-DESIGN-2); readout `--font-size-caption-lg` (13px) weight 700 `text-foreground`,
fixed `w-9` (36px). Track height 6px, radius `--radius-full`.

Motion: thumb `transition-transform duration-150 ease-out-quart` on `active:scale-110`
(transform-only, compliant); fill width is **not** transitioned while dragging (it would lag the
pointer) but animates over 150ms on keyboard step. Reduced-motion from W0.

Focus-visible: authored from `--ring` on the thumb — the design specifies none, and a range input
with no visible focus fails WCAG 2.2 AA.

## Files

- `src/modules/design-system/components/slider-control.tsx` — **new**; wraps `Slider` from
  `@/components/ui/slider`; props `{ label, value, onValueChange, min, max, step, formatValue }`.
- `src/modules/design-system/types/primitives.types.ts` — `SliderControlProps`.
- `src/modules/design-system/index.ts`, showcase `choice-controls.tsx`,
  `tests/e2e/ds-slider.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

Within W1:

- **028** — mounts inside the same settings row (`ToggleRow`'s sibling geometry).

## Steps

1. Wrap the primitive; the thumb keeps `role="slider"` with `aria-valuenow/min/max` and an
   accessible name from the row title (`aria-labelledby`).
2. `formatValue` renders the readout (`60%`); the readout is `aria-hidden` because the slider
   already exposes `aria-valuetext`.
3. Keyboard: `ArrowLeft/Right` step, `Home/End` jump — from the primitive; assert it.
4. i18n title/description/`aria-valuetext` pattern; six catalogs; use ICU for the percent.
5. E2E.

## Project rules

- `CLAUDE.md` law 11 (slider primitive read-only), law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (no `w-[120px]`, no `left-[60%]`
  — the fill/thumb position is an inline `style` **percentage**, which is data, not a Tailwind
  arbitrary value; document that distinction in the diff); `.claude/rules/quality.md`;
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-slider.spec.ts` asserts on `/design-system`:
  - `getByRole('slider', { name: 'Passing threshold' })` reports `aria-valuenow="60"`,
    `aria-valuemin="0"`, `aria-valuemax="100"`;
  - track height 6px, thumb 16×16 with a 2px `border-color` = resolved `--color-primary`;
  - the readout element's `width` is exactly 36px at values `5%`, `60%` and `100%` (no shift);
  - `ArrowRight` increments `aria-valuenow` and moves the thumb's `boundingBox().x`;
  - the focused thumb has a visible ring.
- Motion: thumb `active` scale transition 150ms; `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: cluster does not overflow the settings row (`flex-none` + wrap); 1280px unchanged.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.

## Assumptions

- The design's `60%` is showcase data, not a live metric — the DS story renders a local state
  value. Wiring a real threshold is out of scope here (and `.qa/CONTRACTS.md` has no endpoint for
  it; if W9 needs persistence it must be contracted first, never faked).

## Evidence
