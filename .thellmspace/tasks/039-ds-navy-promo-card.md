---
id: 039
title: Rebuild the navy featured card and the NavyPanel surface (watermark, eyebrow, white CTA)
layer: ui
kind: implement
slice: FeaturedCard / NavyPromoCard / NavyPanel — the navy hero surface
target: src/modules/design-system/components/navy-promo-card.tsx, src/modules/design-system/components/navy-panel.tsx, src/modules/design-system/components/feature-card.tsx, src/modules/design-system/types/record.types.ts, src/modules/design-system/components/showcase/cards-section.tsx, tests/e2e/ds-navy-card.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--cards.html, .qa/design/spec/05-ds-components.md#1.4
status: TODO
depends_on: [001, 004, 006, 007, 010, 020, 035]
---

## Objective

The dashboard's navy hero panel (W5) and the promo tile both sit on this surface. Ship it once
with the watermark treatment and the white-on-navy CTA, so W5 composes rather than re-declares it.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §1.4 (`ds--cards.html:45-52`), verbatim:

```
background:#0E2350; border-radius:16px; padding:22px; color:#FFFFFF;
display:flex; flex-direction:column; justify-content:space-between;
min-height:180px; position:relative; overflow:hidden
```
— **no border, no box-shadow**.

- Watermark: `assets/logo-mark.png`, `alt=""`, `position:absolute; right:-22px; bottom:-18px;
  height:120px; opacity:.14; filter:brightness(0) invert(1)`.
- Eyebrow: `font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;
  color:#8FA3C7`.
- Headline: `font-size:20px; font-weight:700; margin-top:8px; letter-spacing:-0.01em`, with a
  hard `<br />` line break in the design copy.
- CTA: `align-self:flex-start; inline-flex; align-items:center; gap:8px; background:#FFFFFF;
  color:#0E2350; border:none; font-size:13.5px; font-weight:600; padding:9px 16px;
  border-radius:9px`; hover `background:#DBEAFE`; trailing 14×14 arrow-right at `stroke-width:2.4`.

## Design source

Tokens: `bg-navy-900` · eyebrow `--color-navy-body`-adjacent `#8FA3C7` → `--color-navy-muted` at
`--font-size-eyebrow` (12px) `tracking-[0.08em]` via the W0 `--tracking-group` token · headline
20px/700/`-0.01em` `text-primary-foreground` · CTA = task 020's `white` variant
(`bg-white text-navy-900 hover:bg-blue-100`) at the 9px radius step · watermark `opacity-[0.14]`
→ W0 `--opacity-watermark` token, `brightness-0 invert`.

Motion: the CTA inherits the 150ms background transition from task 020. The watermark gets a
`group-hover:translate-x-1 transition-transform duration-200 ease-out-quart` drift — transform
only, opt-out via `interactive={false}` for non-clickable panels. Reduced-motion from W0.

## Files

- `navy-promo-card.tsx` — eyebrow + headline + CTA + watermark.
- `navy-panel.tsx` — the bare navy surface (no watermark, no CTA) that W5's hero composes into.
- `feature-card.tsx` — align to the same surface; remove any duplicate navy declaration.
- `types/record.types.ts` — `NavyPanelProps`, `NavyPromoCardProps`.
- showcase `cards-section.tsx`; `tests/e2e/ds-navy-card.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).

Within W1:

- **020** — the `white` button variant for the CTA.
- **035** — the card shell family (the navy card is its sibling and must not inherit its border/shadow).

## Steps

1. Watermark is `next/image` with explicit `width`/`height` and `alt=""` (decorative) —
   `.claude/rules/quality.md` requires `next/image` for every image.
2. `overflow-hidden` on the surface so the negative-offset watermark is clipped.
3. Contrast: `#8FA3C7` on `#0E2350` is ~5.0:1 (passes); the headline is white on navy (~14:1).
   Record both ratios.
4. `min-height:180px` via a W0 token; the card must still grow with content.
5. i18n: eyebrow/headline/CTA labels; six catalogs. The design's hard `<br />` is **not** shipped
   — a translated headline cannot carry an English line break; use `text-balance` instead.
6. E2E.

## Project rules

- `CLAUDE.md` law 11, law 14, law 15; `.claude/rules/module-pattern.md`;
  `.claude/rules/tailwind.md` (no `#0E2350`; no arbitrary opacity — token it;
  banned pattern: gradient text on headings, glassmorphism); `.claude/rules/quality.md`
  (`next/image`, decorative alt, contrast); `.claude/rules/i18n.md` (no hard line breaks in
  translated copy); `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-navy-card.spec.ts` asserts on `/design-system`: surface `background-color` =
  resolved `--color-navy-900`, `border-radius` 16px, `box-shadow: none`, `border-width: 0`,
  `min-height` ≥ 180px, `overflow: hidden`; the watermark image has `alt=""`, `opacity` 0.14 and
  is clipped (its bounding box extends past the card's right edge but the card's `scrollWidth`
  does not grow); the CTA is the white variant with navy text.
- Motion: hovering the card drifts the watermark via `transform` over 200ms; `0.01ms` under
  `reducedMotion: 'reduce'`.
- 375px: headline wraps without clipping, CTA stays inside the card, no horizontal overflow;
  1280px matches the 1.4fr/1fr row from `ds--cards.html:21`.
- axe zero serious/critical; contrast ratios recorded; six catalogs key-identical; zero
  banned-pattern hits.

## Assumptions

- `assets/logo-mark.png` is copied into `public/` by the W0 brand task; if it has not been, this
  task copies it and says so (it is the only asset it needs).

## Evidence
