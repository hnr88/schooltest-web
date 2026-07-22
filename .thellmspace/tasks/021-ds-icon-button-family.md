---
id: 021
title: Cut the IconButton family to the export's five square sizes and three tones
layer: ui
kind: implement
slice: IconButton — 38/36/32/30/28/26px square buttons (icon-only, topbar, kebab, row action, dialog close, dismiss)
target: src/modules/design-system/components/icon-button.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/row-actions-cluster.tsx, src/modules/design-system/components/showcase/buttons-section.tsx, tests/e2e/ds-icon-button.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--buttons.html, .qa/design/screens/ds--alerts.html, .qa/design/screens/ds--cards.html, .qa/design/screens/ds--table.html, .qa/design/screens/ds--navigation.html, .qa/design/spec/04-ds-foundations.md#4.4, .qa/design/spec/05-ds-components.md#1.3,#2.4,#4.1,#5.2
status: TODO
depends_on: [001, 002, 004, 007, 010, 013, 020]
---

## Objective

The export uses six distinct square icon buttons at six sizes with three tones. Today
`icon-button.tsx` carries an ad-hoc size/tone pair. Re-cut it so every square affordance in the
mission (kebab, dismiss, dialog close, pagination chevron, bell, row actions) comes from this one
component, and delete nothing that already consumes it.

## Contract

n/a. Binding spec, verbatim from the slices:

| Use | Box | radius | idle colour | hover | cite |
|---|---|---|---|---|---|
| icon-only (outline) | 38×38 | 10px | `#16326E` on `#FFFFFF`, `1px solid #CBD5E1` | `bg #F7F9FC` | `[BTN:26]` |
| topbar bell / tooltip trigger | 36×36 | 10px | `#475569`, transparent | `bg #F1F5F9` | `ds--navigation.html:29`, `ds--overlays.html:31` |
| card kebab ("More") | 32×32 | 8px | `#64748B`, transparent | `bg #F1F5F9` | `ds--cards.html:26` |
| table row actions | 30×30 | 8px | `#64748B`, transparent | `bg #F1F5F9` | `ds--table.html:20` |
| dialog close | 28×28 | 8px | `#64748B`, transparent | `bg #F1F5F9` | `ds--overlays.html:9` |
| alert / toast dismiss | 26×26 | 7px (`--radius-chip`) | `#94A3B8`, transparent | `bg #F1F5F9`, `color #475569` | `[ALR:10,15]` |
| dark-toast dismiss | 26×26 | 7px | `#8FA3C7` | `bg #16326E` | `[ALR:44]` |

Glyph sizes: 16×16 (`stroke-width:2`) for icon-only; 17×17 for the bell; 16×16 kebab
(`fill:currentColor`, three `circle r=1.6` at cx 5/12/19); 15×15 kebab in the table row; 14×14 X
(`stroke-width:2.4`) for dialog close; 13×13 X for dismiss.

## Design source

Token mapping — every hex above via the W0 `@theme` name, never the literal:
`#16326E` → `text-secondary-foreground`; `#CBD5E1` → `border-input`; `#F7F9FC` → `bg-background`;
`#475569` → `text-body`; `#64748B` → `text-muted-foreground`; `#94A3B8` →
`text-muted-foreground-soft`; `#F1F5F9` → `bg-muted`; `#8FA3C7` → `text-toast-dismiss`;
`#16326E` hover fill on dark → `bg-navy-800`. Radii `--radius-sm` (8px), `--radius-md` (10px),
`--radius-chip` (7px).

Motion — the export declares **no** transition on any of these (`.qa/design/spec/05-ds-components.md`
"Elements that hover but do NOT transition"). Per D-DESIGN-3 motion is part of done, so author
`transition-[background-color,color] duration-150 ease-out-quart` — the same 150ms vocabulary the
export uses everywhere else, never a new duration.

## Files

- `src/modules/design-system/types/primitives.types.ts` — `IconButtonSize =
  'dismiss'|'close'|'row'|'kebab'|'topbar'|'square'`, `IconButtonTone =
  'outline'|'ghost'|'ghost-soft'|'on-navy'`.
- `src/modules/design-system/components/icon-button.tsx` — wraps
  `Button` from `@/components/ui/button` via task 020's wrapper; `aria-label` is a **required**
  prop (type-level, not runtime).
- `src/modules/design-system/components/row-actions-cluster.tsx` — re-point to the new sizes.
- `src/modules/design-system/components/showcase/buttons-section.tsx` — a row showing all six
  boxes × the four tones.
- `tests/e2e/ds-icon-button.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **002** — the hover / disabled interaction colour roles taken from the design's `style-hover`.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

Within W1:

- **020** — IconButton renders through the DS `Button`; its variant table must exist first.

## Steps

1. Type `aria-label: string` as required on `IconButtonProps` so a missing label is a tsc error.
2. Map the six boxes to `size-*` utilities that exist on the 4pt scale where possible; where the
   design is off-grid (26/30/38px) use the named W0 size tokens rather than `w-[38px]`.
3. Keep the pointer-target `after:` inset pattern from `lib/button-variants.ts` so every box
   below 44px still resolves 44px to `document.elementFromPoint` (mission-2 D22 fix — breaking it
   fails `a11y-responsive.spec.ts`).
4. Add the transition + let W0's reduced-motion block neutralise it.
5. Showcase row + i18n keys (`DesignSystem.iconButton*`) in all six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` §0 law 11 (wrap, never edit `src/components/ui/*`), law 14, law 15.
- `.claude/rules/module-pattern.md` — types in `types/primitives.types.ts`; component ≤120 lines.
- `.claude/rules/tailwind.md` — no arbitrary values; OKLCH tokens only.
- `.claude/rules/quality.md` — every icon-only control needs an accessible name; ≥44px hit target.
- `.claude/rules/i18n.md`, `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean; omitting `aria-label` is a **compile** error (prove it
  by pasting the tsc output for a scratch file, then deleting the scratch file).
- `tests/e2e/ds-icon-button.spec.ts` asserts on `/design-system`: each of the six boxes reports
  the exact `boundingBox()` (38/36/32/30/28/26 ±0.5px), the right `border-radius`, and a non-empty
  accessible name; `elementFromPoint` at the centre-±20px of each resolves the button (44px rule).
- Hover changes `background-color` over 150ms; under `reducedMotion: 'reduce'` duration is
  `0.01ms`.
- 375px + 1280px, no horizontal overflow.
- axe zero serious/critical on `/design-system`; `a11y-responsive.spec.ts` still green.
- Six catalogs key-identical.
- Zero banned-pattern hits (`any`, raw hex, `w-[`, `h-[`, `p-[`).

## Assumptions

- W0 emits named size tokens for the off-grid 26/30/38px boxes. If it did not, this task adds
  them to `@theme` in the same commit rather than using arbitrary values.

## Evidence
