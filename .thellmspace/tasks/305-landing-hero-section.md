---
id: 305
title: Re-skin the landing hero — media card, scrim, eyebrow pill, 68px h1, CTA row, value strip, logo wall
layer: ui
kind: implement
slice: landing--hero.html in full: the full-bleed hero card, the 3-step value strip and the trusted-by wall
target: src/modules/landing/components/HeroSection.tsx, HeroFlow.tsx, TrustedByStrip.tsx
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/landing--hero.html:1-40 · .qa/design/spec/06-auth-states-landing.md#52-hero-landing-herohtml
status: TODO
depends_on: []
---

## Objective

Bring the hero to the design: a `radius:32px` navy media card with a four-stop scrim, the
translucent eyebrow pill, the 68px two-line headline, the two-button CTA row and the reassurance
line — followed by the 3-step value strip and the five-wordmark logo wall.

## Contract

n/a — presentation. Behaviour preserved verbatim:

- The page has **exactly one `<h1>`** and it is the hero headline (`landing.spec.ts:96`), and the
  DOM chain `main#main-content → h1 → [data-slot=trusted-by] → #product` must hold
  (`landing.spec.ts:103-117`).
- `page.getByRole('img', { name: home(en,'hero.imageAlt') })` must resolve — the hero photo keeps a
  real translated alt (`landing.spec.ts:42`).
- Both hero CTAs keep their accessible names `Home.hero.primaryCta` / `hero.secondaryCta` and remain
  **links** (`getByRole('link', …)`, `landing.spec.ts:45-50`).
- `TrustedByStrip` keeps `data-slot="trusted-by"`.
- Copy keys `Home.hero.*`, `Home.flow.*`, `Home.trustedBy.*` unchanged; `FLOW_STEPS` and
  `TRUSTED_WORDMARKS` in `landing.constants.ts` stay the single source of the item lists.

## Design source

`.qa/design/screens/landing--hero.html`, values literal (spec §5.2):

**Media card** (`:2-20`)

| Element | Value | Token / utility |
|---|---|---|
| Outer rail | `max-width:1360px; margin:20px auto 0; padding:0 20px` | `--container-hero` (1360px) → `max-w-hero mx-auto mt-5 px-5` |
| Card | `border-radius:32px; overflow:hidden; box-shadow:0 30px 70px rgba(14,35,80,.22); background:#0E2350` | `rounded-4xl overflow-hidden shadow-xl bg-navy-900` |
| Photo | full-bleed `object-fit:cover`, intrinsic slot `100% × 600px` | `next/image` `fill` + `object-cover` + `priority` (LCP), real translated alt |
| Scrim | `linear-gradient(180deg, rgba(10,26,60,.55) 0%, rgba(10,26,60,.18) 45%, rgba(10,26,60,.42) 88%, rgba(10,26,60,.10) 100%)` — four stops of `--navy-950` | the existing `--background-image-hero-scrim` token → `bg-hero-scrim`; verify its four stops match, and correct the token if they do not |
| Content stack | `min-height:600px; padding:72px 32px; text-align:center; pointer-events:none` (buttons re-enable) | `min-h-150 px-8 py-18 text-center` |
| Eyebrow pill | `13px/600; #FFFFFF; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.25); backdrop-filter:blur(8px); padding:7px 17px; border-radius:999px`, leading `7×7` dot `#2DD4BF` | `text-sm font-semibold text-white bg-white/15 ring-1 ring-white/25 backdrop-blur-sm px-4 py-1.5 rounded-full`, dot `size-1.5 rounded-full bg-accent-on-dark` |
| `h1` | `68px / line-height 1.03 / 700 / letter-spacing -0.032em / #FFFFFF; max-width:780px; text-wrap:balance; text-shadow:0 2px 24px rgba(10,26,60,.35)` | the `--text-display` token (its provenance is this 68px size), `font-bold text-balance text-white text-shadow-lg`, `max-w-3xl`, `mt-7` |
| Lead | `18px / 1.6 / rgba(255,255,255,.88); max-width:520px; text-wrap:pretty; text-shadow:0 1px 12px rgba(10,26,60,.4)` | `text-lg leading-relaxed text-white/90 max-w-130 text-pretty text-shadow-sm`, `mt-5.5` |
| CTA row | `gap:12px; margin-top:34px` | `gap-3 mt-8.5 flex-wrap justify-center` |
| Primary CTA | `#2563EB` / white, `15.5px/600`, `padding:14px 28px`, `border-radius:12px`, `box-shadow:0 8px 24px rgba(10,26,60,.35)`; hover `#1D4ED8`; trailing arrow `15×15 sw 2.4` | `bg-primary text-primary-foreground rounded-tile h-12 px-7 font-semibold shadow-lg hover:bg-primary-hover transition-colors duration-150`, lucide `ArrowRight className="size-4"` |
| Secondary CTA | `rgba(255,255,255,.92)` / `#0E2350`, `padding:14px 27px`, `r12`, `backdrop-filter:blur(8px)`; hover `#FFFFFF`; leading filled play triangle `14×14` | `bg-white/92 text-navy-900 rounded-tile h-12 px-7 backdrop-blur-sm hover:bg-white transition-colors duration-150`, existing `PlayIcon` |
| Reassurance | `13px; rgba(255,255,255,.75); margin-top:16px` | `text-sm text-white/75 mt-4` |

