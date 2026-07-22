---
id: 307
title: Re-skin the feature-detail split and its AI-feedback mock panel with real meter semantics
layer: ui
kind: implement
slice: #ai-feedback — teal eyebrow, 32px h3, check list, and the gradient panel with three score meters
target: src/modules/landing/components/FeatureDetailSection.tsx, src/modules/landing/components/AiFeedbackCard.tsx
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/landing--feature-detail.html:1-27 · .qa/design/spec/06-auth-states-landing.md#54-feature-detail-landing-feature-detailhtml
status: TODO
depends_on: []
---

## Objective

Bring `#ai-feedback` to the design: a `1fr / 1.1fr` split with a teal eyebrow, a 32px headline and a
three-item green check list on the left, and on the right the blue→teal gradient panel holding the
BETA badge, three score tiles with meters, and the highlighted-suggestion card.

## Contract

n/a — presentation. Behaviour preserved verbatim:

- The section keeps `id="ai-feedback"` and its place in the DOM chain (`landing.spec.ts:103-117`).
- The three meters keep `role="progressbar"` with the accessible names
  `tests/e2e/landing-aria.spec.ts:37` looks up from `en.json` and `zh.json` — a progressbar without
  an accessible name is a failure of that spec.
- Copy keys `Home.featureDetail.*` unchanged; `FEATURE_CHECKLIST` in `landing.constants.ts` stays
  the source of the three check rows.

## Design source

`.qa/design/screens/landing--feature-detail.html` (spec §5.4). Container `max-width:1200px;
padding:88px 32px 0; grid-template-columns:minmax(0,1fr) minmax(0,1.1fr); gap:56px;
align-items:center` → `max-w-landing px-8 pt-22 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-14 items-center`.

**Left column**

| Element | Value | Token / utility |
|---|---|---|
| Eyebrow | `12.5px/700; .1em; uppercase; color:#0D9488` (teal here, blue in Features) | `--tracking-eyebrow`, `text-xs font-bold uppercase text-accent-600` |
| `h3` | `32px / 1.18 / 700 / -0.02em / #0E2350; text-wrap:balance; margin-top:14px` | the 32px `--text-h3` token, `font-bold text-balance text-foreground mt-3.5` |
| `p` | `15.5px / 1.65 / #64748B; text-wrap:pretty; margin-top:16px` | `text-base leading-relaxed text-muted-foreground text-pretty mt-4` |
| Check list | `gap:12px; margin-top:22px`; row `gap:10px; 14.5px; #0E2350`; check `svg 16×16, stroke #16A34A, stroke-width 2.6` | `gap-3 mt-5.5`, `gap-2.5 text-sm text-foreground`, lucide `Check className="size-4 text-success" strokeWidth={2.6}` |

**Right panel**

| Element | Value | Token / utility |
|---|---|---|
| Panel | `background:linear-gradient(135deg,#EFF5FF 0%,#F0FDFA 100%); border:1px solid #BFDBFE; border-radius:24px; padding:28px` | gradient from `--color-brand-50` → `--color-accent-50` via a `@theme` `--background-image-*` entry (the repo already uses this pattern for `--background-image-cta-gradient`); border `#BFDBFE` has **no token** (spec §0.2 records it as a missing colour) → add `--color-panel-edge` with that hex's OKLCH, provenance-commented |
| Header row | glyph tile `32×32; radius:10px; background:#0E2350` + sparkle `16×16 stroke #5EEAD4 sw2`; title `15px/700/#0E2350`; BETA badge `11px/700; .05em; color:#0D9488; background:#CCFBF1; padding:3px 8px; radius:999px; margin-left:auto` | `size-8 rounded-lg bg-navy-900`, `text-chart-5`; badge `bg-accent-100 text-accent-600 rounded-full px-2 py-0.5 text-xs font-bold ms-auto` |
| Score tiles | `grid repeat(3,minmax(0,1fr)); gap:12px; margin-top:16px`; tile `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:12px; padding:13px 14px`; label `12px/#64748B`; value `20px/700/#0E2350; margin-top:2px`; meter track `margin-top:7px; height:5px; radius:999px; background:#EEF2F7`; fill `height:100%; radius:999px` | `grid-cols-3 gap-3 mt-4`, `bg-card border border-border rounded-tile p-3.5`, track `h-1.5 rounded-full bg-rule` |
| Tile values | Grammar `8.5` → `85%` fill `#2563EB` · Vocabulary `7.0` → `70%` `#14B8A6` · Coherence `6.5` → `65%` `#0E2350` | `--color-chart-1` / `--color-chart-2` / `--color-chart-3`; widths `w-[85%]`-style arbitrary values are banned → drive the fill width from an inline `style={{ inlineSize: … }}` computed from the value, which is data, not a utility |
| Suggestion card | `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:12px; padding:14px 15px; margin-top:12px`; text `13px/1.6/#475569`; the highlighted token `font-weight:600; color:#0E2350; background:#CCFBF1; padding:1px 6px; border-radius:5px` | `bg-card border border-border rounded-tile p-3.5 mt-3`, `text-sm leading-relaxed text-body`; chip `bg-accent-100 text-foreground font-semibold rounded-sm px-1.5` |

