---
id: 035
title: Rebuild the card shell family — 16px radius, 1px border, .05-alpha shadow, four paddings
layer: ui
kind: implement
slice: Card / DataPanel / PanelHeaderRow — the shared surface every panel in the portal sits on
target: src/modules/design-system/components/data-panel.tsx, src/modules/design-system/components/panel-header-row.tsx, src/modules/design-system/types/data-display.types.ts, src/modules/design-system/components/showcase/cards-section.tsx, tests/e2e/ds-card.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--cards.html, .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/05-ds-components.md#1.0,#6.5,#6.8,#6.11, .qa/design/spec/05-ds-components.md#8.5
status: TODO
depends_on: [001, 003, 004, 006, 007, 008, 010, 011]
---

## Objective

Five of the six card types in the export use one shell verbatim. Ship that shell once, with the
four padding variants the export actually uses, so every later wave composes instead of
re-declaring a border and a radius.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §1.0, verbatim:

```
background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px;
padding:22px; box-shadow:0 1px 2px rgba(14,35,80,.05)
```
No transition and no hover on the shell itself (the one exception is the dropzone — task 052).

**Padding variants actually used:**

| padding | where | cite |
|---|---|---|
| `22px` | stat cards, test card, bar-chart card, donut card, sparkline card | `ds--cards.html:5`, `:22` |
| `20px 22px` | activity feed, upcoming/top-performers | `ds--dashboard-components.html:50,59` |
| `18px 22px` | breadcrumb card, empty-state card, invite row | `ds--navigation.html:34,44` |
| `28px` | section demo cards (forms/badges/alerts/tabs boards) | `[COL:4]`, `[FRM:4]` |
| `8px 20px` | settings list | `ds--dashboard-components.html:126` |

**Shadow discrepancy — binding decision:** every card in the export uses alpha **.05**, while the
token `--shadow-sm` is alpha **.06** (`05-ds-components.md` §0 "Card shadow discrepancy"). Use
the design's `.05` via W0's `--shadow-alert`/`--shadow-card` token; record the 0.01 delta from
`--shadow-sm` in Evidence so the divergence is deliberate.

**Dark mode** (§8.5): `background:#111B33; border:1px solid #223154; border-radius:14px;
padding:20px`, **no box-shadow**. Radius drops 16→14 and padding 22→20 on dark — this is a real
difference, not an oversight; implement it.

**Panel header row** (§6.5/§6.6): title `15px / 600 / #0E2350`; optional right meta
`12px / #94A3B8`; `margin-bottom:14px`.

## Design source

Tokens: `bg-card` · `border-border` (`#E3E8F0`) · `--radius-2xl` (16px) / `--radius-xl` (14px
dark) · `--shadow-card` = `0 1px 2px oklch(0.2692 0.0871 263.04 / 0.05)` · dark `bg-card`
`#111B33` + `border-border` `#223154`. Title `--font-size-h4`-adjacent 15px token,
`text-foreground`; meta `--font-size-eyebrow` (12px) `text-muted-foreground`.

Motion: the shell itself has none. `DataPanel` accepts `animateIn` which applies
`--animate-fade-in` (180ms, opacity only) so dashboard panels can stagger in after data resolves;
reduced-motion from W0 removes it.

## Files

- `src/modules/design-system/components/data-panel.tsx` — re-cut to the shell + `padding`
  variant prop (`default | list | compact | board | settings`). Keep its existing props so
  `dashboard`, `children`, `notifications` and `settings` modules keep compiling.
- `src/modules/design-system/components/panel-header-row.tsx` — title + meta + optional action.
- `types/data-display.types.ts` — `DataPanelProps` gains `padding`, `animateIn`.
- showcase `cards-section.tsx`; `tests/e2e/ds-card.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.

## Steps

1. Wrap `Card` from `@/components/ui/card` (read-only) — do **not** hand-roll a `<div>` with a
   border; the primitive already carries the slot data attributes the e2e helpers use.
2. Encode the five paddings as a cva variant; no arbitrary padding values.
3. Dark branch: `dark:rounded-xl dark:p-5 dark:shadow-none dark:border-border`.
4. `PanelHeaderRow` stays presentation-only — no data fetching, no formatting logic.
5. i18n only for showcase copy; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 3 (four modules consume `DataPanel` — read them before changing props),
  law 11, law 14, law 15.
- `.claude/rules/module-pattern.md` (≤120 lines; cva variants in `lib/` if the map grows past a
  screenful); `.claude/rules/tailwind.md` (4pt scale where the design allows, named tokens where
  it does not; no `p-[22px]`); `.claude/rules/quality.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-card.spec.ts` asserts on `/design-system`: the default card has
  `border-radius: 16px`, `border-width: 1px`, `padding: 22px`, and a `box-shadow` matching the
  resolved `--shadow-card`; each of the five padding variants reports its documented padding;
  with `.dark` on `<html>` the card is 14px radius, 20px padding, `box-shadow: none`.
- Motion: `animateIn` panels have a non-`none` `animation-name` at 180ms; `0.01ms` under
  `reducedMotion: 'reduce'`; content is in the DOM on the first frame either way.
- 375px: cards are full-bleed-safe (no fixed widths), `scrollWidth <= clientWidth`; 1280px the
  3-up grid `repeat(3,1fr)` from `ds--cards.html:4` holds.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.
- `dashboard.spec.ts`, `children-profile.spec.ts`, `settings-tabs.spec.ts` still green.

## Assumptions

- The `.05` card alpha (not `--shadow-sm`'s `.06`) is authoritative — the components are the
  design, the token table is a summary.

## Evidence
