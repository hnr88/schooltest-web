---
id: 310
title: Re-skin the pricing grid — Free, the shadowed navy Pro card with its ribbon, and School
layer: ui
kind: implement
slice: #pricing — three plan cards with the excluded-feature affordance and CTAs that never reach a checkout
target: src/modules/landing/components/PricingSection.tsx, PricingCard.tsx, landing.constants.ts
contract: n/a (presentation; billing surfaces are BLOCKED — see B-7)
design: .qa/design/screens/landing--pricing.html:1-37 · .qa/design/spec/06-auth-states-landing.md#57-pricing-landing-pricinghtml--wrapped-in-sc-if-showpricing
status: TODO
depends_on: []
---

## Objective

Bring `#pricing` to the design: a 3-up grid where the middle card is navy, lifted by a
`0 24px 56px` shadow and topped by a teal "Most popular" ribbon, and where the Free plan's excluded
feature is greyed with an ✕ rather than hidden.

## Contract

n/a — presentation. Behaviour preserved verbatim:

- The section keeps `id="pricing"` and its DOM-chain position; the header's "Pricing" link must
  still scroll it into view (`tests/e2e/landing.spec.ts:131-154`).
- `PRICING_TIERS` in `landing.constants.ts` stays the single source of the three plans, their
  feature keys and their `excludedFeatureKeys`; copy keys `Home.pricing.*` unchanged.

**Billing is BLOCKED and the CTAs must respect that.** `.qa/CONTRACTS.md` **B-7**:

> **B-7** | `Family plan covers up to 4`, all billing/credits/invoices | `portal--billing.html`,
> `app--buy-credits/checkout/receipt/auto-top-up` | No payment, credit, invoice, plan or
> subscription content-type exists and no payment provider is configured.

So: the three CTAs are marketing links only. "Get started" and "Start free trial" link to
`/sign-up`; "Talk to sales" is a `mailto:` or the existing contact target. **No CTA may link to a
checkout, a plan-selection route or anything that implies a purchase**, and no plan/price may be
fetched from an API — the prices stay translated marketing copy in the six catalogs, as today.

## Design source

`.qa/design/screens/landing--pricing.html` (spec §5.7). Section `max-width:1200px; margin:0 auto;
padding:88px 32px 0`; grid `repeat(3,minmax(0,1fr)); gap:20px; margin-top:48px; align-items:stretch`
→ `max-w-landing mx-auto px-8 pt-22`, `grid grid-cols-1 md:grid-cols-3 gap-5 mt-12 items-stretch`.

Header: eyebrow `12.5px/700; .1em; uppercase; #2563EB`; `h2` `40px / 1.12 / 700 / -0.025em /
#0E2350; margin:14px auto 0`.

Common card anatomy: plan name `15px/700` → price row `flex; align-items:baseline; gap:5px;
margin-top:12px` (amount `40px/700/-0.02em`, period `13.5px`) → feature list `gap:10px;
margin-top:20px; font-size:14px; flex:1` (row `gap:9px`, icon `14×14 stroke-width 2.6`) → CTA
`margin-top:24px; width:100%; 14px/600; border-radius:11px` (`--radius-segment` = 11px).

| | **Free** | **Pro** | **School** |
|---|---|---|---|
| Card | `#FFFFFF`, `1px #E3E8F0`, r20, `p:30px` | `#0E2350`, no border, r20, `p:30px`, `box-shadow:0 24px 56px rgba(14,35,80,.28)` | `#FFFFFF`, `1px #E3E8F0`, r20, `p:30px` |
| Utility | `bg-card border border-border rounded-3xl p-7.5` | `bg-navy-900 rounded-3xl p-7.5 shadow-xl relative` | as Free |
| Ribbon | — | `absolute; top:-12px; left:50%; translateX(-50%); 11px/700; .06em; uppercase; color:#06251F; background:#2DD4BF; padding:5px 13px; radius:999px` → `-top-3 left-1/2 -translate-x-1/2 text-xs font-bold uppercase text-accent-ink bg-accent-on-dark rounded-full px-3 py-1` | — |
| Name ink | `text-foreground` | `text-white` | `text-foreground` |
| Price | `$0` + "/ month" `#94A3B8` | `$29` + "/ teacher / month" `#8FA3C7` | `Custom`, no period |
| Feature ink | `#475569` → `text-body` | `#C7D6F2` → the on-navy secondary token | `text-body` |
| Check ink | `#16A34A` → `text-success` | `#2DD4BF` → `text-accent-on-dark` | `text-success` |
| Excluded row | `color:#94A3B8` with an ✕ icon `stroke:#CBD5E1` (`M18 6 6 18` / `m6 6 12 12`) → `text-muted-foreground-soft` + lucide `X className="size-3.5 text-input"` | — | — |
| CTA | white / `1px #CBD5E1` / `#16326E`, `padding:11px`, hover `#F7F9FC` | `#2563EB` / white, `padding:12px`, hover `#1D4ED8` | as Free |

