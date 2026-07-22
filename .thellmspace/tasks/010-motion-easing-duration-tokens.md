---
id: 010
title: Land the exponential easing tokens and publish the design's five canonical transition durations
layer: ui
kind: implement
slice: The motion vocabulary — `--ease-out-quart` / `--ease-out-quint` alongside the existing expo, and the binding duration map for every transition the design declares
target: src/app/globals.css (`@theme inline`), src/lib/utils.ts (`THEME_CLASS_GROUPS['ease']`), tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/spec/04-ds-foundations.md#0-2-keyframes-the-complete-animation-inventory (the transition table) and #TAILWIND-V4-MAPPING-I · .qa/design/screens/ds--buttons.html:8-14 · ds--forms.html:8,25,39,47,53,66,70,77,81
status: TODO
depends_on: []
---

## Objective

Before any keyframe or any component transition is written, the wave needs one vocabulary: which
easing curve, at which duration, for which interaction. The design declares five transitions and
names no easing function on any of them; `.claude/rules/tailwind.md:10` mandates exponential
easings. This slice lands the two missing curves and publishes the mapping, so 200+ later tasks do
not each pick a number.

## Contract

n/a. Binding source, quoted from `.qa/design/spec/04-ds-foundations.md` §0.2:

> **Transitions declared inside the eight foundation slices** (there are only five distinct ones):
>
> | Transition | Where |
> |---|---|
> | `background .15s` | all 7 filled/outline/ghost button variants `[BTN:8–14]` |
> | `border-color .15s, box-shadow .15s` | text input, search input, textarea `[FRM:8,25,39]` |
> | `all .15s` | checkbox box `[FRM:47,53]`, radio ring + radio dot `[FRM:66,70]` |
> | `background .18s` | switch track `[FRM:77,81]` |
> | `transform .18s` | switch knob `[FRM:77,81]` |
>
> "No easing function is named on any of them → they all use the CSS default `ease`."

and §I:

> "The design uses default `ease`/`linear` only. `.claude/rules/tailwind.md:20` mandates exponential
> easings; that is a deliberate **upgrade**, not a port."

## Design source

**Tokens to add to `@theme inline`** (`--ease-out-expo` already exists at
`cubic-bezier(0.16, 1, 0.3, 1)` and is registered):

| Token | Value | Role |
|---|---|---|
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | the default for every state transition and every enter animation — the design's `ease`, upgraded |
| `--ease-out-quint` | `cubic-bezier(0.22, 1, 0.36, 1)` | overlay and sheet enter/exit, where a longer settle reads better |

**No `--ease-design: ease` token is emitted.** Spec §I suggests emitting it "so the port is
auditable", but an `--ease-*` token with no consumer fails the `ease` classGroup parity contract's
intent (every declared token is a registered, usable utility) and would be dead weight. The audit
record lives in this file and in the task Evidence instead.

**The binding duration map.** Tailwind v4 generates `duration-<n>` for any integer, so no
`--duration-*` token namespace is needed and no bracket value is ever required:

| Design transition | Property set | Duration | Class to write |
|---|---|---|---|
| button fill `[BTN:8-14]` | background-color | 150ms | `transition-colors duration-150 ease-out-quart` |
| input border + ring `[FRM:8,25,39]` | border-color, box-shadow | 150ms | `transition-[color,border-color,box-shadow] duration-150 ease-out-quart` → **write as** `transition-colors duration-150 ease-out-quart` plus `transition-shadow` where needed; never a bracket list |
| checkbox / radio `[FRM:47,53,66,70]` | `all` | 150ms | `transition duration-150 ease-out-quart` |
| switch track `[FRM:77,81]` | background-color | 180ms | `transition-colors duration-180 ease-out-quart` |
| switch knob `[FRM:77,81]` | transform | 180ms | `transition-transform duration-180 ease-out-quart` |
| dialog scrim / panel `[SRC:1513-1514]` | opacity / opacity+scale | 180ms | see 011 |
| toast enter `[SRC:1527]` | opacity + translateY | 250ms | see 011 |
| spinner `[SRC:1580]` | rotate | 700ms linear infinite | see 011 |
| skeleton sweep `[SRC:1327-1334]` | sheen | 1400ms ease infinite | see 012 |

