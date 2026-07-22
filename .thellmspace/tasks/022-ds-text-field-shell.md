---
id: 022
title: Rebuild the text Field shell — label, required marker, helper, inline error, disabled
layer: ui
kind: implement
slice: Text input + its field chrome (label / required / helper / inline error / disabled)
target: src/modules/design-system/components/field-shell.tsx, src/modules/design-system/components/text-field.tsx, src/modules/design-system/types/choice.types.ts, src/modules/design-system/components/showcase/forms-section.tsx, tests/e2e/ds-text-field.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--forms.html, .qa/design/spec/04-ds-foundations.md#5.1
status: TODO
depends_on: [001, 004, 006, 007, 008, 010, 013]
---

## Objective

Every form in the mission (wizard, settings, auth, invite) hangs off one field shell. Rebuild it
to `[FRM:6-19]` exactly, including the persistent error ring the design specifies (which is *not*
a focus-only shadow) and the disabled treatment that also greys the label.

## Contract

n/a. `.qa/design/spec/04-ds-foundations.md` §5.1, verbatim:

| state | declaration |
|---|---|
| default `[FRM:8]` | `width:100%; box-sizing:border-box; padding:10px 13px; border-radius:10px; border:1px solid #CBD5E1; font-size:14px; color:#0E2350; background:#FFFFFF; outline:none; transition:border-color .15s, box-shadow .15s` |
| placeholder | `color:#94A3B8` |
| focus `[FRM:8]` | `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` |
| error `[FRM:13]` | `border:1px solid #DC2626; box-shadow:0 0 0 3px rgba(220,38,38,.10)` — **persistent**, present without focus |
| disabled `[FRM:17,18]` | `border:1px solid #E3E8F0; color:#94A3B8; background:#F1F5F9; cursor:not-allowed`; the **label also drops to `#94A3B8`** |
| hover | not specified — do not invent one |

Chrome: field wrapper `display:flex; flex-direction:column; gap:7px` `[FRM:6]`. Label
`13.5px / 600 / #0E2350` `[FRM:7]`. Required marker: a trailing `<span style="color:#DC2626">*</span>`
after a space `[FRM:12]`. Helper `12.5px / #94A3B8` `[FRM:9,19]`. Inline error `[FRM:14]`:
`inline-flex; align-items:center; gap:6px; font-size:12.5px; font-weight:500; color:#DC2626`,
preceded by a 13×13 lucide `alert-circle` at `stroke-width:2.2`.

## Design source

Token map: `#CBD5E1` → `border-input`; `#0E2350` → `text-foreground`; `#FFFFFF` → `bg-card`;
`#94A3B8` → `text-muted-foreground-soft`; `#2563EB` → `border-primary` + ring
`--shadow-ring-focus` = `0 0 0 3px oklch(0.5461 0.2152 262.88 / 0.16)`; `#DC2626` →
`border-destructive` / `text-destructive` + `--shadow-ring-error` =
`0 0 0 3px oklch(0.5771 0.2152 27.33 / 0.10)`; `#E3E8F0` → `border-border`; `#F1F5F9` →
`bg-muted`. Sizes: `--font-size-label` (13.5px), `--font-size-caption` (12.5px),
`--font-size-body-sm` (14px), `--radius-md` (10px), gap `7px`, padding `10px 13px`.

Motion: `transition-[border-color,box-shadow] duration-150 ease-out-quart` (the design's
`transition:border-color .15s, box-shadow .15s`, upgraded to an exponential easing per
`.claude/rules/tailwind.md` §I.2 documented exception); neutralised by W0's reduced-motion block.

## Files

- `src/modules/design-system/components/field-shell.tsx` — extend the existing shell: it already
  owns `describedBy`; add `required`, `error`, `disabled` and the marker/helper/error slots.
- `src/modules/design-system/components/text-field.tsx` — **new**; wraps `Input` from
  `@/components/ui/input` (read-only) inside `FieldShell`.
- `src/modules/design-system/types/choice.types.ts` — `FieldShellProps` gains `required?`,
  `error?`, `disabled?`; add `TextFieldProps`.
- `src/modules/design-system/index.ts` — export `TextField` + its props type.
- `src/modules/design-system/components/showcase/forms-section.tsx` — Block A of `[FRM:5]`.
- `tests/e2e/ds-text-field.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

## Steps

1. Wire a11y first: `label[for]` ↔ `input[id]`; helper and error ids joined into
   `aria-describedby` through the existing `describedBy()` helper; error state sets
   `aria-invalid="true"` on the input (this is what drives the vendored primitive's
   `aria-invalid:border-destructive aria-invalid:ring-3` classes — reuse them, do not re-author).
2. Required: `required` on the input **and** the visual `*`; the `*` is `aria-hidden` because the
   input already advertises `required` to AT.
3. Disabled: `disabled` on the input; the label gets
   `has-[+_*_input:disabled]`-style styling or an explicit `disabled` prop — no `<div onClick>`,
   no duplicated state.
4. Error ring must be visible **without focus** — assert this in the spec.
5. i18n every string; the showcase copy is the design's (`Test name`, `Visible to students on the
   cover page.`, `Enter a valid email address.`, `Disabled — assigned by your school.`).
6. E2E.

## Project rules

- `CLAUDE.md` §0 law 11 (`src/components/ui/input.tsx` is read-only), law 8, law 14, law 15.
- `.claude/rules/module-pattern.md` — component ≤120 lines; props types in `types/`.
- `.claude/rules/tailwind.md` — no arbitrary values, OKLCH only.
- `.claude/rules/quality.md` — labelled inputs, visible focus, 4.5:1 (`#94A3B8` helper on white is
  2.8:1 → helper text must use `--color-muted-foreground` `#64748B` (4.6:1) for anything the user
  must read, and `#94A3B8` only for decorative placeholders; record the substitution in Evidence).
- `.claude/rules/i18n.md`, `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-text-field.spec.ts` asserts on `/design-system`:
  - `getByLabel('Test name')` resolves the input (label association proven, not assumed);
  - focusing it produces `box-shadow` matching the resolved `--shadow-ring-focus` and
    `border-color` = resolved `--color-primary`;
  - the error field has `aria-invalid="true"`, a non-`none` `box-shadow` **while blurred**, and
    its `aria-describedby` resolves to the visible error text;
  - the disabled field has `cursor: not-allowed`, `background-color` = resolved `--color-muted`,
    and its label colour equals the disabled label token.
- Motion: `transition-duration` is `150ms`; `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: the field is `width:100%` and does not overflow; 1280px: 3-up grid per `[FRM:5]`.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.

## Assumptions

- The existing `FieldShell` + `describedBy` stay the API (`.qa/intake/web-inventory.md` records
  them as already exported) — this task extends them rather than adding a parallel shell.

## Evidence