Tokens: `#0E2350` → `--color-navy-900` · `#2DD4BF` → `--color-accent-on-dark` · `#06251F` → the dark
`--accent-foreground` token · `#E3E8F0` → `--color-border` · `#CBD5E1` → `--color-input` · `#94A3B8`
→ `--color-muted-foreground-soft` · `#8FA3C7` → `--color-navy-muted` · `#C7D6F2` → the on-navy body
token · `#16A34A` → `--color-success` · `#475569` → `--color-body`.

`showPricing` (`SchoolTest Landing.dc.html:322`, default `true`) is a page-level boolean: express it
as a constant (`SHOW_PRICING`) beside `SHOW_ANNOUNCEMENT`, not a hard-coded `true` in JSX. **If it
is ever false, `tests/e2e/landing.spec.ts`'s `#pricing` chain link breaks** — so the constant stays
`true` and the task records the coupling.

## Files

- `src/modules/landing/components/PricingSection.tsx`
- `src/modules/landing/components/PricingCard.tsx`
- `src/modules/landing/constants/landing.constants.ts`

## Depends on

None inside W10.

## Steps

1. Read both components, the constants file, `tests/e2e/landing.spec.ts` and `.qa/CONTRACTS.md` B-7.
2. Apply the tables; `PricingCard` takes the tier object and a `featured` boolean — no per-plan
   branching beyond a tone map.
3. The excluded feature renders as a row, greyed, with the ✕ — never omitted; the icon is
   `aria-hidden` and the row's text alone must convey exclusion to a screen reader (the copy key
   already reads as the feature name, so prefix it with the translated "not included" wording only
   if such a key exists; if it does not, add `Home.pricing.notIncluded` to **all six** catalogs).
4. Verify every CTA `href` against B-7: `/sign-up`, `/sign-up`, and the contact target. Fail the
   task if any of them points at a checkout-like route.
5. Motion: cards enter through the existing `ScrollReveal` with a 0/80/160ms stagger; CTA hovers are
   `transition-colors duration-150`. The design declares **no** hover lift for pricing cards (§6.2
   lists only the 3-up feature cards) — do not add one.
6. 375px: one column with Pro first or in source order (source order — reordering changes the DOM
   contract), cards `p-6`, the ribbon stays inside the viewport, CTAs full width ≥44px.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 15.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values.
- `.claude/rules/i18n.md` — if `Home.pricing.notIncluded` is added it lands in **all six** catalogs
  with identical shape, in the same position.
- `.claude/rules/quality.md` — the exclusion must be conveyed non-visually; ≥44px CTAs.
- `.qa/CONTRACTS.md` B-7 — no purchase affordance.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/landing.spec.ts tests/e2e/a11y-responsive.spec.ts` green —
  `#pricing` present once, in chain order, and reachable from the header link.
- Real assertions against the running app: the Pro card's `background-color` = `--color-navy-900`
  and its ribbon's = `--color-accent-on-dark`; the excluded row's ink = `--color-muted-foreground-soft`;
  **every CTA `href` on the section is one of `/sign-up` or a `mailto:`** — asserted explicitly.
- axe zero serious/critical at 375 and 1280, including contrast of the on-navy feature ink.
- Reduced-motion: no entrance animation, no hover transition.
- If a key was added: all six catalogs have identical key counts and shapes (assert programmatically).
- Zero banned-pattern grep hits.

## Assumptions

Prices are marketing copy. B-7 blocks every billing surface, so nothing here may become a purchase
flow; the refusal is recorded rather than worked around.

## Evidence

_(filled in as the task runs)_