**These three scores are static marketing artwork, not data.** Spec §8.1 lists them as "AI rubric
sub-score", but no parent-reachable endpoint returns a 0–10 rubric score, and
`.qa/CONTRACTS.md` B-3/B-4/B-5 forbid composite scores entirely. They therefore stay **hard-coded
demo values in `landing.constants.ts`**, exactly as they are today, and must never be wired to an
API. Format rule from the spec is kept: one decimal on a 0–10 scale, `fill width = value × 10 %`.

## Files

- `src/modules/landing/components/FeatureDetailSection.tsx`
- `src/modules/landing/components/AiFeedbackCard.tsx`
- `src/modules/landing/constants/landing.constants.ts` (the three tiles)
- `src/app/globals.css` (`--color-panel-edge` + the panel gradient entry, both provenance-commented)

## Depends on

None inside W10.

## Steps

1. Read both components, the constants file and `tests/e2e/landing-aria.spec.ts` (it names each
   progressbar).
2. Apply the left-column table; the check icons are `aria-hidden="true"`.
3. Apply the panel table; each meter is a `role="progressbar"` with `aria-valuenow` (the score ×10),
   `aria-valuemin={0}`, `aria-valuemax={100}` and the existing accessible name key.
4. Motion: the section enters through the existing `ScrollReveal`; the meter fills animate width
   **only if** it can be done as a transform — it cannot without distortion, so **do not animate the
   meters**. `.claude/rules/tailwind.md` forbids animating width, and spec §6.4 records that no
   counter or meter animation exists in the design. The panel gets the reveal; the numbers do not
   count up.
5. 375px: single column, panel first-or-second per reading order (text first), score tiles stay a
   3-up grid but drop to `p-3`, no horizontal scroll.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 11, 14, 15.
- `.claude/rules/tailwind.md` — **never animate width**; tokens only; no arbitrary utility values
  (a computed inline `style` for a data-driven bar width is data, not a utility, and is the
  sanctioned escape).
- `.claude/rules/quality.md` — progressbars carry name + value; decorative glyphs are hidden.
- `.claude/rules/i18n.md` — `Home.featureDetail.*` unchanged ×6 catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/landing.spec.ts tests/e2e/landing-aria.spec.ts` green —
  all three named progressbars resolve in `en` and `zh`.
- Real assertions against the running app: each meter's `aria-valuenow` is 85 / 70 / 65 and its
  rendered fill width is that percentage of its track (±1px); the BETA badge's computed
  `background-color` = `--color-accent-100`.
- A grep proving no query/mutation hook was added to `src/modules/landing/**` — the module must stay
  API-free (`.qa/intake/web-inventory.md` §2: "**No API calls anywhere in this module.**").
- axe zero serious/critical at 375 and 1280; no horizontal scroll at 375.
- Reduced-motion: the panel appears with no animation; no meter animates in either mode.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits (the new `--color-panel-edge` carries its hex only inside a
  provenance comment, per D-DESIGN-2).

## Assumptions

`#BFDBFE` has no entry in `tokens.css`; adding it as a provenance-commented `@theme` token is the
D-DESIGN-2 route and is preferred over an arbitrary value.

## Evidence

_(filled in as the task runs)_
