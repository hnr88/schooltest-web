---
id: 309
title: Re-skin the how-it-works steps card and the testimonial card beside it
layer: ui
kind: implement
slice: #for-schools — a 1.15fr steps card and a 1fr testimonial card, stretched to equal height
target: src/modules/landing/components/HowItWorksSection.tsx, src/modules/landing/components/TestimonialCard.tsx
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/landing--how-it-works.html:1-35 · .qa/design/spec/06-auth-states-landing.md#56-how-it-works--testimonial-landing-how-it-workshtml
status: TODO
depends_on: []
---

## Objective

Bring `#for-schools` to the design: a soft `#F7F9FC` steps card with three blue numbered tiles beside
a white testimonial card carrying five amber stars, a 19px quote and a teal initials avatar.

## Contract

n/a — presentation. Behaviour preserved verbatim:

- The section keeps `id="for-schools"` and its DOM-chain position (`landing.spec.ts:103-117`).
- The star rating keeps `role="img"` with the accessible name `Home.testimonial.ratingLabel` —
  `tests/e2e/landing-aria.spec.ts:25,49` looks it up in `en` and `zh`. Five separate star glyphs
  must **not** be five separate accessible nodes.
- `HOW_IT_WORKS_STEPS`, `TESTIMONIAL_INITIALS` (`'LP'`) and `TESTIMONIAL_STAR_COUNT` (`5`) in
  `landing.constants.ts` stay the source; the initials are locale-invariant by design and the
  existing comment says so — keep it.
- Copy keys `Home.howItWorks.*` and `Home.testimonial.*` unchanged.

## Design source

`.qa/design/screens/landing--how-it-works.html` (spec §5.6). Section `max-width:1200px; padding:88px
32px 0`; inner `grid-template-columns:minmax(0,1.15fr) minmax(0,1fr); gap:20px;
align-items:stretch` → `max-w-landing mx-auto px-8 pt-22 grid grid-cols-1
lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-5 items-stretch`.

**Steps card** (`:3-19`)

| Element | Value | Token / utility |
|---|---|---|
| Card | `background:#F7F9FC; border:1px solid #EEF2F7; border-radius:24px; padding:36px` | `bg-background border border-rule rounded-3xl p-9` |
| Eyebrow | `12.5px/700; .1em; uppercase; #2563EB` | `--tracking-eyebrow`, `text-xs font-bold uppercase text-primary` |
| Steps list | `gap:26px; margin-top:26px`; row `gap:18px; align-items:flex-start` | `gap-6.5 mt-6.5`, `flex gap-4.5 items-start` |
| Number tile | `36×36; border-radius:11px; background:#2563EB; color:#fff; 15px/700; flex:none` | `size-9 rounded-segment bg-primary text-primary-foreground text-base font-bold shrink-0 inline-grid place-items-center` (`--radius-segment` = 11px) |
| Step title | `16.5px / 700 / #0E2350` | `text-base font-bold text-foreground` |
| Step body | `14px / 1.6 / #64748B; margin-top:4px` | `text-sm leading-relaxed text-muted-foreground mt-1` |

**Testimonial card** (`:20-35`)

| Element | Value | Token / utility |
|---|---|---|
| Card | `background:#FFFFFF; border:1px solid #EEF2F7; border-radius:24px; padding:36px; flex column; justify-content:space-between; box-shadow:0 2px 8px rgba(14,35,80,.05)` | `bg-card border border-rule rounded-3xl p-9 flex flex-col justify-between shadow-md` |
| Star row | `gap:2px`; 5 × `svg 16×16 fill="#F59E0B"` — rating hard-coded 5/5, no half-star artwork | `gap-0.5`, `size-4`, fill `--color-warning` (dark-palette `#F59E0B`; use the token whose provenance records that hex); wrapper `role="img"` + `aria-label`, glyphs `aria-hidden` |
| Quote | `19px / 1.55 / #0E2350; margin-top:18px; text-wrap:pretty` | the `--text-quote` token, `text-foreground mt-4.5 text-pretty` |
| Attribution row | `gap:12px; margin-top:24px` | `flex items-center gap-3 mt-6` |
| Avatar | `44×44; border-radius:50%; background:#14B8A6; color:#fff; 14px/700` | `size-11 rounded-full bg-accent-500 text-white text-sm font-bold inline-grid place-items-center` |
| Name | `14.5px / 600 / #0E2350` | `text-sm font-semibold text-foreground` |
| Role | `13px / #94A3B8` | `text-xs text-muted-foreground-soft` |

Tokens: `#F7F9FC` → `--color-background` · `#EEF2F7` → `--color-rule` · `#2563EB` →
`--color-primary` · `#14B8A6` → `--color-accent-500` · `#94A3B8` →
`--color-muted-foreground-soft` · `#F59E0B` → `--color-warning` (dark palette provenance).

## Files

- `src/modules/landing/components/HowItWorksSection.tsx`
- `src/modules/landing/components/TestimonialCard.tsx`

## Depends on

None inside W10.

## Steps

1. Read both components, the constants file and `tests/e2e/landing-aria.spec.ts`.
2. Apply both tables; the two cards stretch to equal height via `items-stretch` + `h-full`.
3. Keep the star row a single `role="img"` node with the translated rating label; the five glyphs
   inside are `aria-hidden="true"`.
4. Motion: each card enters through the existing `ScrollReveal` with an 80ms stagger between them.
   No hover motion is declared for these two cards in the design (§6.2 lists only the 3-up feature
   cards) — do not invent one.
5. 375px: one column, cards `p-6`, the number tiles stay 36px and the step text wraps cleanly; the
   quote steps down via the fluid token.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 15.
- `.claude/rules/tailwind.md` — tokens only, no arbitrary values, animate transform/opacity only.
- `.claude/rules/quality.md` — the rating is one named image, not five; contrast AA on both cards.
- `.claude/rules/i18n.md` — `Home.howItWorks.*` / `Home.testimonial.*` unchanged ×6 catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/landing.spec.ts tests/e2e/landing-aria.spec.ts` green —
  the named rating image resolves in `en` and `zh`, `#for-schools` present once and in chain order.
- Real assertions against the running app: exactly **one** node with `role="img"` and the rating
  name inside the testimonial; the avatar's computed `background-color` = `--color-accent-500`; the
  two cards' rendered heights are equal at 1280px.
- axe zero serious/critical at 375 and 1280; no horizontal scroll at 375.
- Reduced-motion: no entrance animation on either card.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits.

## Assumptions

The 5/5 rating and the person ("Lena Petrova", "LP", "English teacher, Lyceum 14") are the design's
static marketing copy (spec §8.3/§8.4) and stay as translated strings — no review API exists and
none is invented.

## Evidence

_(filled in as the task runs)_
