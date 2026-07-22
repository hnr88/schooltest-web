---
id: 312
title: Re-skin the closing CTA panel — three-stop navy gradient, watermark, white and ghost buttons
layer: ui
kind: implement
slice: #cta — the last section before the footer, a 28px-radius gradient panel with two CTAs
target: src/modules/landing/components/CtaSection.tsx, src/app/globals.css
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/landing--cta.html:1-11 · .qa/design/spec/06-auth-states-landing.md#59-closing-cta-landing-ctahtml1-11
status: TODO
depends_on: []
---

## Objective

Bring `#cta` to the design: a `135deg` navy→blue gradient panel with the logo-mark watermark
bleeding off its top-left, a 42px balanced headline, a 400px-capped lead, and a white primary
button beside a translucent-bordered ghost button.

## Contract

n/a — presentation. Behaviour preserved verbatim:

- The section keeps `id="cta"` and its DOM-chain position immediately before `footer`
  (`tests/e2e/landing.spec.ts:103-117`).
- Copy keys `Home.cta.*` unchanged; both CTA hrefs keep their current targets (`/sign-up` and the
  existing contact target) — no purchase or checkout link (`.qa/CONTRACTS.md` B-7).

## Design source

`.qa/design/screens/landing--cta.html:1-11` (spec §5.9). Section `max-width:1200px; margin:0 auto;
padding:88px 32px` — **bottom padding is present here**, it is the last section before the footer →
`max-w-landing mx-auto px-8 py-22`.

| Element | Value | Token / utility |
|---|---|---|
| Panel | `background:linear-gradient(135deg,#0E2350 0%,#16326E 60%,#1D4ED8 140%); border-radius:28px; padding:72px 40px; text-align:center; position:relative; overflow:hidden` | the existing `--background-image-cta-gradient` token → `bg-cta-gradient`; **verify its three stops and the 140% terminal stop match the design and correct the token if not** (the 140% stop is deliberate — spec §5.9: "the blue never fully lands inside the box"). `rounded-4xl px-10 py-18 text-center relative overflow-hidden` |
| Watermark | `assets/logo-mark.png`, `position:absolute; left:-50px; top:-40px; height:240px; opacity:.10; filter:brightness(0) invert(1)` | `next/image` with `width`/`height`, `aria-hidden="true"`, `absolute -left-12.5 -top-10 h-60 opacity-10 brightness-0 invert pointer-events-none` |
| `h2` | `max-width:520px; font-size:42px; line-height:1.12; font-weight:700; letter-spacing:-0.025em; color:#FFFFFF; text-wrap:balance; margin:0 auto` | the `--text-cta-title` token (its provenance is this 42px size), `max-w-130 mx-auto font-bold text-balance text-white` |
| Lead | `max-width:400px; 15.5px / 1.6 / #A9BADC; margin:16px auto 0` | `max-w-100 mx-auto mt-4 text-base leading-relaxed text-navy-body` |
| Button row | `gap:12px; margin-top:30px; justify-content:center` | `flex flex-wrap justify-center gap-3 mt-7.5` |
| Primary | `background:#FFFFFF; color:#0E2350; 15px/600; padding:13px 26px; border-radius:12px`, trailing arrow `15×15 sw 2.4`; **hover `background:#DBEAFE`** | `bg-card text-navy-900 h-12 px-6.5 rounded-tile font-semibold hover:bg-brand-100 transition-colors duration-150`, lucide `ArrowRight className="size-4"` |
| Ghost | `background:transparent; color:#FFFFFF; border:1px solid rgba(255,255,255,.35); 15px/600; padding:12px 25px; border-radius:12px`; **hover `background:rgba(255,255,255,.08)`** | `bg-transparent text-white ring-1 ring-white/35 h-12 px-6.5 rounded-tile font-semibold hover:bg-white/10 transition-colors duration-150` |

Tokens: `#0E2350` → `--color-navy-900` · `#16326E` → `--color-navy-800` · `#1D4ED8` →
`--color-brand-700` · `#A9BADC` → `--color-navy-body` · `#DBEAFE` → `--color-brand-100` ·
`#FFFFFF` → `--color-card`. `--radius-tile` = 12px.

## Files

- `src/modules/landing/components/CtaSection.tsx`
- `src/app/globals.css` (only if `--background-image-cta-gradient` needs correcting to the three
  design stops — provenance-comment the hexes per D-DESIGN-2)

## Depends on

None inside W10. Task 313 (footer) depends on this one because the footer markup lives in the same
design slice.

## Steps

1. Read `CtaSection.tsx`, the gradient token in `globals.css` and `tests/e2e/landing.spec.ts`.
2. Verify/correct the gradient token, then apply the table.
3. The watermark is decorative — `aria-hidden`, `pointer-events-none`, contained by the panel's
   `overflow-hidden` so its negative offsets never create page scroll.
4. Motion: the panel enters through the existing `ScrollReveal`; both buttons get
   `transition-colors duration-150` (spec §6.3 names the CTA primary and ghost hovers explicitly).
   No gradient animation — animating a `background-image` is banned by `.claude/rules/tailwind.md`.
5. 375px: panel `px-6 py-12`, headline steps down via the fluid token, the two buttons stack full
   width at ≥44px, the watermark stays clipped.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 11, 15.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, animate transform/opacity only,
  no gradient text on headings (the gradient here is a surface, not text).
- `.claude/rules/quality.md` — `next/image` with dimensions; ≥44px CTAs; contrast AA for
  `--color-navy-body` on the gradient's darkest stop.
- `.claude/rules/i18n.md` — `Home.cta.*` unchanged ×6 catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/landing.spec.ts tests/e2e/a11y-responsive.spec.ts` green —
  `#cta` present once and immediately before `footer` in the chain.
- Computed-style assertions against the running app: the panel's `background-image` contains three
  colour stops with the last at `140%`; `border-radius` = 28px; the primary button's hover
  `background-color` = `--color-brand-100`; the watermark's `opacity` = `0.1`.
- No horizontal scroll at 375 **or** 1280 (the negative-offset watermark is the specific risk).
- Both CTA `href`s asserted to be `/sign-up` and the contact target — never a checkout (B-7).
- axe zero serious/critical at 375 and 1280.
- Reduced-motion: no entrance animation, no hover transition.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits.

## Assumptions

`--background-image-cta-gradient` already exists in `globals.css`; this task verifies rather than
duplicates it, and any correction carries the design's hexes only inside a provenance comment.

## Evidence

_(filled in as the task runs)_
