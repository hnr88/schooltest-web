---
id: 047
title: Rebuild the Popover — 14px radius, 250px cap, readonly input + copy row
layer: ui
kind: implement
slice: Popover surface + its share/copy content pattern
target: src/modules/design-system/components/popover-shell.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/showcase/popover-demo.tsx, tests/e2e/ds-popover.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--overlays.html, .qa/design/spec/05-ds-components.md#4.4
status: TODO
depends_on: [001, 003, 006, 007, 008, 010, 011, 020, 022]
---

## Objective

The anchored panel behind the dashboard's info affordances (W5) and the search filter popovers
(W8). One shell, exact geometry, with the anchored positioning the export could not express.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §4.4 (`ds--overlays.html:38-45`), verbatim:

- Surface: `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:14px;
  box-shadow:0 8px 24px rgba(14,35,80,.12); padding:18px; width:100%; max-width:250px;
  box-sizing:border-box`. Radius **14px** — one step tighter than a card (16px), looser than the
  dropdown (12px). That difference is deliberate; keep it.
- Title: `font-size:14.5px; font-weight:700; color:#0E2350`.
- Body: `margin:5px 0 0; font-size:13px; line-height:1.5; color:#64748B`.
- Row: `display:flex; gap:8px; margin-top:14px`.
  - Readonly input: `flex:1; min-width:0; box-sizing:border-box; padding:8px 11px;
    border-radius:9px; border:1px solid #CBD5E1; font-size:12.5px; color:#64748B;
    background:#F8FAFD; outline:none`, `readOnly`.
  - Copy button: `background:#2563EB; color:#FFFFFF; border:none; font-size:12.5px;
    font-weight:600; padding:8px 13px; border-radius:9px; flex:none`, hover `#1D4ED8`.
- **No animation declared** (UNKNOWN) — authored below.
- **No arrow/caret element exists in the markup** — do not add one.

## Design source

Tokens: `bg-popover`, `border-border`, `--radius-xl` (14px), `--shadow-lg`; title 14.5px token
weight 700 `text-foreground`; body `--font-size-caption-lg` (13px) `--leading-body` 1.5
`text-muted-foreground`; readonly input `bg-surface-subtle` (`#F8FAFD`), `border-input`,
`--font-size-caption` (12.5px); copy button = task 020's `default` variant at the 9px radius.
Dark: `bg-popover` `#162240`.

Motion: Base UI `data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95` /
`data-closed:animate-out …zoom-out-95` at 180ms `ease-out-quart` — the design's own `st-fade-in`
+ `st-pop-in`. Side-aware slide (`data-[side=top]:slide-in-from-bottom-1` etc.) is a 4px translate
only. Reduced-motion from W0.

## Files

- `src/modules/design-system/components/popover-shell.tsx` — **new**; composes `Popover*` from
  `@/components/ui/popover` (read-only) into `{ trigger, title, description, children, align,
  side }`.
- `types/primitives.types.ts` — `PopoverShellProps`.
- showcase `popover-demo.tsx` (exists — re-point, keep the share/copy example);
  `tests/e2e/ds-popover.spec.ts`.

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

- **020** — the copy button.
- **022** — the readonly input's field tokens.

## Steps

1. Anchoring, collision flipping and `side`/`align` come from Base UI's positioner — never
   hand-computed offsets, never `window` at module scope.
2. The readonly input is a real `<input readOnly>` with a label (sr-only if the design shows
   none) so the value is announced.
3. The copy action writes to the clipboard and confirms with a toast (task 034), not with a
   silent state change.
4. `Escape` closes and restores focus to the trigger; the popover is dismissed on outside click.
5. i18n title/body/copy label/copy-confirmation; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11 (`popover.tsx` read-only), law 8, law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (opacity/transform only);
  `.claude/rules/quality.md` (labelled input, Escape, focus restore);
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-popover.spec.ts` asserts on `/design-system`:
  - surface `border-radius: 14px` (explicitly different from the dropdown's 12px and the card's
    16px — assert all three in one test so a future refactor cannot silently merge them),
    `max-width: 250px`, `padding: 18px`, `--shadow-lg`;
  - no caret/arrow element is rendered;
  - the readonly input has an accessible name and `readonly` is true;
  - clicking Copy writes the value to the clipboard (`navigator.clipboard.readText()` with the
    permission granted in the spec) and shows the confirmation toast;
  - `data-open` on open with a non-`none` 180ms animation, `data-closed` on close;
  - `Escape` closes and focus returns to the trigger.
- Reduced motion `0.01ms`; popover still opens/closes.
- 375px: the popover flips/shifts to stay in the viewport and never causes horizontal page scroll;
  1280px anchored.
- axe zero serious/critical with the popover open; six catalogs key-identical; zero banned-pattern
  hits.

## Assumptions

- No caret is added (the export has none). If W5/W8 need one, it is a new task, not a silent
  addition here.

## Evidence
