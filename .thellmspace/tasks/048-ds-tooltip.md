---
id: 048
title: Rebuild the Tooltip — navy bubble, 12.5px/500, 8px offset, keyboard-reachable
layer: ui
kind: implement
slice: Tooltip
target: src/modules/design-system/components/tooltip-shell.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/showcase/overlays-section.tsx, tests/e2e/ds-tooltip.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--overlays.html, .qa/design/spec/05-ds-components.md#4.3
status: TODO
depends_on: [001, 006, 007, 008, 010, 011, 021]
---

## Objective

Icon-only controls (task 021) are used throughout the portal; every one of them needs a tooltip
that is also reachable by keyboard. Ship the export's bubble once.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §4.3 (`ds--overlays.html:31`), verbatim:

- Bubble: `background:#0E2350; color:#FFFFFF; font-size:12.5px; font-weight:500;
  padding:6px 11px; border-radius:8px; box-shadow:0 4px 12px rgba(14,35,80,.25)`.
- Content example: `Copy share link` (static copy).
- **No arrow/caret element exists in the markup.**
- The demo stacks the bubble **above** the trigger with an 8px gap
  (`flex-direction:column; gap:8px`).
- Trigger (icon button, outline variant): 36×36, `background:#FFFFFF; color:#16326E;
  border:1px solid #CBD5E1; border-radius:10px`, hover `#F7F9FC`, `aria-label="Copy link"`,
  15×15 copy glyph.
- **No animation declared** (UNKNOWN) — authored below.

## Design source

Tokens: bubble `bg-navy-900` + `text-primary-foreground`, `--font-size-caption` (12.5px)
weight 500, `--radius-sm` (8px), `--shadow-tooltip` = `0 4px 12px oklch(0.2692 0.0871 263.04 /
0.25)` (W0 adds it if absent). Offset 8px via the W0 spacing token. Dark mode: the bubble stays
navy — it is already the inverse surface, so no `.dark` override.

Motion: `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95` /
`data-closed:animate-out data-closed:fade-out-0`, `duration-[--duration-fast]` **150ms**
`ease-out-quart` (a tooltip must be faster than a dialog). Open delay 400ms, close delay 0 —
Base UI provider defaults; state them explicitly so they are not accidental.
Reduced-motion from W0.

## Files

- `src/modules/design-system/components/tooltip-shell.tsx` — **new**; composes `Tooltip*` from
  `@/components/ui/tooltip` (read-only); props `{ content, side, children }`.
- `types/primitives.types.ts` — `TooltipShellProps`.
- showcase `overlays-section.tsx`; `tests/e2e/ds-tooltip.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

Within W1:

- **021** — the icon-button trigger.

## Steps

1. A tooltip is **never** the only source of an accessible name — the trigger keeps its own
   `aria-label` (task 021 makes that a required prop), and the tooltip content is supplementary.
2. Keyboard: the tooltip must open on `focus`, not only on hover
   (`.claude/rules/quality.md` / WCAG 1.4.13); it must be dismissible with `Escape` while the
   trigger keeps focus; it must not steal focus.
3. Touch: on a coarse pointer the tooltip is not the only affordance — the showcase notes this and
   W4/W8 must not hide required information inside one.
4. No caret; 8px offset via the positioner's `sideOffset`.
5. i18n tooltip content; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11 (`tooltip.tsx` read-only), law 8, law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (opacity/transform only);
  `.claude/rules/quality.md` (WCAG 1.4.13 hoverable/dismissible/persistent);
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-tooltip.spec.ts` asserts on `/design-system`:
  - the bubble's `background-color` = resolved `--color-navy-900`, `font-size` 12.5px,
    `border-radius` 8px, `box-shadow` = `--shadow-tooltip`, and it renders no caret child;
  - `Tab` to the trigger opens the tooltip (focus, not hover) and `Escape` closes it while focus
    stays on the trigger;
  - the trigger's accessible name is present **without** the tooltip open;
  - the gap between trigger and bubble is 8px;
  - `data-open` carries a non-`none` 150ms animation; `data-closed` on close.
- Reduced motion `0.01ms`; tooltip still opens/closes.
- 375px: the bubble flips/shifts to stay in the viewport; no horizontal page scroll.
- axe zero serious/critical with a tooltip open; six catalogs key-identical; zero banned-pattern
  hits.

## Assumptions

- Open delay 400ms / close delay 0 are Base UI defaults, stated rather than tuned.
- No caret (the export has none).

## Evidence
