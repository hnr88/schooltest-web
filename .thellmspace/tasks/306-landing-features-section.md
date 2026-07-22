---
id: 306
title: Re-skin the landing features grid, including the navy highlighted card and the hover lift
layer: ui
kind: implement
slice: #product — eyebrow, 40px h2 and the three feature cards (two light, one navy)
target: src/modules/landing/components/FeaturesSection.tsx, src/modules/landing/constants/landing.constants.ts
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/landing--features.html:1-22 · .qa/design/spec/06-auth-states-landing.md#53-features-landing-featureshtml
status: TODO
depends_on: []
---

## Objective

Bring `#product` to the design: a 12.5px blue eyebrow, a 40px balanced headline and a 3-up card grid
whose middle card is navy — with the one hover motion the design actually declares.

## Contract

n/a — presentation. Behaviour preserved verbatim:

- The section keeps `id="product"` — `tests/e2e/landing.spec.ts` asserts it exists exactly once and
  sits between the trusted-by strip and `#ai-feedback` in the DOM chain.
- Copy keys `Home.features.*` unchanged; the three cards stay driven by the constants list in
  `src/modules/landing/constants/landing.constants.ts` (never inline JSX copy).

## Design source

`.qa/design/screens/landing--features.html` (spec §5.3). Container `max-width:1200px; margin:0 auto;
padding:88px 32px 0` → `max-w-landing mx-auto px-8 pt-22`.

| Element | Value | Token / utility |
|---|---|---|
| Eyebrow | `12.5px / 700 / letter-spacing .1em / uppercase / #2563EB` | `--tracking-eyebrow`, `text-xs font-bold uppercase text-primary` |
| `h2` | `margin:14px auto 0; max-width:560px; font-size:40px; line-height:1.12; font-weight:700; letter-spacing:-0.025em; color:#0E2350; text-wrap:balance` | the 40px `--text-h2` token, `mt-3.5 max-w-140 font-bold text-balance text-foreground` |
| Grid | `repeat(3,minmax(0,1fr)); gap:20px; margin-top:48px` | `grid grid-cols-1 md:grid-cols-3 gap-5 mt-12` |
| Light card (1 & 3) | `background:#F7F9FC; border:1px solid #EEF2F7; border-radius:20px; padding:30px` | `bg-background border border-rule rounded-3xl p-7.5` |
| Navy card (2) | `background:#0E2350; border-radius:20px; padding:30px` — **no border** | `bg-navy-900 rounded-3xl p-7.5` |
| Icon chip | `46×46; radius:14px`; card 1 `background:#EFF5FF` + file-text `20×20 stroke #2563EB sw2`; card 2 `background:#16326E` + sparkles `stroke #5EEAD4`; card 3 `background:#F0FDFA` + bar-chart `stroke #0D9488` | `size-11.5 rounded-selection` (13px) or the 14px radius token, `bg-brand-50` / `bg-navy-800` / `bg-accent-50`; icons `size-5` with `text-primary` / `text-chart-5` / `text-accent-600` |
| Title | `18px / 700; margin-top:18px`; card 1&3 `#0E2350`, card 2 `#FFFFFF` | `text-lg font-bold mt-4.5`, `text-foreground` / `text-white` |
| Body | `14.5px / 1.6; margin-top:8px`; card 1&3 `#64748B`, card 2 `#A9BADC` | `text-sm leading-relaxed mt-2`, `text-muted-foreground` / `text-navy-body` |

Tokens: `#F7F9FC` → `--color-background` · `#EEF2F7` → `--color-rule` · `#0E2350` →
`--color-navy-900` · `#16326E` → `--color-navy-800` · `#EFF5FF` → `--color-brand-50` · `#F0FDFA` →
`--color-accent-50` · `#5EEAD4` → `--color-chart-5` · `#0D9488` → `--color-accent-600` · `#A9BADC` →
`--color-navy-body`.

**Hover — the design's only declared card motion** (spec §6.2, `landing--features.html:8,13,18`):
`transition: box-shadow .2s, transform .2s`; light cards → `box-shadow:0 16px 40px
rgba(14,35,80,.10); transform:translateY(-3px)`; navy card → `box-shadow:0 16px 40px
rgba(14,35,80,.28); transform:translateY(-3px)`.
Build as `transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-1
hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0`. The design's 3px
lift rounds to the 4pt scale's `-translate-y-1` per `.claude/rules/tailwind.md`; never
`-translate-y-[3px]`.

## Files

- `src/modules/landing/components/FeaturesSection.tsx`
- `src/modules/landing/constants/landing.constants.ts` (card list: key, icon, tone)

Icons come from the module's existing `LandingIcons.tsx` or lucide (`FileText`, `Sparkles`,
`BarChart3`) — no new icon dependency.

## Depends on

None inside W10.

## Steps

1. Read `FeaturesSection.tsx`, the constants file and `tests/e2e/landing.spec.ts`.
2. Drive the three cards from a typed constants array `{ key, icon, tone: 'light' | 'navy' }`; the
   component maps over it and holds no per-card branching beyond the tone class map.
3. Apply the table; icon chips are `aria-hidden="true"`.
4. Motion: the hover lift above, plus the section entrance through the existing `ScrollReveal` with
   a per-card `delay` stagger (0 / 80 / 160ms). No new keyframe.
5. 375px: one column, cards `p-6`, the navy card keeps its contrast, no horizontal scroll.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 11, 15; component ≤120 lines.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, animate transform/opacity (plus
  the design's declared box-shadow) only, exponential easings.
- `.claude/rules/module-pattern.md` — the card list is a constant in `constants/`, not inline JSX.
- `.claude/rules/i18n.md` — `Home.features.*` unchanged ×6 catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/landing.spec.ts tests/e2e/a11y-responsive.spec.ts` green —
  `#product` present once and in chain order, `en` and `zh`.
- Computed-style assertions against the running app: the navy card's `background-color` =
  `--color-navy-900` and it has **no** border; the light cards' `border-color` = `--color-rule`; all
  three have `border-radius` 20px; hovering a card changes its computed `transform` from `none` and
  its `transition-duration` is `0.2s`.
- Contrast check: the navy card's body ink (`--color-navy-body`) measures ≥4.5:1 on
  `--color-navy-900` — assert via axe (zero serious/critical) at 375 and 1280.
- Reduced-motion: hovering the card produces no transform and no transition.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits.

## Assumptions

The design's `translateY(-3px)` is rounded to the 4pt scale; the deviation is 1px and is recorded
here rather than smuggled in as an arbitrary value.

## Evidence

_(filled in as the task runs)_