**Do NOT ship** the editor-only hint chip at `:6` ("Drop a photo here — e.g. a sunny grass field").
Spec §5.2.1: *"Design-tool affordance — do NOT ship."*

**Value strip** (`:22-31`, spec §5.2.2): rail `max-width:900px; margin:96px auto 0; padding:0 32px`;
`h2` `34px / 1.25 / 700 / -0.02em / #0E2350; max-width:680px; text-wrap:balance` with two inline
colour spans (`#2563EB` → `text-primary`, `#0D9488` → `text-accent-600`) — note
`.claude/rules/tailwind.md` bans **gradient** text on headings; solid inline colour spans are fine
and are what the design uses. 3-step row `gap:36px; margin-top:40px; flex-wrap:wrap`; numbered disc
`34×34; border-radius:50%; background:#EFF5FF; color:#2563EB; 14px/700`; label `14.5px/600;
#0E2350`; between steps an arrow `svg 20×20, stroke #CBD5E1, sw 2.2` (`--color-input`), which is
decorative and must be `aria-hidden`.

**Logo wall** (`:33-40`, spec §5.2.3): rail `max-width:1200px; padding:72px 32px; gap:44px;
flex-wrap:wrap`; eyebrow `12px/600; #94A3B8; letter-spacing:.06em` (`--tracking-eyebrow` exists);
five wordmarks `16px/700; #CBD5E1` (`--color-input` as an ink — it is the design's literal value).

## Files

- `src/modules/landing/components/HeroSection.tsx`
- `src/modules/landing/components/HeroFlow.tsx`
- `src/modules/landing/components/TrustedByStrip.tsx`

All three stay Server Components (`getTranslations` from `next-intl/server`).

## Depends on

None inside W10. Wave-level: W0's `--text-display`, `--container-hero`, `--background-image-hero-scrim`.

## Steps

1. Read the three components and `tests/e2e/landing.spec.ts`, `landing-aria.spec.ts`,
   `a11y-responsive.spec.ts`.
2. Apply the media-card table; keep `next/image` with `priority`, `fill`, `sizes` and the translated
   alt exactly as today (LCP + `.claude/rules/quality.md`).
3. Apply the value-strip and logo-wall tables; the arrow glyphs are `aria-hidden="true"`.
4. Motion: each of the three blocks is wrapped in the module's existing `ScrollReveal`
   (`src/modules/landing/components/ScrollReveal.tsx`), which already gates on
   `prefers-reduced-motion` and animates opacity + translate only. Stagger with its `delay` prop
   (0 / 80 / 160ms). Do **not** add a new reveal mechanism, a counter animation or a parallax —
   spec §6.4: *"There is no scroll-reveal, no parallax, no counter animation, no page transition"*
   in the design; the reveal already in the repo is the mission's sanctioned entrance (D-DESIGN-3).
   CTA hovers are `transition-colors duration-150`.
5. 375px: `h1` steps down through the fluid `--text-display` clamp (never a second hard-coded size),
   the CTA row stacks to two full-width ≥44px buttons, the 3-step row wraps to one column with the
   arrows hidden, the logo wall wraps to two rows.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 8, 11, 15.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, no gradient text on headings,
  animate transform/opacity only.
- `.claude/rules/quality.md` — `next/image` with `priority` for the LCP image, one `<h1>`, alt text.
- `.claude/rules/i18n.md` — `Home.hero.*` / `flow.*` / `trustedBy.*` unchanged across six catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/landing.spec.ts tests/e2e/landing-aria.spec.ts
  tests/e2e/a11y-responsive.spec.ts tests/e2e/home.spec.ts` green — one `<h1>`, the DOM chain, both
  CTA links, the hero image role/name, and the `zh` render.
- Computed-style assertions against the running app: hero card `border-radius` = 32px; card
  `background-color` = `--color-navy-900`; the scrim element's `background-image` contains four
  colour stops; the eyebrow dot's colour = `--color-accent-on-dark`.
- A Playwright assertion that the editor hint-chip text ("Drop a photo here") appears **nowhere** in
  the DOM.
- axe zero serious/critical on `/` at 375 and 1280; no horizontal scroll at 375.
- Reduced-motion emulation: `ScrollReveal` applies no transform and no animation; the hero renders
  fully visible.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits.

## Assumptions

The design's hero photo is an unfilled `image-slot` (spec UNKNOWNS); the repo's existing
`/brand/hero-field.webp` and its translated alt are kept — no new asset is sourced.

## Evidence

_(filled in as the task runs)_
