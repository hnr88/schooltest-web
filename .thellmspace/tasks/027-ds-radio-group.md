---
id: 027
title: Rebuild the RadioGroup — 18px ring, 8px dot, roving focus, disabled state
layer: ui
kind: implement
slice: Radio group + its clickable rows
target: src/modules/design-system/components/radio-row.tsx, src/modules/design-system/lib/use-roving-radio.ts, src/modules/design-system/types/choice.types.ts, src/modules/design-system/components/showcase/choice-controls.tsx, tests/e2e/ds-radio.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--forms.html, .qa/design/spec/04-ds-foundations.md#5.6
status: TODO
depends_on: [001, 004, 010, 011, 013, 022, 026]
---

## Objective

The single-choice control behind the wizard's question-type and guardian steps (W7) and the
notification cadence rows (W9). Drawn exactly as `[FRM:63-73]`, wrapping
`@/components/ui/radio-group`, reusing the existing `lib/use-roving-radio.ts` helper rather than
re-implementing keyboard traversal.

## Contract

n/a. `.qa/design/spec/04-ds-foundations.md` §5.6, verbatim:

- Row identical to the checkbox row: `display:flex; align-items:center; gap:10px; cursor:pointer;
  user-select:none`.
- Ring: `display:inline-grid; place-items:center; width:18px; height:18px; border-radius:50%;
  border:1.5px solid <border>; transition:all .15s`.
- Dot (**always rendered**, colour switches): `width:8px; height:8px; border-radius:50%;
  background:<dot>; transition:all .15s`.

| state | ring border | dot background |
|---|---|---|
| unselected | `#CBD5E1` | `transparent` |
| selected | `#2563EB` | `#2563EB` |
| disabled / hover / focus-visible | not specified (UNKNOWNS 3, 4) |

Design-time values: `Multiple choice` selected, `Open answer` unselected.

## Design source

Tokens: `#CBD5E1` → `border-input`; `#2563EB` → `border-primary` / `bg-primary`; label
`text-foreground` at `--font-size-body-sm` (14px). Ring/dot sizes 18px / 8px; border width 1.5px
via W0's `--border-control` token (never `border-[1.5px]`).

Motion: the dot is `transition-[background-color] duration-150 ease-out-quart` plus a
`data-checked:animate-in data-checked:zoom-in-50 duration-150` scale-in — scale + opacity only.
Ring border colour transitions at 150ms. Reduced-motion from W0.

Focus-visible: the vendored primitive's `focus-visible:ring-3 focus-visible:ring-ring/50` stays
on the ring; the design declares none (UNKNOWN 1).

## Files

- `src/modules/design-system/components/radio-row.tsx` — **new**; `RadioRowGroup` +
  `RadioRow`; wraps `RadioGroup`/`RadioGroupItem` from `@/components/ui/radio-group`.
- `src/modules/design-system/lib/use-roving-radio.ts` — reuse as-is; extend only if the
  disabled-skip case is missing.
- `src/modules/design-system/types/choice.types.ts` — `RadioRowProps`, `RadioRowGroupProps`.
- `src/modules/design-system/index.ts`, showcase `choice-controls.tsx`,
  `tests/e2e/ds-radio.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

Within W1:

- **026** — the row geometry (10px gap, label type, disabled treatment) is shared; build it once.
- **022** — `describedBy` for the optional description line.

## Steps

1. Group is a real `role="radiogroup"` with an accessible name from a visible label or the
   field shell's legend — never an unnamed div.
2. Each row is a `<label>` wrapping the item; the dot is a child span so it can animate
   independently of the ring.
3. Keyboard: arrow keys move selection within the group and skip disabled rows; `Tab` enters/exits
   the group once (roving tabindex) — this is what `use-roving-radio.ts` already does.
4. i18n both showcase labels; six catalogs.
5. E2E.

## Project rules

- `CLAUDE.md` law 11 (radio-group primitive read-only), law 14, law 15.
- `.claude/rules/module-pattern.md` (hook stays in `lib/`, not inlined), `.claude/rules/tailwind.md`
  (no arbitrary sizes, no `transition-all`), `.claude/rules/quality.md` (radiogroup naming,
  keyboard, visible focus), `.claude/rules/i18n.md`, `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-radio.spec.ts` asserts on `/design-system`:
  - `getByRole('radiogroup')` has an accessible name; `getByRole('radio', { name: 'Multiple
    choice' })` is checked and `Open answer` is not;
  - ring `boundingBox()` 18×18, `border-radius: 50%`; dot 8×8;
  - selected dot `background-color` equals resolved `--color-primary`; unselected dot is
    `rgba(0,0,0,0)`;
  - `ArrowDown` from the checked radio moves selection and skips any `disabled` row;
  - clicking the row label selects it.
- Motion: dot animation non-`none` on select; `0.01ms` under `reducedMotion: 'reduce'`.
- 375px + 1280px; row hit target ≥44px.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `053-wizard-controls.spec.ts` still green.

## Assumptions

- Disabled radio styling is derived from the checkbox's disabled row (UNKNOWN 4) — the export
  specifies none. Recorded in Evidence.

## Evidence