**Rule reconciliation, recorded once.** `.claude/rules/tailwind.md:9` allows animating `transform`
and `opacity` ONLY. Three of the five design transitions animate colour (`background`,
`border-color`) and one animates `box-shadow`. Resolution per spec §I.1–2: a **colour** transition
is retained as a documented exception — it is not a layout-triggering property, it is what the
design declares, and `.claude/rules/quality.md`'s AA requirements make an opacity-layered substitute
worse (a faded overlay changes the effective contrast mid-transition). `box-shadow` on the input
focus ring is likewise retained; 013 owns that decision. What is NOT permitted anywhere in this
mission: transitioning `width`, `height`, `padding`, `margin`, `top/left`, or `border-radius`.

**`transition: all` is refused.** `[FRM:47,53,66,70]` declares `all .15s` on the checkbox and radio.
Tailwind's bare `transition` utility is a curated property list (colour, opacity, shadow, transform,
filter, backdrop-filter), not `all`; that is the compliant equivalent and is what W1 writes.

**Mobile.** Durations are viewport-invariant. What is not: a 180ms transform on a touch device
must not delay the visual acknowledgement of a tap. No duration above 250ms is permitted on a
control's own state change at any viewport — recorded here as the wave-wide ceiling.

## Files

- `src/app/globals.css` — two lines in `@theme inline`, beside `--ease-out-expo`.
- `src/lib/utils.ts` — add `'out-quart'`, `'out-quint'` to `THEME_CLASS_GROUPS['ease']`.
  **Mandatory**: the `ease` group currently lists only `'out-expo'` and the parity test in
  `design-tokens.spec.ts` fails on any unregistered `--ease-*` token.
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: motion vocabulary` block.

## Depends on

Nothing. (011 and 012 consume these curves; 013's focus ring uses the 150ms step.)

## Steps

1. Add the two easing tokens with provenance comments naming the design transition each serves.
2. Register both names in `src/lib/utils.ts`.
3. Extend the e2e.
4. Change no component. The existing `ease-out-expo` consumers (search chips, sort menus,
   pagination, map skin) stay exactly as they are — CLAUDE.md law 3.

## Project rules

- `.claude/rules/tailwind.md:9` — transform/opacity only, with the two colour exceptions recorded
  above and nowhere else.
- `.claude/rules/tailwind.md:10` — exponential easings only. `ease-out-quart` / `-quint` / `-expo`
  are the complete permitted set for this mission; `ease-linear` is permitted only for the
  continuous spinner (`[SRC:1580]` declares `linear` explicitly).
- `.qa/DECISIONS.md` **D-DESIGN-3** — motion is authored from the design system's own six keyframes
  plus Tailwind transitions, never a new dependency, always with a `prefers-reduced-motion` variant.
- `src/lib/utils.ts` docstring — registration is binding.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright on `/design-system`: `--ease-out-quart` and `--ease-out-quint` resolve to the exact
  cubic-bezier strings; an injected probe with `class="transition-colors duration-150 ease-out-quart"`
  computes `transition-duration: 0.15s` and
  `transition-timing-function: cubic-bezier(0.25, 1, 0.5, 1)`.
- `duration-180`, `duration-250`, `duration-700`, `duration-1400` probes each compute the matching
  `transition-duration` — the proof that no bracket value is ever needed for the design's durations.
- The `ease` classGroup parity test passes with both names registered, and a probe with
  `class="ease-out-expo ease-out-quart"` computes the quart curve (tailwind-merge proof).
- **Reduced motion**: under `page.emulateMedia({ reducedMotion: 'reduce' })`, an existing
  `motion-reduce:transition-none` consumer — `src/modules/search-shared/lib/chip-variants.ts`
  renders one on `/dashboard/search` — computes `transition-duration: 0s`. This asserts the
  repo-wide convention these curves plug into still holds.
- 375 and 1280: identical computed values.
- axe zero serious/critical on `/design-system` at both viewports.
- No i18n change; six catalogs key-identical at 1151.
- Zero banned-pattern grep hits — in particular zero `duration-[…]` or `ease-[…]` brackets.
- Full suite at the 157-pass baseline.

## Assumptions

- `--ease-design: ease` is deliberately not emitted; the port audit lives in this file. Stated so a
  later reviewer does not read its absence as an omission of spec §I.
- The 250ms ceiling for control state changes is an engineering decision the design does not make
  (its longest control transition is 180ms; only the toast enter reaches 250ms). Recorded here so
  it is made once.

## Evidence

<!-- resolved easing strings, probe transition-duration/timing-function per step, the merge probe,
     the reduced-motion assertion on a real chip, parity output, suite count -->
