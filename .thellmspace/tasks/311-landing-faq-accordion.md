---
id: 311
title: Re-skin the FAQ accordion, with the chevron rotation the design actually declares
layer: ui
kind: implement
slice: #resources — a 760px single-open accordion with four items, first open on load
target: src/modules/landing/components/FaqSection.tsx, src/modules/landing/constants/landing.constants.ts
contract: n/a (pure presentation — design spec quoted below)
design: .qa/design/screens/landing--faq.html:1-12 · .qa/design/spec/06-auth-states-landing.md#58-faq-landing-faqhtml--interactive-accordion
status: TODO
depends_on: []
---

## Objective

Bring `#resources` to the design: a narrow 760px rail holding a white `radius:18px` list whose rows
are separated by hairlines, with a 15.5px question row, a rotating chevron, and the first item open
on load.

## Contract

n/a — presentation. Behaviour preserved and made design-true:

- The section keeps `id="resources"` and its DOM-chain position (`landing.spec.ts:103-117`).
- The accordion stays the shadcn/Radix `Accordion` already wrapped by
  `@/modules/design-system` — never a hand-rolled `<details>` and never an edit to
  `src/components/ui/accordion.tsx` (CLAUDE.md law 11).
- `FAQ_ITEMS` in `landing.constants.ts` stays the source of the four Q/A pairs; keys
  `Home.faq.*` unchanged.

**Design behaviour to adopt** (`SchoolTest Landing.dc.html:324, 336-341`, spec §5.8):

> single-open accordion, `state.faqOpen = 0` (first item open on load); clicking the open item sets
> `faqOpen = -1` (closes all).

Today the component passes `defaultValue={[FAQ_ITEMS[0].value]}` to a multi-open `Accordion`. Make it
**single-open + collapsible** so both design behaviours hold: opening item 2 closes item 1, and
clicking the open item closes it.

## Design source

`.qa/design/screens/landing--faq.html` (spec §5.8). Section `max-width:760px; margin:0 auto;
padding:88px 32px 0` — narrower than every other section → `max-w-190 mx-auto px-8 pt-22`.

| Element | Value | Token / utility |
|---|---|---|
| `h2` | `32px / 700 / -0.02em / #0E2350; text-align:center` | the 32px `--text-h2`-family token, `font-bold tracking-tight text-foreground text-center` |
| List container | `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:18px; padding:8px 4px; margin-top:36px` | `bg-card border border-border rounded-2xl px-1 py-2 mt-9` |
| Row separator | `border-top:1px solid #F1F5F9` on every item (so the first also shows a rule inside the 8px top padding) | `border-t border-muted` on each item, including the first |
| Question button | `flex; align-items:center; justify-content:space-between; gap:14px; padding:18px 22px; cursor:pointer; user-select:none`; text `15.5px / 600 / #0E2350` | `flex items-center justify-between gap-3.5 px-5.5 py-4.5 text-base font-semibold text-foreground text-left`, min height ≥44px |
| Chevron | `svg 16×16, stroke #64748B, stroke-width 2.2, flex:none`; `rotate(0deg)` ↔ `rotate(180deg)`; **`transition:transform .2s`** | lucide `ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none"`, `data-[state=open]:rotate-180` |
| Answer | `padding:0 22px 20px; 14.5px / 1.65 / #64748B` — **rendered only when open; no height animation** | `px-5.5 pb-5 text-sm leading-relaxed text-muted-foreground` |

Tokens: `#E3E8F0` → `--color-border` · `#F1F5F9` → `--color-muted` · `#64748B` →
`--color-muted-foreground` · `#0E2350` → `--color-foreground`.

**Motion boundary the design draws explicitly** (spec §5.8): *"No height animation — the panel is
mounted/unmounted; only the chevron animates."* If the wrapped Radix accordion ships a height
transition by default, disable it on this instance rather than fighting it — `.claude/rules/tailwind.md`
forbids animating height anyway, so the design and the rule agree.

## Files

- `src/modules/landing/components/FaqSection.tsx`
- `src/modules/landing/constants/landing.constants.ts` (unchanged content; verify the four items)

## Depends on

None inside W10.

## Steps

1. Read `FaqSection.tsx`, the design-system accordion wrapper, and `tests/e2e/landing.spec.ts` +
   `a11y-responsive.spec.ts`.
2. Switch the accordion to single-open + collapsible with the first item's value as the default.
3. Apply the table; every item carries the top hairline, including the first.
4. Motion: chevron rotation only, `transition-transform duration-200 ease-out` with
   `motion-reduce:transition-none`; the panel mounts/unmounts with no height animation. The section
   itself enters through the existing `ScrollReveal`.
5. 375px: the rail is `px-5`, question rows keep ≥44px height and wrap to two lines without pushing
   the chevron out of the row; the chevron never shrinks (`shrink-0`).

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 4, 11 (never edit `src/components/ui/*`), 15.
- `.claude/rules/tailwind.md` — **never animate height**; animate transform/opacity only; tokens
  only, no arbitrary values.
- `.claude/rules/quality.md` — the question is a real `button` with correct `aria-expanded` /
  `aria-controls` (Radix provides this); keyboard operable; visible focus.
- `.claude/rules/i18n.md` — `Home.faq.*` unchanged ×6 catalogs.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/landing.spec.ts tests/e2e/a11y-responsive.spec.ts
  tests/e2e/design-system.spec.ts` green.
- Real behaviour assertions against the running app: on load, item 1's panel is visible and its
  trigger has `aria-expanded="true"`; clicking item 2 opens it **and closes item 1**; clicking item
  2 again closes it, leaving zero panels open; keyboard: `Tab` to a trigger, `Enter`/`Space`
  toggles it.
- Computed-style assertion that the open item's chevron has `transform` containing a 180° rotation
  and `transition-duration` `0.2s`, and that the panel has **no** height transition.
- Under `prefers-reduced-motion: reduce`, the chevron's `transition-duration` is `0s` and the open/
  close still works.
- axe zero serious/critical at 375 and 1280; no horizontal scroll at 375.
- Six catalogs key-identical; no key added.
- Zero banned-pattern grep hits.

## Assumptions

Switching from multi-open to single-open is a design-mandated behaviour change (§5.8), not a
regression; no existing spec asserts multi-open, which must be confirmed by grep before the change.

## Evidence

_(filled in as the task runs)_
