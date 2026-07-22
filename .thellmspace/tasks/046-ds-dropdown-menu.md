---
id: 046
title: Rebuild the DropdownMenu — 200px surface, 8px items, destructive item, separator
layer: ui
kind: implement
slice: DropdownMenu (row actions, user menu, kebab menus)
target: src/modules/design-system/components/menu.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/showcase/dropdown-demo.tsx, tests/e2e/ds-dropdown.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--overlays.html, .qa/design/spec/05-ds-components.md#4.2
status: TODO
depends_on: [001, 003, 006, 007, 008, 010, 011, 021]
---

## Objective

The row-actions kebab (W6 results table), the sidebar user menu (W4) and the search sort menu (W8)
all open this surface. `components/menu.tsx` already wraps the primitive; re-cut it to the export.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §4.2 (`ds--overlays.html:20-26`), verbatim:

- Surface: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:12px;
  box-shadow:0 8px 24px rgba(14,35,80,.12); padding:6px; width:200px`.
- Item: `display:flex; align-items:center; gap:10px; width:100%; background:none; border:none;
  text-align:left; font-size:13.5px; font-weight:500; color:#0E2350; padding:9px 10px;
  border-radius:8px; cursor:pointer`; hover `background:#F1F5F9`. Leading 14×14 icon
  `stroke:#64748B; stroke-width:2`.
- Destructive item: same box, `color:#DC2626`, icon `stroke:currentColor`, hover
  `background:#FEF2F2`.
- Separator: `height:1px; background:#EEF2F7; margin:5px 8px`.
- Items in order: `Edit test`, `Duplicate`, `Share by email`, separator, `Delete`.
- **No open/close animation is declared** (UNKNOWN) — one is authored below.

## Design source

Tokens: surface `bg-popover` + `border-border` + `--radius-lg` (12px) + `--shadow-lg`
(`0 8px 24px oklch(0.2692 0.0871 263.04 / 0.12)`); item `--font-size-label` (13.5px) weight 500
`text-popover-foreground`, radius `--radius-sm` (8px), hover `bg-muted`; destructive
`text-destructive` + hover `--color-destructive-tint` (`#FEF2F2` — a W0 addition, the palest
destructive step); separator `bg-rule` (`#EEF2F7`). Width 200px via a W0 token.
Dark: `bg-popover` = `#162240` per §8.7.

Motion: Base UI `data-open` / `data-closed` — `data-open:animate-in data-open:fade-in-0
data-open:zoom-in-95`, `data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95`,
`duration-[--duration-enter]` 180ms `ease-out-quart` — i.e. `st-fade-in` + `st-pop-in` again, no
new keyframe. Item hover `transition-[background-color] duration-150`. Reduced-motion from W0.

## Files

- `src/modules/design-system/components/menu.tsx` — re-cut `DropdownMenuContent`,
  `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuCheckboxItem`,
  `DropdownMenuRadioItem`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent` (all already exist
  here). Add a `variant="destructive"` item.
- `types/primitives.types.ts` — `MenuItemVariant`.
- showcase `dropdown-demo.tsx` (exists — re-point); `tests/e2e/ds-dropdown.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

Within W1:

- **021** — the kebab trigger.

## Steps

1. Keep the primitive's `role="menu"/"menuitem"` semantics and typeahead; do not re-author them.
2. Destructive item must also be distinguishable without colour — it keeps a trash icon
   (`.claude/rules/quality.md`: never colour alone).
3. Positioning/collision handling comes from Base UI's positioner — do not hand-position.
4. Every item is a real focusable control; `Escape` closes and restores focus to the trigger.
5. i18n item labels; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11 (`dropdown-menu.tsx` read-only), law 8, law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (opacity/transform only);
  `.claude/rules/quality.md`; `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-dropdown.spec.ts` asserts on `/design-system`:
  - the surface is 200px wide, 12px radius, `--shadow-lg`, with 6px padding;
  - items are 13.5px/500 at 9px/10px padding and 8px radius; hover swaps to `--color-muted`
    over 150ms;
  - the destructive item is `--color-destructive` and hovers to the tint;
  - `getByRole('menu')` and 4 `menuitem`s exist; `ArrowDown` moves focus; `Enter` activates;
    `Escape` closes and focus returns to the kebab;
  - open sets `data-open` with a non-`none` `animation-name` at 180ms; close sets `data-closed`.
- Reduced motion: `0.01ms`, menu still opens/closes.
- 375px: the menu stays inside the viewport (collision-flipped) and never causes page horizontal
  scroll; 1280px anchored to the trigger.
- axe zero serious/critical with the menu open; six catalogs key-identical; zero banned-pattern
  hits.
- `unified-search-states.spec.ts` and `shell.spec.ts` still green.

## Assumptions

- The open/close animation is authored (export declares none) and reuses the dialog's keyframes.
- `#FEF2F2` becomes a W0 token (`--color-destructive-tint`) in this commit if W0 did not emit it.

## Evidence
