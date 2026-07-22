---
id: 308
title: Re-skin the navy stats band with its logo watermark and three coloured figures
layer: ui
kind: implement
slice: [data-slot=stats-band] — the 28px-radius navy panel holding three 48px statistics
target: src/modules/landing/components/StatsBand.tsx, src/modules/landing/constants/landing.constants.ts
contract: n/a (pure presentation — design spec quoted below; the figures are static marketing copy)
design: .qa/design/screens/landing--stats.html:1-6 · .qa/design/spec/06-auth-states-landing.md#55-stats-band-landing-statshtml
status: TODO
depends_on: []
---

## Objective

Bring the stats band to the design: a navy `radius:28px` panel with the logo mark watermark bleeding
off its bottom-right corner and three 48px figures — white, teal, pale blue — each over a
`#8FA3C7` label.

## Contract

n/a — presentation. Behaviour preserved verbatim:

- The band keeps `data-slot="stats-band"` — `tests/e2e/landing.spec.ts:103-117` uses it as the DOM
  chain link between `#ai-feedback` and `#for-schools`.
- Copy keys `Home.stats.*` unchanged.

**The three figures are static marketing copy and stay that way.** `.qa/design/spec/06-auth-states-landing.md`
§8.1 attributes them to real sources ("lifetime count of submitted test sessions", "agreement rate
between AI draft scores and teacher-released scores", "mean weekly grading time saved per teacher"),
but **no such endpoint exists** — `.qa/intake/web-inventory.md` §3 lists every hook the app has and
none of them is a public marketing aggregate, and `src/modules/landing` is deliberately API-free.
Per `.qa/DECISIONS.md` D-SCOPE-1 §4 ("do not invent") they remain translated strings in the six
catalogs, exactly as today. **Do not create an endpoint, a query hook or a "cached stats" JSON for
them, and do not animate them counting up.**

## Design source

`.qa/design/screens/landing--stats.html` (spec §5.5). Section `max-width:1200px; margin:88px auto 0;
padding:0 32px` → `max-w-landing mx-auto mt-22 px-8`.

| Element | Value | Token / utility |
|---|---|---|
| Band | `background:#0E2350; border-radius:28px; padding:56px 40px; grid repeat(3,minmax(0,1fr)); gap:32px; text-align:center; position:relative; overflow:hidden` | `bg-navy-900 rounded-4xl px-10 py-14 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center relative overflow-hidden` (use the radius token whose provenance is 28px) |
| Watermark | `assets/logo-mark.png`, `position:absolute; right:-40px; bottom:-46px; height:220px; opacity:.10; filter:brightness(0) invert(1)` | `next/image` with explicit `width`/`height`, `aria-hidden="true"`, `absolute -right-10 -bottom-11.5 h-55 opacity-10 brightness-0 invert pointer-events-none` |
| Stat value | `48px / 700 / letter-spacing -0.03em` | the 48px `--text-stat-xl` token, `font-bold tracking-tight` |
| Stat label | `14px; color:#8FA3C7; margin-top:6px` | `text-sm text-navy-muted mt-1.5` |

| Value | Colour | Token | Label |
|---|---|---|---|
| `2.4M` | `#FFFFFF` | `text-white` | tests delivered |
| `98%` | `#5EEAD4` | `--color-chart-5` → `text-chart-5` | grading accuracy |
| `6 hrs` | `#93C5FD` | `--color-chart-4` → `text-chart-4` | saved per teacher, weekly |

Tokens: `#0E2350` → `--color-navy-900` · `#8FA3C7` → `--color-navy-muted`.

## Files

- `src/modules/landing/components/StatsBand.tsx`
- `src/modules/landing/constants/landing.constants.ts` (the three `{ valueKey, labelKey, tone }`
  entries)

## Depends on

None inside W10.

## Steps

1. Read `StatsBand.tsx`, the constants file and `tests/e2e/landing.spec.ts`.
2. Apply the table; the three stats come from a typed constants array with a `tone` union, mapped to
   the three ink classes — no per-index branching in JSX.
3. The watermark is decorative: `aria-hidden="true"`, `pointer-events-none`, and must never create
   horizontal scroll (`overflow-hidden` on the band is what contains its negative offsets).
4. Motion: the band enters through the existing `ScrollReveal` (opacity + translate only, already
   reduced-motion gated). **No count-up** — spec §6.4 records that the design ships no counter
   animation, and an animated figure that is static marketing copy would misrepresent it as live.
5. 375px: the three stats stack to one column with `gap-8`; the watermark stays clipped; the 48px
   figure steps down via the fluid token, never a second hard-coded size.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 15.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, animate transform/opacity only.
- `.claude/rules/quality.md` — `next/image` with `width`/`height` for the watermark; decorative
  images carry empty alt + `aria-hidden`.
- `.claude/rules/i18n.md` — `Home.stats.*` unchanged ×6 catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/landing.spec.ts tests/e2e/a11y-responsive.spec.ts` green —
  `[data-slot=stats-band]` present once and in chain order, `en` and `zh` copy.
- Computed-style assertions against the running app: band `background-color` = `--color-navy-900`
  and `border-radius` = 28px; the second figure's colour = `--color-chart-5` and the third's =
  `--color-chart-4`; the watermark's `opacity` is `0.1`.
- No horizontal scroll at 375 **or** 1280 (the negative-offset watermark is the specific risk).
- A grep proving `src/modules/landing/**` still contains no `useQuery`/`useMutation`/`strapi` import.
- axe zero serious/critical at 375 and 1280 — including the contrast of `--color-navy-muted` on
  `--color-navy-900`.
- Reduced-motion: no entrance animation.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits.

## Assumptions

The figures stay marketing copy. If a public metrics endpoint is ever built, this task's constants
array is the single place to rewire — recorded, not faked.

## Evidence

_(filled in as the task runs)_
