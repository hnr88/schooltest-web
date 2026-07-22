---
id: 011
title: Land `st-fade-in`, `st-pop-in`, `st-toast-in` and `st-spin` as `--animate-*` tokens with a reduced-motion variant, and wire the dialog panel to `st-pop-in`
layer: ui
kind: implement
slice: The four transform/opacity keyframes of the design system, tokenised, tailwind-merge-registered, reduced-motion-safe, and proven on the real `/design-system` dialog
target: src/app/globals.css (`@keyframes` + `@theme inline`), src/lib/utils.ts (new `animate` classGroup), src/modules/design-system/components/showcase/dialog-demo.tsx, tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/spec/04-ds-foundations.md#0-2-keyframes-the-complete-animation-inventory · .qa/design/screens/ds--dark-mode.html:34-35,48 · ds--buttons.html:28
status: TODO
depends_on: ['010']
---

## Objective

Four of the design system's six keyframes animate only `transform` and `opacity` and can be ported
verbatim. Land them as first-class `--animate-*` tokens, register the `animate` classGroup that this
repo has never needed before, ship the `prefers-reduced-motion` variant that
`.qa/DECISIONS.md` D-DESIGN-3 makes part of done, and prove one of them on a real overlay.

## Contract

n/a. Binding source, quoted verbatim from `.qa/design/spec/04-ds-foundations.md` §0.2:

| Name | Keyframes | Animates | Used by |
|---|---|---|---|
| `st-toast-in` | `from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none }` | opacity + translateY | Live toast, `animation:st-toast-in .25s ease` `[SRC:1527]` |
| `st-fade-in` | `from { opacity:0 } to { opacity:1 }` | opacity | dialog scrim `.18s ease` `[SRC:1513]` |
| `st-pop-in` | `from { opacity:0; transform:scale(.96) } to { opacity:1; transform:none }` | opacity + scale | dialog panel `.18s ease` `[SRC:1514]` |
| `st-spin` | `to { transform:rotate(360deg) }` | rotation | button loading spinner, `st-spin .7s linear infinite` `[SRC:1580]` |

Confirmed live in `ds--dark-mode.html`: `:34` scrim `animation:st-fade-in .18s ease`, `:35` panel
`animation:st-pop-in .18s ease`, `:48` toast `animation:st-toast-in .25s ease`.
And `.qa/design/spec/04-ds-foundations.md` UNKNOWN 16: "**Reduced-motion:** no
`@media (prefers-reduced-motion)` rule exists anywhere" — so the variant is authored here, not ported.

## Design source

**`@keyframes` to add to `src/app/globals.css`**, verbatim from the table (the existing
`@keyframes st-shimmer` block is the placement precedent; 012 owns that one):

```
@keyframes st-fade-in  { from { opacity: 0 } to { opacity: 1 } }
@keyframes st-pop-in   { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: none } }
@keyframes st-toast-in { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
@keyframes st-spin     { to { transform: rotate(360deg) } }
```

**`--animate-*` tokens in `@theme inline`.** The design names no easing (default `ease`); per 010
that is upgraded to `--ease-out-quart`, and the spinner keeps the `linear` the design declares:

| Token | Value | Design cite |
|---|---|---|
| `--animate-st-fade-in` | `st-fade-in 180ms var(--ease-out-quart)` | `[SRC:1513]`, `ds--dark-mode.html:34` |
| `--animate-st-pop-in` | `st-pop-in 180ms var(--ease-out-quart)` | `[SRC:1514]`, `ds--dark-mode.html:35` |
| `--animate-st-toast-in` | `st-toast-in 250ms var(--ease-out-quart)` | `[SRC:1527]`, `ds--dark-mode.html:48` |
| `--animate-st-spin` | `st-spin 700ms linear infinite` | `[SRC:1580]`, `[BTN:28]` |

**Reduced-motion variant — scoped, not global.** Add one rule immediately after the keyframes:

```
@media (prefers-reduced-motion: reduce) {
  .animate-st-fade-in, .animate-st-pop-in, .animate-st-toast-in, .animate-st-spin { animation: none }
}
```

Scoped to these four classes only. A blanket `* { animation: none }` would silently disable the 62
existing `animate-in` consumers whose own `motion-reduce:animate-none` is already the repo's shipped
convention (`src/modules/student-wizard/**`, `src/modules/search-shared/**`), and CLAUDE.md law 3
forbids changing behaviour that is not requested. For `st-spin` specifically, `animation: none`
freezes the spinner mid-rotation — that is correct: the design's spinner communicates "busy" through
its presence and the button's `aria-busy`, not its rotation.

**The one real consumer wired in this slice: the dialog panel.**
`src/modules/design-system/components/showcase/dialog-demo.tsx` renders `DialogContent` on
`/design-system`. Add `className="data-open:animate-st-pop-in"` to it. Registering the `animate`
classGroup (below) is what makes this override the primitive's built-in
`data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95`; without the registration both
classes survive and stylesheet order picks the winner — the exact silent failure
`tests/e2e/design-tokens.spec.ts`'s header comment documents.

**Seams recorded, not built here:**
- The dialog **scrim** cannot be retargeted: `src/components/ui/dialog.tsx:52` renders
  `<DialogOverlay />` with no props, and CLAUDE.md law 11 makes `src/components/ui/*` read-only. Its
  current `data-open:fade-in-0 duration-100` is behaviourally the design's `st-fade-in` at a
  different duration. W1's overlay task owns the design-system wrapper that fixes this.
