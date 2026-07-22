---
id: 012
title: Re-author `st-shimmer` and `st-rec-pulse` to animate transform/opacity only, preserving the shipped skeleton visual
layer: ui
kind: fix
slice: The two design keyframes that break the transform/opacity rule — the skeleton sweep re-cut as a translated overlay, and the record pulse as a scaled ring
target: src/app/globals.css (`@keyframes st-shimmer`, `@utility shimmer-sweep`, new `st-rec-pulse`), src/lib/utils.ts, tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/spec/04-ds-foundations.md#0-2-keyframes-the-complete-animation-inventory (`st-shimmer`, `st-rec-pulse`) and #TAILWIND-V4-MAPPING-I items 3 and 4
status: TODO
depends_on: ['010', '011']
---

## Objective

Two of the design's six keyframes animate properties `.claude/rules/tailwind.md:9` forbids —
`background-position` and `box-shadow`. Spec §I names the compliant substitute for each. `st-shimmer`
already ships in this repo in its non-compliant form with 5 live consumers; re-cut it without moving
a pixel of the visual, and land `st-rec-pulse` compliantly so the six-keyframe inventory is complete.

## Contract

n/a. Binding source, quoted from `.qa/design/spec/04-ds-foundations.md` §0.2 and §I:

> | `st-shimmer` | `0% { background-position:-400px 0 } 100% { background-position:400px 0 }` |
> | background-position | skeletons `1.4s ease infinite` `[SRC:1327–1334]` |
> | `st-rec-pulse` | `0% { box-shadow:0 0 0 0 rgba(220,38,38,.35) } 70% { box-shadow:0 0 0 16px rgba(220,38,38,0) } 100% { box-shadow:0 0 0 0 rgba(220,38,38,0) }` | box-shadow ring | record button `1.5s ease-out infinite` |
>
> §I: "`.claude/rules/tailwind.md:19` allows animating **transform and opacity only**. …
> 3. `st-shimmer` animates `background-position` → replace with a translated overlay element
>    (`transform: translateX()`).
> 4. `st-rec-pulse` animates `box-shadow` → replace with a scaled + faded pseudo-element ring."

## Design source

**A — `st-shimmer`, re-cut.** Current shipped form in `src/app/globals.css`:

```
@keyframes st-shimmer { 0% { background-position: -400px 0 } 100% { background-position: 400px 0 } }
@utility shimmer-sweep {
  background-color: var(--color-skeleton-base);
  background-image: linear-gradient(90deg, var(--color-skeleton-base) 25%,
                    var(--color-skeleton-sheen) 37%, var(--color-skeleton-base) 63%);
  background-size: 400px 100%;
  animation: st-shimmer 1.4s ease infinite;
  @media (prefers-reduced-motion: reduce) { background-image: none; animation: none; }
}
```

Target form — identical output, compliant mechanism. Keep the utility name `shimmer-sweep` and its
five consumers untouched (`SidebarPromoPanel`, `ChildrenRosterSkeleton`, `ChildProfileSkeleton`,
`DashboardSkeleton`, `skeleton-card`):

```
@keyframes st-shimmer { from { transform: translateX(-100%) } to { transform: translateX(200%) } }
@utility shimmer-sweep {
  position: relative;
  overflow: hidden;
  background-color: var(--color-skeleton-base);

  &::after {
    position: absolute;
    inset: 0;
    content: '';
    background-image: linear-gradient(90deg, transparent 0%,
                      var(--color-skeleton-sheen) 50%, transparent 100%);
    animation: st-shimmer 1400ms var(--ease-out-quart) infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    &::after { display: none; animation: none; }
  }
}
```

Colours are unchanged tokens: base `--color-skeleton-base` `oklch(0.9683 0.0069 247.8956)`
(`#F1F5F9`), sheen `--color-skeleton-sheen` `oklch(0.9473 0.0108 256.6959)` (`#E9EEF5`, spec §C
`--color-shimmer-mid`). Duration 1400ms is the design's exactly.

Two risks the builder must handle, not discover: `position: relative` + `overflow: hidden` are new
on every consumer — check each of the five for an absolutely-positioned child or an intentional
overflow before landing; and a `::after` on an element that already has one (grep the five) would
be silently overwritten.

**B — `st-rec-pulse`, compliant.** The design's ring expands from 0 to 16px and fades 0.35 → 0 over
1.5s. As a scaled, faded pseudo-element ring at the same geometry:

```
@keyframes st-rec-pulse {
  0%   { opacity: 0.35; transform: scale(1) }
  70%  { opacity: 0;    transform: scale(2.6) }
  100% { opacity: 0;    transform: scale(1) }
}
```

`scale(2.6)` is the geometric equivalent of a 16px ring around the design's 20px record dot
(20 + 2×16 = 52; 52/20 = 2.6) — state the dot diameter the scale assumes so a different-sized
consumer retunes rather than inherits a wrong ring. Ring colour is `--destructive` at 35%:
`oklch(0.5771 0.2152 27.325 / 35%)` (`rgba(220,38,38,.35)`).

Token: `--animate-st-rec-pulse: st-rec-pulse 1500ms var(--ease-out-quart) infinite`. The design says
`ease-out`; `--ease-out-quart` is the mission's exponential equivalent per 010.

