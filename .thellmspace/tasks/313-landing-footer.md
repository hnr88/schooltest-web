---
id: 313
title: Re-skin the marketing footer — 1.4fr brand column, three link columns, bottom bar and status chip
layer: ui
kind: implement
slice: The landing <footer> — brand blurb, social tiles, three link columns, copyright bar, status chip
target: src/modules/landing/components/LandingFooter.tsx, SocialIcons.tsx, landing.constants.ts
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/landing--cta.html:14-60 · .qa/design/screens/ds--footers.html:5-55 · .qa/design/spec/06-auth-states-landing.md#510-marketing-footer-landing-ctahtml14-60-identical-to-ds-footershtml5-55-except-the-language-select
status: TODO
depends_on: [312]
---

## Objective

Bring the landing footer to the design: a navy `minmax(0,1.4fr) repeat(3,minmax(0,1fr))` grid with
the brand blurb and three social tiles, three uppercase-headed link columns, and a bottom bar with
the copyright, three legal links and the teal "All systems operational" status chip.

## Contract

n/a — presentation. Behaviour preserved verbatim:

- Exactly one `contentinfo` landmark on the page (`tests/e2e/landing.spec.ts:97`), and it is the
  last node in the DOM chain.
- The three social links keep their individual `aria-label`s —
  `tests/e2e/landing-aria.spec.ts:22,56` resolves each by name from `en.json` and `zh.json`.
- The locale switcher currently reachable from the footer keeps working: `tests/e2e/design-system.spec.ts`
  asserts "footer locale toggle en→zh→en", and `tests/e2e/locale-routing.spec.ts` asserts the locale
  selector preserves the route. **Do not remove it.**
- Copy keys `Home.footer.*` unchanged; the link columns stay driven by `landing.constants.ts`.

## Design source

`.qa/design/screens/landing--cta.html:14-60` (spec §5.10). `footer background:#0E2350` →
`bg-navy-900`.