- `st-spin`'s consumer is `@/components/ui/spinner` inside the loading Button — also read-only.
  W1's button task owns it.
- `st-toast-in`'s consumer is the sonner `<Toaster/>` mounted in `layout.tsx:65`. W1's toast task
  owns it.

**Mobile (375px).** `st-toast-in` translates 12px on the Y axis and `st-pop-in` scales from 0.96 —
neither can produce horizontal overflow at any width, but the dialog panel's
`max-w-[calc(100%-2rem)]` combined with a 0.96 scale must not reveal a scrollbar mid-animation.
Assert `document.documentElement.scrollWidth <= 375` while the dialog is open.

## Files

- `src/app/globals.css` — four `@keyframes` blocks, four `@theme inline` tokens, one scoped
  `@media (prefers-reduced-motion: reduce)` rule.
- `src/lib/utils.ts` — add an `animate` entry to `THEME_CLASS_GROUPS` listing
  `'st-fade-in', 'st-pop-in', 'st-toast-in', 'st-spin'`, plus `GROUP_UTILITY.animate = 'animate'`
  and `GROUP_TOKEN_PREFIX.animate = '--animate-'`. The parity test loops
  `Object.entries(THEME_CLASS_GROUPS)`, so the new group is covered automatically.
- `src/modules/design-system/components/showcase/dialog-demo.tsx` — one `className` prop.
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: keyframes` block.

## Depends on

- **010** — `--ease-out-quart` is referenced by three of the four tokens.

## Steps

1. Add the four `@keyframes` blocks next to the existing `@keyframes st-shimmer`.
2. Add the four `--animate-*` tokens with provenance comments naming the design consumer.
3. Add the scoped reduced-motion rule.
4. Extend `THEME_CLASS_GROUPS` with the `animate` group and both companion maps.
5. Add `data-open:animate-st-pop-in` to `DialogContent` in `dialog-demo.tsx`. Change nothing else in
   that file — the focus trap, `DialogClose` buttons, `aria-label` and i18n props are existing
   behaviour and `design-system.spec.ts` asserts them.
6. Extend the e2e.

## Project rules

- `.claude/rules/tailwind.md:9` — transform/opacity only. All four keyframes comply; that is why
  they are in this task and `st-shimmer`/`st-rec-pulse` are in 012.
- `.claude/rules/tailwind.md:10` — exponential easings; `linear` is used only for `st-spin`, which
  the design declares as `linear`.
- `.qa/DECISIONS.md` **D-DESIGN-3** — Tailwind v4 + `tw-animate-css` only, no new dependency, every
  animation ships a reduced-motion variant.
- CLAUDE.md law 11 — `src/components/ui/*` untouched; the scrim/spinner/toast seams are recorded,
  not forced.
- `.claude/rules/quality.md` Accessibility §8 — modals trap focus, restore on close, ESC closes.
  The dialog must still do all three after the className change.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright on `/design-system`, **keyframe existence proven from the served stylesheet** (not from
  an injected utility class — Tailwind only generates a class that appears in scanned source, so an
  in-test-only class name would not exist): walk `document.styleSheets`, find the `CSSKeyframesRule`
  for each of `st-fade-in`, `st-pop-in`, `st-toast-in`, `st-spin`, and assert each rule's
  `cssRules` contain the exact declarations in the table above.
- All four `--animate-*` custom properties resolve on `document.documentElement` to the exact
  strings above (custom properties are returned as declared, so `var(--ease-out-quart)` appears
  literally — assert that literal).
- **Real-consumer proof**: click the `OverlaysSection` dialog trigger; while open,
  `[data-slot="dialog-content"]` computes `animation-name: st-pop-in`,
  `animation-duration: 0.18s`, `animation-timing-function: cubic-bezier(0.25, 1, 0.5, 1)`.
- **Behaviour preserved**: with the dialog open, focus is inside the panel, `Escape` closes it, and
  focus returns to the trigger. `design-system.spec.ts` stays green.
- **Reduced motion**: with `page.emulateMedia({ reducedMotion: 'reduce' })`, the same panel computes
  `animation-name: none`, and the dialog still opens, traps focus and closes on Escape.
- The new `animate` classGroup parity test passes; negative check: removing `'st-pop-in'` from the
  list makes it fail (run once, revert).
- 375: dialog open, `document.documentElement.scrollWidth <= 375`; 1280: same assertions as above.
- axe zero serious/critical on `/design-system` with the dialog open, at both viewports.
- No i18n change; six catalogs key-identical at 1151.
- Zero banned-pattern grep hits.
- Full suite at the 157-pass baseline.

## Assumptions

- `st-spin` under reduced motion is stopped rather than slowed. WCAG 2.3.3 treats a continuous
  rotation as motion animation; the busy state remains conveyed by `aria-busy` and the button's
  disabled styling, so no information is lost.
- The design's default `ease` is upgraded to `--ease-out-quart` at the identical duration, per 010
  and spec §I ("a deliberate **upgrade**, not a port"). The durations are the design's exactly.

## Evidence

<!-- CSSKeyframesRule dumps for all four, resolved --animate-* strings, dialog panel computed
     animation-name/duration/timing-function open and under reduced motion, focus-trap + Escape
     result, the negative parity run, scrollWidth at 375, axe, suite count -->