**`st-rec-pulse` has no in-scope consumer, and that is recorded, not hidden.** Its design consumer is
the Electron student client's record button, which `.qa/DECISIONS.md` **D-SCOPE-2** puts OUT of this
mission. It is declared because the wave brief enumerates all six design-system keyframes as the
foundation layer. It is wired to nothing, and nothing in the parent portal may adopt it without a
design slice that calls for it — adopting it on, say, the `Live` status badge would be inventing
motion the design does not have (`[BDG:17-19]` declares no transition on any badge).

**Mobile (375px).** The shimmer overlay translates ±200% inside `overflow: hidden`, so it can never
extend the scrollport — assert that. `st-rec-pulse`'s `scale(2.6)` on an absolutely-positioned ring
likewise stays inside its containing block only if the consumer sets `overflow: hidden` or the ring
is inset; since it has no consumer, assert only that the keyframe exists.

## Files

- `src/app/globals.css` — the `@keyframes st-shimmer` block, the `@utility shimmer-sweep` block, a
  new `@keyframes st-rec-pulse`, and one `--animate-st-rec-pulse` token.
- `src/lib/utils.ts` — add `'st-rec-pulse'` to the `animate` classGroup created in 011.
  (`shimmer-sweep` is an `@utility`, not a `--*` token, so it needs no registration.)
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: shimmer + pulse` block.
- **Read before editing, change none of them**: `src/modules/shell/components/SidebarPromoPanel.tsx`,
  `src/modules/children/components/ChildrenRosterSkeleton.tsx`,
  `src/modules/children/components/ChildProfileSkeleton.tsx`,
  `src/modules/dashboard/components/DashboardSkeleton.tsx`,
  `src/modules/design-system/components/skeleton-card.tsx`.

## Depends on

- **010** — `--ease-out-quart`.
- **011** — the `animate` classGroup and the reduced-motion convention this task extends.

## Steps

1. Grep the five `shimmer-sweep` consumers for `::after`, `after:`, `absolute`, and `overflow-` and
   record what each carries BEFORE editing the utility.
2. Re-cut `@keyframes st-shimmer` and `@utility shimmer-sweep` as above.
3. Add `@keyframes st-rec-pulse` and `--animate-st-rec-pulse`; register the name.
4. Extend the e2e.

## Project rules

- `.claude/rules/tailwind.md:9` — this task exists to satisfy it; after it, zero keyframes in the
  repo animate anything but `transform` and `opacity`.
- `.claude/rules/tailwind.md:10` — exponential easing on both.
- `.qa/DECISIONS.md` **D-DESIGN-3** — reduced-motion variant on every animation.
- CLAUDE.md law 1/3 — the shimmer's rendered appearance and all five consumers' markup are
  unchanged; this is a mechanism swap, not a redesign.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright against the running app on `/dashboard/children` (a real skeleton surface —
  `ChildrenRosterSkeleton` paints during the `useStudentsQuery` load): with the students request
  intercepted and delayed, the skeleton element's `::after` computes
  `animation-name: st-shimmer`, `animation-duration: 1.4s`,
  `animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1)`, and the element itself computes
  `overflow: hidden`. Read the pseudo-element with
  `getComputedStyle(el, '::after')`.
- **No property regression**: `getComputedStyle(el).backgroundPosition` is static across two samples
  400ms apart, and `getComputedStyle(el, '::after').transform` differs between the same two samples
  — the proof that the animated property moved from background to transform.
- **Visual parity**: the skeleton element's computed `background-color` still equals the resolved
  `--color-skeleton-base` probe string, and its `getBoundingClientRect()` height/width are unchanged
  from before the edit (record both).
- Reduced motion (`page.emulateMedia({ reducedMotion: 'reduce' })`): the `::after` computes
  `display: none`, the element still computes the flat `--color-skeleton-base` fill, and the
  skeleton is still visible — a reduced-motion user must not get a blank box.
- `st-rec-pulse`: the `CSSKeyframesRule` exists in `document.styleSheets` with the three stops above,
  and `--animate-st-rec-pulse` resolves to
  `'st-rec-pulse 1500ms var(--ease-out-quart) infinite'`. Assert it is applied to **zero** elements
  in the app (`document.querySelectorAll('[class*="animate-st-rec-pulse"]').length === 0`) — the
  no-invention fence.
- The `animate` classGroup parity test passes with `'st-rec-pulse'` registered.
- 375: skeleton visible, `document.documentElement.scrollWidth <= 375` while it animates. 1280: same
  assertions.
- axe zero serious/critical on `/dashboard/children` at both viewports while the skeleton is up.
- No i18n change; six catalogs key-identical at 1151.
- Zero banned-pattern grep hits; zero `background-position` in any `@keyframes` in the diff.
- Full suite at the 157-pass baseline — `dashboard.spec.ts`, `children-profile.spec.ts` and
  `shell.spec.ts` all exercise `shimmer-sweep` consumers and must stay green.

## Assumptions

- The five `shimmer-sweep` consumers do not already use `::after` or rely on visible overflow.
  Step 1 verifies this; if any does, the utility gains a `::before` variant for that consumer rather
  than the consumer being rewritten, and the exception is recorded.
- `scale(2.6)` encodes the design's 16px ring around a 20px dot. Any future consumer at a different
  diameter must retune it; stated here so the number is not treated as universal.

## Evidence

<!-- the five-consumer grep, ::after computed animation-name/duration/timing, the two-sample
     background-position vs transform comparison, before/after bounding rects, reduced-motion
     ::after display, the rec-pulse keyframe dump + zero-consumer count, parity output, axe,
     suite count -->
