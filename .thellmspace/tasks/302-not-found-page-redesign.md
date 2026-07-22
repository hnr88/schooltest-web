---
id: 302
title: Rebuild the 404 page as the design's full-page numeral-plus-badge composition
layer: ui
kind: implement
slice: /[locale] not-found — 110px numeral, navy search-badge, copy block, two-button action row
target: src/app/[locale]/not-found.tsx, src/modules/design-system/components/not-found-hero.tsx
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/app--404.html:1-12 · .qa/design/spec/06-auth-states-landing.md#31-full-page-404-app-404html
status: TODO
depends_on: []
---

## Objective

Replace today's compact bordered 404 card with the design's full-page 404: the oversized pale
numeral with the navy search badge sitting in the zero, a 28px headline, a 15px explanation and two
button-styled links. The route, its `notFound()` triggers and the `Common.*` copy keys are unchanged.

## Contract

n/a — presentation. Binding design text, `.qa/design/spec/06-auth-states-landing.md` §3.1:

> Frame `display:grid; place-items:center; position:relative`; logo absolutely centred `top:44px;
> left:50%; translateX(-50%); height:34px`.
> Content column: `flex column; align-items:center; gap:22px; text-align:center; max-width:520px`.
> 1. Numeral + badge composite: `font-size:110px; font-weight:700; letter-spacing:-0.04em;
>    line-height:1; color:#DBEAFE`, text `404`. Nested badge, `bottom:14px; left:50%;
>    transform:translateX(-50%)`: `width:64px; height:64px; border-radius:18px; background:#0E2350;
>    display:grid; place-items:center; box-shadow:0 8px 24px rgba(14,35,80,.25)`. Inside: a
>    **search-minus** glyph `30×30, stroke #2DD4BF, stroke-width 2`. The badge overlaps the middle
>    "0", reading as the zero.
> 2. `h1` `28px / 700 / -0.015em / #0E2350`; `p` `15px / 1.6 / #64748B`.
> 3. Action row `flex; gap:12px`; both `<a>` styled as buttons, `14.5px/600; padding:12px 24px;
>    border-radius:10px`. Primary "Go to dashboard": `#2563EB` / white, hover `#1D4ED8` + colour
>    restated. Secondary "Contact support": `#FFFFFF` / `#16326E` / `1px #CBD5E1`, hover `#F7F9FC`.

Spec §3 also records: *"Note the two 404s use different copy, different numeral treatments,
different radii (10px vs 9px buttons) and different secondary CTAs … **Pick one per context; do not
merge.**"* This route is the full-page context and takes §3.1 only. The compact card
(`ds--footers.html:78-86`) is reserved for a future in-shell 404 and is **not** built here.

## Design source

`.qa/design/screens/app--404.html`. Token map:

| Value | Token / utility |
|---|---|
| numeral `#DBEAFE` | `--color-brand-100` → `text-brand-100` |
| numeral `110px / 700 / -0.04em / line-height 1` | the `--text-*` token whose provenance is the error-code size (`--text-error-code` exists today), `font-bold tracking-tighter leading-none` |
| badge `64×64`, `radius:18px`, `background:#0E2350` | `size-16 rounded-2xl bg-navy-900` |
| badge shadow `0 8px 24px rgba(14,35,80,.25)` | `shadow-lg` (shadow-lg geometry; the design uses .25 alpha — take the `--shadow-lg` token, do not hand-roll an rgba) |
| glyph `search-minus 30×30 stroke #2DD4BF sw2` | lucide `ZoomOut className="size-7.5 text-accent-on-dark" strokeWidth={2}` (`--color-accent-on-dark` = `#2DD4BF`, already in `globals.css` with that provenance) |
| `h1` `28px / 700 / -0.015em / #0E2350` | 28px `--text-*` token, `font-bold tracking-tight text-foreground` |
| `p` `15px / 1.6 / #64748B` | `text-base leading-relaxed text-muted-foreground` |
| column `gap:22px; max-width:520px` | `gap-5.5 max-w-130` |
| logo | `height:34px`, centred above the column |
| primary button | `bg-primary text-primary-foreground hover:bg-primary-hover hover:text-primary-foreground` (colour restated, per the design), `h-11 px-6 rounded-lg text-sm font-semibold` |
| secondary button | `bg-card text-secondary-foreground border border-input hover:bg-background hover:text-secondary-foreground`, same box |

Copy stays on the existing keys: `Common.notFoundTitle`, `Common.notFoundDescription`,
`Common.backToDashboard`, `Common.reportProblem`. The primary link keeps its current `/` target and
the secondary its `mailto:support@schooltest.app` — changing either would change behaviour.

## Files

- `src/app/[locale]/not-found.tsx` (rewrite)
- `src/modules/design-system/components/not-found-hero.tsx` (new — the numeral+badge composite, so
  the route file stays under the 120-line component limit; export from
  `src/modules/design-system/index.ts`)

## Depends on

None inside W10. Wave-level: W0's type-scale and shadow tokens.

## Steps

1. Read the current `not-found.tsx`, `src/app/[locale]/error.tsx` and `src/app/global-error.tsx`
   (the last one must keep working — it deliberately renders without the locale layout).
2. Build `NotFoundHero`: a `<p role="img" aria-label="404">` carrying the three glyphs, with the
   badge absolutely positioned over the middle character. The whole composite is one accessible
   image — the numeral must not be read as three separate characters.
3. Rebuild the route: centred logo → hero → copy block → action row, `gap-5.5`, column `max-w-130`.
4. Exactly one `<h1>` on the page; the action row is two real links, never `<div onClick>`.
5. Motion: entrance `motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95
   motion-safe:duration-200 motion-safe:ease-out-expo motion-reduce:animate-none` (`st-pop-in`);
   both buttons `transition-colors duration-150` (spec §6.3 prescribes this for the 404 primary and
   secondary specifically).
6. 375px: the numeral drops to the next smaller step so the composite fits inside the viewport with
   no horizontal scroll; the action row wraps to two full-width buttons, each ≥44px.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 11, 15; file limits 200/120 lines.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, no raw rgba shadows.
- `.claude/rules/quality.md` — one `<h1>`, `role="img"` + `aria-label` on the numeral composite,
  never `<div onClick>`, visible focus on both links, ≥44px targets.
- `.claude/rules/i18n.md` — reuse the four existing `Common.*` keys; add none.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- A real Playwright run against the running app: `page.goto('/this-route-does-not-exist')` renders
  the 404 with exactly one `<h1>`, the `role="img"` "404" composite, and both action links with
  their real `href`s; the same at `/zh/this-route-does-not-exist` in Chinese.
- `pnpm exec playwright test tests/e2e/locale-routing.spec.ts tests/e2e/home.spec.ts` green — the
  locale layout still calls `notFound()` for a non-locale segment.
- Computed-style assertions: numeral colour = `--color-brand-100`; badge background =
  `--color-navy-900`; glyph colour = `--color-accent-on-dark`.
- axe zero serious/critical at 375 and 1280; no horizontal scroll at 375.
- Reduced-motion: no entrance animation, no colour transition.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits.

## Assumptions

The compact in-shell 404 (`ds--footers.html:78-86`) is a separate context and is not merged into
this one, exactly as the spec instructs. No `dashboard/not-found.tsx` exists today and none is
created here.

## Evidence

_(filled in as the task runs)_
