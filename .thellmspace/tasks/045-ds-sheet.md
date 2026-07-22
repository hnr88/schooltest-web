---
id: 045
title: Build the Sheet — side/bottom drawer with Base UI starting/ending-style slide
layer: ui
kind: implement
slice: Sheet — the mobile nav drawer and the filter overlay surface
target: src/modules/design-system/components/sheet-shell.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/showcase/sheet-demo.tsx, tests/e2e/ds-sheet.spec.ts
contract: n/a (presentation slice — the design has no sheet; geometry derived from the dialog, stated below)
design: .qa/design/screens/ds--overlays.html, .qa/design/screens/ds--dark-mode.html, .qa/design/spec/05-ds-components.md#4.1, .qa/design/spec/05-ds-components.md#RESPONSIVE-HINTS
status: TODO
depends_on: [003, 007, 008, 010, 011, 021, 044]
---

## Objective

W4's mobile nav and W8's filter overlay both need a drawer. The export has **no** sheet component
— it has no mobile layouts at all (`.qa/design/spec/05-ds-components.md`: "There are no `@media`
queries anywhere"). This task therefore derives the sheet from the dialog's own surface tokens and
says so explicitly, rather than inventing a new visual language.

## Contract

n/a. Derivation, stated so it is auditable:

- Surface = the dialog panel's tokens (`bg-card`/`bg-popover` on dark, `--shadow-dialog`), with
  the radius applied only to the two edges away from the screen edge (`--radius-2xl` = 16px).
- Scrim = the dialog scrim verbatim: `rgba(10,26,60,.45)` + `backdrop-filter:blur(2px)`,
  `z-index` above the app shell.
- Header = the dialog header verbatim: title `17px / 700 / #0E2350`, 28×28 close button at
  `border-radius:8px`, `color:#64748B`, hover `#F1F5F9`, `aria-label="Close"`.
- Widths: `side="left"|"right"` → `w-3/4 sm:max-w-sm` (the vendored primitive's own default);
  `side="bottom"` → full width, `max-height: 85svh`, content scrolls inside.

Nothing else is invented: no new colours, no new radii, no new shadows.

## Design source

Motion — the vendored `src/components/ui/sheet.tsx` already ships Base UI's
`data-starting-style` / `data-ending-style` transforms at `transition duration-200 ease-in-out`
with a `2.5rem` translate per side. Keep the mechanism; override to the design's vocabulary:
`duration-[--duration-enter]` (180ms) and `ease-out-quart`, translate distance unchanged. This is
`st-toast-in`'s translate+fade pattern applied on the horizontal axis — no new keyframe.
Reduced-motion from W0: the sheet appears/disappears with opacity only, no translate.

## Files

- `src/modules/design-system/components/sheet-shell.tsx` — **new**; composes `Sheet*` from
  `@/components/ui/sheet` (read-only) into `{ trigger, side, title, description, children,
  footer }`.
- `types/primitives.types.ts` — `SheetShellProps`, `SheetSide`.
- showcase `sheet-demo.tsx` (exists — re-point); `tests/e2e/ds-sheet.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **003** — the `.dark` token layer.
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

Within W1:

- **044** — the dialog's scrim / panel / close-button tokens, reused verbatim.
- **021** — the 28px close button.

## Steps

1. `side` prop maps to the primitive's `data-[side=…]` classes; do not re-author the transforms.
2. Bottom sheet: `max-h-[85svh]` → a W0 token; body is `overflow-y-auto` with the existing
   `scroll-region` `@utility`; the header stays pinned.
3. Focus trap, Escape-to-close and focus restore come from the primitive — assert all three.
4. Body scroll lock while open; assert the page behind does not scroll.
5. i18n title/description/close label; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11 (`sheet.tsx` read-only), law 8, law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (transform/opacity only);
  `.claude/rules/quality.md` (focus trap, Escape, restore, ≥44px close target);
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-sheet.spec.ts` asserts on `/design-system`, at **375px**:
  - opening a `left` sheet sets `data-open`; its computed `transform` is `none` when settled and
    non-identity in the `data-starting-style` frame;
  - the scrim matches the dialog's scrim colour and blur;
  - `getByRole('dialog')` has an accessible name; focus enters the sheet and `Escape` closes it,
    restoring focus to the trigger;
  - the page behind does not scroll while the sheet is open (`document.body` overflow locked);
  - a `bottom` sheet is full-width and capped at 85svh with an internal scroll.
- Motion: `transition-duration` 180ms; `0.01ms` under `reducedMotion: 'reduce'` while the sheet
  still opens and closes.
- 1280px: side sheet caps at `sm:max-w-sm`; no horizontal page scroll at either width.
- axe zero serious/critical with the sheet open; six catalogs key-identical; zero banned-pattern
  hits.
- `shell.spec.ts` and `a11y-responsive.spec.ts` (Escape closes the mobile menu) still green.

## Assumptions

- The sheet is a derivation, not a design slice — recorded here and in Evidence so no later
  reviewer mistakes it for a ported screen.

## Evidence