| Element | Value | Token / utility |
|---|---|---|
| Link grid | `max-width:1200px; margin:0 auto; padding:56px 32px 0; grid-template-columns:minmax(0,1.4fr) repeat(3,minmax(0,1fr)); gap:36px` | `max-w-landing mx-auto px-8 pt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] gap-9` |
| Brand logo | `height:30px; width:auto; filter:brightness(0) invert(1)` | existing `Logo theme="white"` |
| Blurb | `13.5px / 1.6 / #8FA3C7; max-width:240px; margin-top:14px` | `text-sm leading-relaxed text-navy-muted max-w-60 mt-3.5` |
| Social row | `gap:10px; margin-top:18px`; tile `34×34; border-radius:9px; background:#16326E; color:#A9BADC; inline-grid; place-items:center`; glyphs X `14×14` filled, YouTube `15×15` stroked, LinkedIn `14×14` stroked | `gap-2.5 mt-4.5`, tile `size-11` (≥44px target floor — the design's 34px fails WCAG 2.5.8 and `.claude/rules/quality.md`; keep the 34px *visual* box and extend the hit area with the button-variant `after:` inset the design system already uses) `rounded-lg bg-navy-800 text-navy-body` |
| Social hover | landing copy: `color:#FFFFFF`; DS copy: `background:#1A2A4E; color:#FFFFFF` — **spec says prefer the DS version** | `hover:bg-secondary-dark hover:text-white transition-colors duration-150` (`#1A2A4E` → the dark `--secondary` token) |
| Column heading | `12px / 700 / letter-spacing .08em / uppercase / #8FA3C7` | `--tracking-overline`, `text-xs font-bold uppercase text-navy-muted` |
| Column list | `gap:11px; margin-top:16px`; links `13.5px; color:#C7D6F2`, hover `#FFFFFF` | `gap-2.5 mt-4`, `text-sm text-navy-body hover:text-white transition-colors duration-150` |
| Bottom bar | `max-width:1200px; margin:36px auto 0; padding:18px 32px; border-top:1px solid #1A2A4E; flex; align-items:center; gap:20px; flex-wrap:wrap` | `mt-9 px-8 py-4.5 border-t border-secondary-dark flex flex-wrap items-center gap-5` |
| Copyright | `12.5px; #8FA3C7` — **the design hard-codes `© 2026`; spec §8.3 says "make it dynamic"** | `text-xs text-navy-muted`, year from `new Date().getFullYear()` — and because this is a non-deterministic call in a cached Server Component, call `connection()` from `next/server` first (`.claude/rules/nextjs-patterns.md`), or compute it in the page and pass it down |
| Legal links | Privacy · Terms · Security, `12.5px; #8FA3C7`, hover `#FFFFFF` | `text-xs text-navy-muted hover:text-white transition-colors duration-150` |
| Status chip | `margin-left:auto; gap:6px; 12.5px/600; color:#5EEAD4` with a `7×7; border-radius:50%; background:#2DD4BF` dot | `ms-auto gap-1.5 text-xs font-semibold text-chart-5`, dot `size-1.5 rounded-full bg-accent-on-dark` |

Column contents (spec §5.10): **Product** — Test builder · AI feedback · Analytics · Pricing;
**For schools** — Districts · Language centers · Universities · Case studies; **Company** — About ·
Blog · Careers · Contact.

Tokens: `#0E2350` → `--color-navy-900` · `#16326E` → `--color-navy-800` · `#8FA3C7` →
`--color-navy-muted` · `#A9BADC` / `#C7D6F2` → the on-navy body tokens · `#1A2A4E` → the dark
`--secondary` token · `#5EEAD4` → `--color-chart-5` · `#2DD4BF` → `--color-accent-on-dark`.

**Two design conflicts, both recorded in the spec's UNKNOWNS and resolved here:**
1. Social-tile hover differs between the two footer copies → take the DS version
   (`background:#1A2A4E; color:#FFFFFF`), as spec §5.10 instructs.
2. The DS footer shows a **language select** in the slot the live footer gives the **status chip**;
   the spec records that whether both can coexist is unstated. This app already ships a working
   locale switcher there and two e2e specs depend on it → **ship both**: the locale switcher plus
   the status chip, wrapping to two rows below `sm`. Record the decision.

The status chip's text is static copy ("All systems operational") — there is no status endpoint and
none is invented (D-SCOPE-1 §4). It must not imply a live health check; keep it a plain translated
string with no `role="status"`.

## Files

- `src/modules/landing/components/LandingFooter.tsx`
- `src/modules/landing/components/SocialIcons.tsx` (sizes only)
- `src/modules/landing/constants/landing.constants.ts` (the three column lists)

## Depends on

- **312** — the footer markup lives in the same design slice (`landing--cta.html`) and shares its
  navy surface and the `--color-navy-*` ink decisions; doing them in order keeps one set of choices.

## Steps

1. Read `LandingFooter.tsx`, `SocialIcons.tsx`, the constants file, `tests/e2e/landing-aria.spec.ts`,
   `design-system.spec.ts` and `locale-routing.spec.ts`.
2. Apply the tables; the three columns are constants arrays, never inline JSX lists.
3. Keep each social link's `aria-label` and give each tile a ≥44px hit area without changing its
   34px visual box.
4. Make the copyright year dynamic, correctly (see the `connection()` note above).
5. Motion: link and tile hovers `transition-colors duration-150`; the footer enters through the
   existing `ScrollReveal`. Nothing else — the design ships no footer motion.
6. 375px: the grid collapses to one column (brand block first), the bottom bar wraps so the locale
   switcher and the status chip sit on their own row, and every link keeps a ≥44px target.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 11, 15.
- `.claude/rules/nextjs-patterns.md` — `Date` in a cached Server Component needs `connection()`.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values.
- `.claude/rules/quality.md` — one `contentinfo`, labelled social links, ≥44px targets, AA contrast
  on navy.
- `.claude/rules/i18n.md` — `Home.footer.*` unchanged ×6 catalogs; locale-aware `<Link>` for
  internal nav.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/landing.spec.ts tests/e2e/landing-aria.spec.ts
  tests/e2e/locale-routing.spec.ts tests/e2e/design-system.spec.ts
  tests/e2e/a11y-responsive.spec.ts` green — one `contentinfo`, all three named social links in `en`
  and `zh`, and the footer locale toggle still round-trips en→zh→en preserving the route.
- Real assertions against the running app: the copyright line contains the **current** year; the
  status chip's ink = `--color-chart-5`; a social tile's hover `background-color` = the dark
  `--secondary` token; every social tile's hit box is ≥44×44 at 375 and 1280.
- axe zero serious/critical at 375 and 1280; no horizontal scroll at 375.
- Reduced-motion: no entrance animation, no hover transition.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits.

## Assumptions

Both the locale switcher and the status chip ship in the bottom bar; the design's two footer copies
disagree and the spec leaves it open, so the app's existing (tested) behaviour wins and the addition
is the design's chip, not a removal.

## Evidence

_(filled in as the task runs)_
