---
id: 024
title: Build the Textarea field — 3 rows, vertical resize, 1.5 line-height, focus + error rings
layer: ui
kind: implement
slice: Textarea inside the field shell
target: src/modules/design-system/components/textarea-field.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/showcase/forms-section.tsx, tests/e2e/ds-textarea.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--forms.html, .qa/design/spec/04-ds-foundations.md#5.4
status: TODO
depends_on: [001, 004, 006, 007, 008, 010, 013, 022]
---

## Objective

The wizard (W7) and settings (W9) both need a multi-line field. Ship it once, on the same field
shell as the text input, with the design's exact geometry.

## Contract

n/a. `.qa/design/spec/04-ds-foundations.md` §5.4 `[FRM:39]`, verbatim:

```
rows="3";
width:100%; box-sizing:border-box; padding:10px 13px; border-radius:10px;
border:1px solid #CBD5E1; font-size:14px; color:#0E2350; background:#FFFFFF;
outline:none; resize:vertical; line-height:1.5;
transition:border-color .15s, box-shadow .15s
```
`style-focus` identical to the text input: `border-color:#2563EB; box-shadow:0 0 0 3px
rgba(37,99,235,.16)`. Placeholder `Optional notes shown before the test starts…`. Label
`Instructions` at `13.5px / 600 / #0E2350`.

No error, disabled or hover state is declared for the textarea
(`.qa/design/spec/04-ds-foundations.md` UNKNOWNS 3, 4, 6) — they are **derived from the text
input** (task 022) so the family stays consistent, and that derivation is stated in Evidence
rather than invented silently.

## Design source

Tokens: `border-input`, `text-foreground`, `bg-card`, `--radius-md` (10px),
`--font-size-body-sm` (14px), `--font-size-label` (13.5px), `--shadow-ring-focus`,
`--shadow-ring-error`, `leading-[1.5]` → the W0 `--leading-body-sm` token (never an arbitrary
value). `resize-y` only — horizontal resize would break the 375px layout.

Motion: `transition-[border-color,box-shadow] duration-150 ease-out-quart`; reduced-motion from W0.

## Files

- `src/modules/design-system/components/textarea-field.tsx` — **new**; wraps `Textarea` from
  `@/components/ui/textarea` (read-only) inside `FieldShell`.
- `src/modules/design-system/types/primitives.types.ts` — `TextareaFieldProps`.
- `src/modules/design-system/index.ts` — export.
- `src/modules/design-system/components/showcase/forms-section.tsx`.
- `tests/e2e/ds-textarea.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

Within W1:

- **022** — the field shell (label / required / helper / error / disabled) it mounts into.

## Steps

1. Wrap `Textarea`; default `rows={3}`; `resize-y`; `min-h` derived from 3 rows × 1.5 line-height
   + 20px padding — expressed with the W0 token, not `min-h-[86px]`.
2. Reuse `FieldShell` for label/helper/error and `describedBy` for `aria-describedby`.
3. Error path mirrors 022: `aria-invalid="true"` + persistent `--shadow-ring-error`.
4. i18n keys `DesignSystem.textareaLabel|Placeholder|Helper` × 6 catalogs.
5. E2E.

## Project rules

- `CLAUDE.md` law 11 (textarea primitive read-only), law 14, law 15.
- `.claude/rules/module-pattern.md` (≤120 lines), `.claude/rules/tailwind.md` (no arbitrary
  values), `.claude/rules/i18n.md`, `.claude/rules/quality.md`, `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-textarea.spec.ts` asserts: `getByLabel('Instructions')` resolves the textarea;
  `rows === 3`; computed `resize` is `vertical`; `line-height` is 1.5×font-size; focus ring
  matches `--shadow-ring-focus`; the error variant is `aria-invalid` and rings while blurred.
- Motion 150ms; `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: `width:100%`, no horizontal scroll even with a 200-character unbroken string
  (assert `scrollWidth <= clientWidth` on `documentElement`).
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.

## Assumptions

- Error/disabled/hover for the textarea are inherited from the text input by design-family
  consistency; the export does not specify them (UNKNOWNS 3/4/6).

## Evidence
