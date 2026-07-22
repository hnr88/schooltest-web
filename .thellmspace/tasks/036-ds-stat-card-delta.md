---
id: 036
title: Rebuild the StatCard with icon chip and delta row (34px value, diagonal arrow)
layer: ui
kind: implement
slice: StatCard variant A — label, tinted icon chip, 34px value, optional delta
target: src/modules/design-system/components/stat-card.tsx, src/modules/design-system/components/trend-delta.tsx, src/modules/design-system/types/metrics.types.ts, src/modules/design-system/constants/metric-card.constants.ts, src/modules/design-system/components/showcase/metric-cards-row.tsx, tests/e2e/ds-stat-card.spec.ts
contract: n/a (presentation slice — the metric VALUES it displays are contracted in W2/W3)
design: .qa/design/screens/ds--cards.html, .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/05-ds-components.md#1.1,#6.4,#8.5
status: TODO
depends_on: [001, 003, 005, 006, 007, 035]
---

## Objective

The dashboard hero tiles (W5) and the child-detail summary tiles (W6) are both this component. It
renders whatever number it is handed — it must contain **no** metric logic, so a BLOCKED metric
(`.qa/CONTRACTS.md` B-1…B-8) can simply not be passed to it.

## Contract

n/a for presentation. The values it renders come from `C-DASH-HOUSEHOLD` (W2/W3) — this component
takes them as props and formats nothing beyond `Intl.NumberFormat` passed in by the caller.

`.qa/design/spec/05-ds-components.md` §1.1, verbatim:

- Top row: `display:flex; align-items:center; justify-content:space-between`.
- Label: `font-size:13px; font-weight:500; color:#64748B`.
- Icon chip: `inline-grid; place-items:center; width:34px; height:34px; border-radius:10px;
  background:#EFF5FF` (blue) or `#F0FDFA` (teal); glyph 16×16, `stroke-width:2`, round caps/joins,
  stroke `#2563EB` (blue) / `#0D9488` (teal).
- Value: `font-size:34px; font-weight:700; letter-spacing:-0.02em; color:#0E2350; margin-top:10px`.
- Delta row: `inline-flex; align-items:center; gap:5px; font-size:12.5px; font-weight:600;
  color:#15803D; margin-top:6px`; the leading 12×12 arrow (`stroke-width:2.6`, path `M5 12h14` +
  `m12 5 7 7-7 7` with `transform="rotate(-45 12 12)"`) is **optional** — the "Students" card has
  no arrow.

**Sparkline-card variant** (§6.4) uses the same head row but a **30px** value and a delta with no
icon. **Dark** (§8.5): label `#8FA3C7`, chip 32×32 radius 9px `#1A2A4E`, glyph 15×15 `#60A5FA`,
value 30px `#E6ECF7`.

## Design source

Tokens: label `--font-size-caption-lg` (13px) `text-muted-foreground` · chip `bg-secondary` /
`bg-accent-50` with `text-primary` / `text-accent-600` glyphs · chip radius `--radius-md` · value
`--font-size-stat` (34px, weight 700, `tracking-tight` = `-0.02em`) `text-foreground` · delta
`--font-size-caption` (12.5px) `text-success-strong` (positive) / `text-destructive-strong`
(negative) / `text-muted-foreground` (flat).

Motion: the value counts nothing — no odometer. On mount the card plays `--animate-fade-in`
(180ms opacity) inherited from `DataPanel`; the delta chip plays `st-pop-in` when its value
changes between renders. Reduced-motion from W0.

## Files

- `src/modules/design-system/components/stat-card.tsx` — re-cut.
- `src/modules/design-system/components/trend-delta.tsx` — the delta row (arrow + text + tone).
- `constants/metric-card.constants.ts` — the icon-chip tone map (blue/teal), extending the
  existing tone map that quotes `.qa/CONTRAST-SPEC.md`.
- `types/metrics.types.ts` — `StatCardProps { label, value, icon, tone, delta? }`,
  `TrendDeltaProps { value, tone, showArrow }`.
- showcase `metric-cards-row.tsx`; `tests/e2e/ds-stat-card.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **005** — the eight published type steps.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.

Within W1:

- **035** — the card shell it sits in.

## Steps

1. `value` is `ReactNode`, not `number` — so a caller can pass an em dash `—` for "no data"
   (which the table spec §2.4 already does) instead of the component inventing a zero.
2. Delta tone is a prop, never derived from the sign inside the component (a negative streak day
   is not automatically "bad").
3. Never render a delta when `delta` is `undefined` — a missing metric renders nothing, never
   `+0%`.
4. The label is a real text node before the value in DOM order, so screen readers read
   "Tests completed, 12".
5. i18n at the call site only; the component takes strings. Showcase strings in six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 1 (do exactly what is asked — no metric computation here), law 14, law 15.
- `.claude/rules/module-pattern.md` (tone maps in `constants/`, types in `types/`;
  components are dumb — no formatting logic); `.claude/rules/tailwind.md`;
  `.claude/rules/quality.md` (34px value must still be a `<p>`/`<dd>`, not a heading, so page
  heading order stays valid); `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-stat-card.spec.ts` asserts on `/design-system`: value `font-size` 34px and
  `letter-spacing` -0.02em; chip 34×34 at 10px radius with the documented tint; the delta row is
  12.5px/600 in the success token; a card rendered without a delta has **no** delta node; a card
  given `—` renders the em dash and no `0`.
- Dark: chip 32×32/9px, value 30px, label token swaps.
- Motion: delta change plays `st-pop-in`; `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: three stat cards stack to one column and the 34px value does not clip; 1280px 3-up.
- axe zero serious/critical (heading order unchanged); six catalogs key-identical; zero
  banned-pattern hits.

## Assumptions

- The card never computes or formats a metric. Any dashboard number it shows arrives from the
  W3 query layer, which mirrors `C-DASH-HOUSEHOLD`; BLOCKED metrics are simply not passed.

## Evidence
