---
id: 025
title: Rebuild SelectField and SelectRow — custom chevron, three sizes, listbox popup animation
layer: ui
kind: implement
slice: Select — native `appearance:none` select + the Base UI listbox wrapper
target: src/modules/design-system/components/select-field.tsx, src/modules/design-system/components/select-row.tsx, src/modules/design-system/components/select-wrappers.tsx, src/modules/design-system/types/choice.types.ts, src/modules/design-system/components/showcase/select-fields.tsx, tests/e2e/ds-select.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--forms.html, .qa/design/screens/ds--dashboard-components.html, .qa/design/screens/ds--footers.html, .qa/design/spec/04-ds-foundations.md#5.3, .qa/design/spec/05-ds-components.md#6.8,#7.1
status: TODO
depends_on: [001, 002, 004, 006, 007, 008, 010, 011, 013, 022]
---

## Objective

The export ships three select geometries (form board, invite row, footer language). `SelectField`
and `SelectRow` already exist (`.qa/intake/web-inventory.md`); re-cut them to the design and give
the Base UI popup its open/close animation, which the export never specifies but D-DESIGN-3
requires.

## Contract

n/a. Three declared geometries:

**A — forms board** `[FRM:30-35]`: `appearance:none; width:100%; box-sizing:border-box;
padding:10px 36px 10px 13px; border-radius:10px; border:1px solid #CBD5E1; font-size:14px;
color:#0E2350; background:#FFFFFF; outline:none; cursor:pointer`. Chevron 15×15
(`m6 9 6 6 6-6`), `stroke:#64748B; stroke-width:2.2`, at `right:13px; top:50%; translateY(-50%);
pointer-events:none`. **The export declares no `transition` and no `style-focus` on the select** —
unlike the text inputs.

**B — invite row** `ds--dashboard-components.html:90`: `padding:9px 30px 9px 12px;
border-radius:9px; border:1px solid #CBD5E1; font-size:13px; font-weight:600; color:#16326E`;
chevron 12×12 at `right:10px`, `stroke:#64748B; stroke-width:2.4`.

**C — footer language** `ds--footers.html:50`: `padding:7px 30px 7px 32px; border-radius:9px;
border:1px solid #223154; font-size:12.5px; font-weight:600; color:#C7D6F2; background:#16326E`;
**two** decorative SVGs — globe 13×13 at `left:11px` and chevron 12×12 at `right:10px`, both
`stroke:#8FA3C7; pointer-events:none`.

## Design source

Tokens: `border-input` (`#CBD5E1`), `text-foreground` (`#0E2350`), `bg-card`,
`text-muted-foreground` (`#64748B` chevron), `text-secondary-foreground` (`#16326E`),
`bg-navy-800` + `border-navy-700`-equivalent (`#223154` → `--color-border` dark) and
`--color-navy-body` (`#C7D6F2`) for variant C. Radii `--radius-md` (10px) and the 9px step;
type `--font-size-body-sm` / 13px `--font-size-caption-lg` / 12.5px `--font-size-caption`.

Focus: the design declares none (UNKNOWN 1). Author the same treatment as the text input —
`border-primary` + `--shadow-ring-focus` — so the control is WCAG-visible.

Motion: the Base UI `Select.Popup` open/close, using the primitive's own data attributes
(`data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95`, `data-closed:animate-out
data-closed:fade-out-0 data-closed:zoom-out-95`, `duration-150`) — this is `st-fade-in` +
`st-pop-in` expressed through `tw-animate-css`, which the repo already imports
(`src/app/globals.css:2`). No new dependency (D-DESIGN-3).

## Files

- `src/modules/design-system/components/select-field.tsx` — variants `default | compact | on-navy`.
- `src/modules/design-system/components/select-row.tsx` — the settings/list row form.
- `src/modules/design-system/components/select-wrappers.tsx` — `SelectContent` / `SelectItem`
  restyle (already the local wrapper in front of `@/components/ui/select`); add the popup
  animation classes here.
- `src/modules/design-system/types/choice.types.ts` — extend `SelectFieldProps` with `size`/`tone`.
- `src/modules/design-system/components/showcase/select-fields.tsx`, `tests/e2e/ds-select.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **002** — the hover / disabled interaction colour roles taken from the design's `style-hover`.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

Within W1:

- **022** — the field shell wrapping label / helper / error.

## Steps

1. Decide per call site: the design's `<select appearance:none>` is a **native** select (variants
   A/B/C). Use `NativeSelect*` from `@/components/ui/native-select` for those, and keep the
   Base UI `Select` only where a rich popup is needed (multi-line options, icons). Both surface
   through the same `SelectField` prop `native?: boolean` — do not ship two public components.
2. Chevron/globe are `aria-hidden` and `pointer-events-none`.
3. `padding-inline-end` reserves the chevron gutter (36px / 30px) via W0 spacing tokens.
4. Focus ring on the trigger; `data-open` rotation of the chevron 180° over 150ms
   (`transition-transform`, an allowed transform animation).
5. i18n for label, placeholder and every showcase option; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11 (`select.tsx` / `native-select.tsx` read-only), law 8, law 14.
- `.claude/rules/module-pattern.md`, `.claude/rules/tailwind.md` (animate transform/opacity only —
  the popup uses opacity+scale, compliant), `.claude/rules/i18n.md`, `.claude/rules/quality.md`
  (native select must keep its accessible name), `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-select.spec.ts` asserts on `/design-system`:
  - `getByLabel('Subject')` resolves a `<select>`; `selectOption('Science')` changes `value`;
  - computed `appearance` is `none` and `padding-inline-end` is 36px (A) / 30px (B);
  - the chevron is `aria-hidden` and does not receive pointer events
    (`elementFromPoint` over the chevron resolves the select);
  - the Base UI variant's popup carries `data-open` and a non-`none` `animation-name` on open, and
    `data-closed` on close;
  - keyboard: `ArrowDown` + `Enter` selects without a mouse.
- Motion: popup animation 150ms; `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: full-width, options readable, no horizontal overflow; 1280px 3-up.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `student-wizard-contrast.spec.ts` and `settings-tabs.spec.ts` still green (both render selects).

## Assumptions

- Variant C (footer language) reuses the existing locale switcher behaviour from
  `src/modules/i18n` — this task restyles it and must not change its routing logic.

## Evidence
