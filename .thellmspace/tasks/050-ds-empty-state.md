---
id: 050
title: Rebuild the EmptyState — 52px tinted icon tile, 280px measure, primary CTA
layer: ui
kind: implement
slice: EmptyState (in-card) + EmptyStateHero (full-panel)
target: src/modules/design-system/components/empty-state.tsx, src/modules/design-system/components/empty-state-hero.tsx, src/modules/design-system/types/design-system.types.ts, src/modules/design-system/components/showcase/data-section.tsx, tests/e2e/ds-empty-state.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--navigation.html, .qa/design/spec/05-ds-components.md#5.4
status: TODO
depends_on: [001, 006, 007, 010, 011, 020, 035]
---

## Objective

`.qa/PLAN.md` records that the current UI "mostly lacks" loading/empty/error states and that every
screen needs all three. This is the empty one — built once, used by children (W6), notifications
(W9), search (W8) and the dashboard (W5).

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §5.4 (`ds--navigation.html:44-52`), verbatim:

- Card: base shell at `padding:18px 22px`; group label `Empty state`.
- Body: `display:flex; flex-direction:column; align-items:center; gap:12px;
  padding:26px 0 14px; text-align:center`.
- Icon tile: `display:inline-grid; place-items:center; width:52px; height:52px;
  border-radius:16px; background:#EFF5FF`; 22×22 glyph `stroke:#2563EB; stroke-width:2`.
- Title: `font-size:15px; font-weight:600; color:#0E2350`.
- Description: `font-size:13.5px; color:#64748B; max-width:280px`.
- CTA: `inline-flex; align-items:center; gap:7px; background:#2563EB; color:#FFFFFF; border:none;
  font-size:13.5px; font-weight:600; padding:9px 16px; border-radius:9px; margin-top:4px`;
  hover `#1D4ED8`; leading 14×14 plus at `stroke-width:2.4`.

## Design source

Tokens: tile `bg-secondary` + `text-primary` glyph, `--radius-2xl` (16px), 52px box; title 15px
token weight 600 `text-foreground`; description `--font-size-label` (13.5px)
`text-muted-foreground` capped at a 280px measure token; CTA = task 020's `default` variant at the
9px radius step. Tile tone is a prop (`brand | accent | neutral`) so a "no results" empty differs
from a "nothing yet" empty.

Motion: the whole block enters with `--animate-fade-in` (180ms, opacity) plus a 4px translateY —
an empty state usually replaces a skeleton, and an instant swap reads as a glitch. The icon tile
plays `st-pop-in` 60ms later. Reduced-motion from W0 makes both instant.

## Files

- `empty-state.tsx` — in-card variant; keep the existing `EmptyStateTone` prop name.
- `empty-state-hero.tsx` — the full-panel variant used when the empty state *is* the page.
- `types/design-system.types.ts` — `EmptyStateProps` (+ `action`, `tone`, `icon`).
- showcase `data-section.tsx`; `tests/e2e/ds-empty-state.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

Within W1:

- **035** — the card shell.
- **020** — the CTA button.

## Steps

1. The title is a real heading at the level the surrounding page needs — take `headingLevel` as a
   prop rather than hard-coding `<h3>`, so page heading order stays valid
   (`.claude/rules/quality.md`: one `<h1>`, ordered headings).
2. The icon is `aria-hidden`; the CTA is a real button/link with a real destination.
3. `action` is optional — a "no results for this filter" empty has no CTA, and the component must
   not render an empty button slot.
4. i18n title/description/CTA come from the caller; the showcase supplies its own keys in six
   catalogs.
5. E2E.

## Project rules

- `CLAUDE.md` law 3 (children/notifications/search consume `EmptyState`), law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md`; `.claude/rules/quality.md`
  (heading order, contrast, `next/image` if an illustration is ever used);
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-empty-state.spec.ts` asserts on `/design-system`:
  - tile is 52×52 at 16px radius with `--color-secondary` fill and a `--color-primary` glyph;
  - the description's `max-width` is 280px and the block is centred;
  - the title renders at the requested heading level (render one at `h3` and one at `h2` and
    assert both);
  - an `EmptyState` without `action` renders **no** button node;
  - the CTA is keyboard reachable and labelled.
- Motion: block `animation-name` non-`none` at 180ms with the tile 60ms later; `0.01ms` under
  `reducedMotion: 'reduce'` with the text present on the first frame.
- 375px: the 280px measure does not overflow a 375px viewport minus gutters; 1280px centred.
- axe zero serious/critical (heading order valid); six catalogs key-identical; zero banned-pattern
  hits.
- `unified-search-states.spec.ts` and `students-list.spec.ts` still green.

## Assumptions

- `headingLevel` is a prop because the export shows the empty state only inside a demo card and
  never states its document position.

## Evidence
