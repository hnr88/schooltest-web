---
id: 043
title: Rebuild the SegmentedControl in both documented sizes (11px and 10px tracks)
layer: ui
kind: implement
slice: Segmented control / range selector
target: src/modules/design-system/components/segmented-control.tsx, src/modules/design-system/components/segmented-choice.tsx, src/modules/design-system/types/design-system.types.ts, src/modules/design-system/components/showcase/segmented-demo.tsx, tests/e2e/ds-segmented.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--tabs.html, .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/05-ds-components.md#3.2,#6.1d
status: TODO
depends_on: [001, 006, 007, 008, 010, 013, 027]
---

## Objective

The dashboard's range selector (W5) and the search sort control (W8) are this component. The
export ships it at two sizes with slightly different geometry — both are real and both are built.

## Contract

n/a. Verbatim:

**A — default** (`ds--tabs.html:16-19`):
- Track: `display:inline-flex; gap:4px; background:#F1F5F9; padding:4px; border-radius:11px`.
- Segment: `border:none; cursor:pointer; font-size:13px; font-weight:600; padding:7px 16px;
  border-radius:8px; transition:all .15s`.
- Selected → `background:#FFFFFF; color:#0E2350; box-shadow:0 1px 3px rgba(14,35,80,.12)`.
- Unselected → `background:transparent; color:#64748B; box-shadow:none`.
- Options `Week` (default), `Month`, `Year`. **No hover state declared.**

**B — compact / range** (`ds--dashboard-components.html:13-17`):
- Track: same but `border-radius:10px; margin-left:auto`.
- Segment: `font-size:12.5px; font-weight:600; padding:6px 13px; border-radius:7px`.
- Selected/unselected same colours + shadow. **No transition declared on this variant.**
- Options `30 days` (selected), `Quarter`, `Year`.

## Design source

Tokens: track `bg-muted` (`#F1F5F9`); selected `bg-card` + `text-foreground` +
`0 1px 3px oklch(0.2692 0.0871 263.04 / 0.12)` → W0 `--shadow-segment`; unselected
`text-muted-foreground`. Radii: track 11px `--radius-segment` (already in `globals.css`) / 10px
`--radius-md`; segment 8px `--radius-sm` / 7px `--radius-chip`. Type 13px
`--font-size-caption-lg` / 12.5px `--font-size-caption`.

Motion: the design's `transition:all .15s` is narrowed to
`transition-[background-color,color,box-shadow] duration-150 ease-out-quart` (`all` would animate
layout). The selected pill additionally slides: one absolutely-positioned pill that
`translateX`es to the active segment over 180ms `ease-out-quart` (transform-only). Variant B gets
the same treatment even though the export declares no transition there — consistency beats a
literal port, and the difference is recorded. Reduced-motion from W0.

## Files

- `segmented-control.tsx` — re-cut with `size: 'default' | 'compact'`; keep the existing
  `SegmentedControlOption`/`SegmentedControlSize` prop names.
- `segmented-choice.tsx` — the form-bound variant (radiogroup semantics) — align it to the same
  visual, do not fork the styling.
- `types/design-system.types.ts` — `SegmentedControlProps`, `SegmentedControlSize`.
- showcase `segmented-demo.tsx`; `tests/e2e/ds-segmented.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

Within W1:

- **027** — `SegmentedChoice` shares the roving-focus radiogroup behaviour built there.

## Steps

1. Semantics: when the control **selects a value**, it is a `radiogroup` (or `tablist` when it
   switches panels) — never a row of unlabelled buttons. Pick per variant and document which.
2. Roving tabindex from `lib/use-roving-radio.ts`; arrow keys move, `Tab` enters/exits once.
3. Sliding pill measured from the active segment's offset via ref.
4. i18n every option label (`Week`, `Month`, `Year`, `30 days`, `Quarter`); six catalogs.
5. E2E.

## Project rules

- `CLAUDE.md` law 3 (school-search / dashboard consume `SegmentedControl`), law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (no `transition-all`,
  transform/opacity for the pill); `.claude/rules/quality.md` (keyboard, visible focus,
  ≥44px targets — the 13px/7px segment is ~31px tall, so the `after:` pointer-inset pattern from
  `lib/button-variants.ts` applies here too); `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-segmented.spec.ts` asserts on `/design-system`:
  - variant A: track radius 11px, `bg` = resolved `--color-muted`, segment padding `7px 16px`,
    selected segment `bg` = `--color-card` with the `--shadow-segment` box-shadow;
  - variant B: track radius 10px, segment 12.5px at `6px 13px`, segment radius 7px;
  - the selected option exposes the right ARIA state (`aria-checked`/`aria-selected="true"`) and
    arrow keys move selection;
  - `elementFromPoint` at ±20px of a segment centre resolves that segment (44px target).
- Motion: pill `transition-property` includes `transform` at 180ms; colour/shadow at 150ms;
  `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: the track scrolls inside its own container if the options overflow; page does not scroll
  horizontally; 1280px both variants inline.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `school-search-presentation.spec.ts` and `design-system.spec.ts` segmented assertions green.

## Assumptions

- Variant B gains the transition the export omits, for family consistency; recorded in Evidence.

## Evidence
