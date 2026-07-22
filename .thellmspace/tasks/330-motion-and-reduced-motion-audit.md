---
id: 330
title: Motion audit — every interactive element has a 150-200ms transition and a prefers-reduced-motion variant
layer: ui
kind: verify
slice: Mission-wide motion conformance: measured durations, allowed properties, allowed keyframes, and a real reduced-motion variant on every one
target: tests/e2e/motion-audit.spec.ts (new); src/app/globals.css; any module component missing a transition or a reduced-motion variant
contract: n/a
design: .qa/design/spec/04-ds-foundations.md#i-motion, .qa/design/spec/05-ds-components.md#animation-inventory, .qa/design/spec/01-portal-dashboard.md#11-animations
status: TODO
depends_on: ["320", "321", "322", "323", "324", "325", "326"]
---

## Objective

Prove, against the running app, that **every interactive element in the parent portal** carries a
transition in the 150-200ms band using only Tailwind v4 + `tw-animate-css` and the design
system's six keyframes, that it animates only permitted properties, and that **every one** has a
real `prefers-reduced-motion: reduce` variant that collapses the motion while preserving the end
state. `.qa/DECISIONS.md` **D-DESIGN-3** makes motion part of done; `.qa/PLAN.md` finding 1
records that the design ships **zero** `transition:` and **zero** `@keyframes` in the whole
Parent Portal export, so this motion is authored, and this task is where it is proven complete.

## Contract

n/a. The binding statements, quoted:

`.qa/DECISIONS.md` **D-DESIGN-3** — *"The design's keyframes (`st-toast-in`, `st-fade-in`,
`st-pop-in`, `st-spin`, `st-shimmer`, `st-rec-pulse`) are implemented with Tailwind v4 +
`tw-animate-css`, which the repo already depends on. No new animation dependency. Every animation
ships a `prefers-reduced-motion` variant. Motion is part of the definition of done for every UI
slice, not a follow-up."*

`.claude/rules/tailwind.md:19-20` — **animate `transform` and `opacity` ONLY**; exponential
easings only (ease-out-quart, ease-out-quint, ease-out-expo).

`.qa/design/spec/04-ds-foundations.md#I` records the four design behaviours that violate the
transform/opacity rule and their sanctioned substitutes:
1. `transition: background .15s` on all buttons — a **documented exception** (colour transition).
2. `transition: border-color .15s, box-shadow .15s` on inputs — same documented exception class.
3. `st-shimmer` animates `background-position` → **must** be re-authored as a translated overlay
   (`transform: translateX()`).
4. `st-rec-pulse` animates `box-shadow` → **must** be re-authored as a scaled + faded
   pseudo-element ring.

## Design source

The authored token set (`04-ds-foundations.md#I`), which must exist in `src/app/globals.css`:

```
--ease-design:     ease;                                /* what the HTML actually uses */
--ease-out-quart:  cubic-bezier(0.25, 1, 0.5, 1);
--ease-out-quint:  cubic-bezier(0.22, 1, 0.36, 1);
--ease-out-expo:   cubic-bezier(0.16, 1, 0.3, 1);
--duration-fast:   150ms;   /* buttons, inputs, checkbox, radio */
--duration-switch: 180ms;   /* switch track + knob */
--duration-enter:  180ms;   /* st-fade-in / st-pop-in */
--duration-toast:  250ms;   /* st-toast-in */
--duration-spin:   700ms;   /* st-spin */
--duration-shimmer:1400ms;  /* st-shimmer */
```

The six keyframes and their design-sourced values (`05-ds-components.md#animation-inventory`):

| keyframe | from → to | duration | easing | iterations |
|---|---|---|---|---|
| `st-toast-in` | `opacity:0; translateY(12px)` → `opacity:1; none` | `.25s` | ease | once |
| `st-fade-in` | `opacity:0` → `opacity:1` | `.18s` | ease | once |
| `st-pop-in` | `opacity:0; scale(.96)` → `opacity:1; none` | `.18s` | ease | once |
| `st-spin` | → `rotate(360deg)` | `.7s` | linear | infinite |
| `st-shimmer` | translated overlay (re-authored) | `1.4s` | ease | infinite |
| `st-rec-pulse` | scaled+faded ring (re-authored) | `1.5s` | ease-out | infinite |

Per-element durations sourced from the design and rounded into the 150-200ms band:
nav item / table row `background .12s` → **150ms**; button `background .15s` → **150ms**;
input `border-color, box-shadow .15s` → **150ms**; tab `color .15s` → **150ms**;
segmented control `all .15s` → **150ms**; checkbox/radio `all .15s` → **150ms**;
switch `background .18s` / knob `transform .18s` → **180ms**;
card hover `border-color, background .15s` → **150ms**.

Continuous indicators are exempt from the 150-200ms band and are enumerated explicitly:
`st-spin` (700ms), `st-shimmer` (1400ms), `st-rec-pulse` (1500ms), `st-toast-in` (250ms —
an enter-only animation whose design value is authoritative).

## Files

- `tests/e2e/motion-audit.spec.ts` (new)
- `src/app/globals.css` — the `@theme` duration/easing tokens, the six keyframes, and the single
  global `@media (prefers-reduced-motion: reduce)` block
- Fix-in-place authority: any component in `src/modules/**` missing a transition or a
  reduced-motion variant
- Never `src/components/ui/**`

## Depends on

- **320-326** — all seven UI sweeps must be DONE; this audit measures the surface they finish.
- Wave gate (prose): **W0 (001-014)** owns the tokens and keyframes; **W1 (020-057)** owns the
  primitives that carry them.

## Steps

1. Assert the foundation exists: read `src/app/globals.css` from the running app's served CSS
   and assert every token above resolves in the browser
   (`getComputedStyle(document.documentElement).getPropertyValue('--duration-fast')` === `150ms`,
   etc.), and that all six `@keyframes st-*` are defined
   (`document.styleSheets` walk, or `Element.getAnimations()` after triggering each).
2. Build the element inventory **in the browser, not by hand**: on each of the nine route
   surfaces (`/dashboard`, `/dashboard/children`, `/dashboard/children/[id]`,
   `/dashboard/children/new`, `/dashboard/search` ×2 modes, `/dashboard/notifications`,
   `/dashboard/settings`, `/sign-in`, `/`), collect every
   `button, [role="button"], a[href], input, select, textarea, [role="switch"], [role="tab"],
   [role="radio"], [role="checkbox"], [role="menuitem"], summary` that is visible.
3. For each collected element assert `getComputedStyle(el).transitionDuration` (or, for elements
   whose motion is an entrance animation, `animationDuration`) is:
   - **non-zero**, and
   - within **150ms-200ms** unless the element is on the enumerated continuous-indicator
     exemption list above (in which case its exact design duration is asserted).
   Report every failing element with its selector and measured value — an element with
   `transitionDuration: 0s` is a failure, not a pass.
4. Assert `transitionProperty` / the keyframe's animated properties are within the permitted set:
   `transform`, `opacity`, plus the two documented exceptions (`background-color`,
   `border-color`/`box-shadow`). Assert **no** element animates `width`, `height`, `padding`,
   `margin`, `top`, `left`, or `background-position` — grep the served CSS for
   `background-position` inside an `@keyframes` block and assert zero hits (proves the shimmer
   was re-authored as a translated overlay).
5. Assert the easing is exponential: `transitionTimingFunction` resolves to one of
   `cubic-bezier(0.25, 1, 0.5, 1)`, `cubic-bezier(0.22, 1, 0.36, 1)`, `cubic-bezier(0.16, 1, 0.3, 1)`
   or `linear` (spinners only).
6. Re-run the entire inventory under `page.emulateMedia({ reducedMotion: 'reduce' })` and assert
   for **every** element: `transitionDuration <= 0.02s` and `animationDuration <= 0.02s`
   (or `animation-play-state: paused` for the continuous indicators), and that the element's
   final visual state is unchanged — same `opacity`, same `transform: none`, same bounding box as
   the settled non-reduced state (compare via `waitForAnimationsSettled` from
   `tests/e2e/helpers/ui.ts`).
7. Assert the six keyframes are the **only** `@keyframes` in the served CSS besides Tailwind's
   own and `tw-animate-css`'s — grep the served stylesheet for `@keyframes` and assert every
   custom name is in the six-name allow-list. No new animation dependency is present in
   `package.json` (diff it).
8. Fix every gap found: add the missing transition token/utility at the component call site, or
   add the missing reduced-motion variant in `globals.css`. Never remove an assertion.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 11, 12; adding a library requires user
  confirmation (§2) — none is added here.
- `.claude/rules/tailwind.md:19-20` — transform/opacity only, exponential easings, no arbitrary
  values; the two colour-transition exceptions are documented in
  `.qa/design/spec/04-ds-foundations.md#I` and nowhere else.
- `.claude/rules/quality.md` — motion must not be the only affordance for a state change.
- `.qa/DECISIONS.md` D-DESIGN-3.
- `.claude/rules/testing.md`, D-VERIFY-1 — measured in the real DOM, never asserted from source.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/motion-audit.spec.ts` passes, having enumerated the
  interactive elements **from the live DOM** on all nine surfaces at both 375×812 and 1280×800.
- Every enumerated element measures a non-zero transition/animation in the 150-200ms band, or is
  on the explicitly enumerated continuous-indicator list with its exact design duration.
- Zero element animates a banned property; zero `@keyframes` block in the served CSS contains
  `background-position`; every custom `@keyframes` name is one of the six.
- Every easing resolves to one of the three exponential curves (or `linear` for spinners).
- Under `reducedMotion: 'reduce'`, **every** element measures `<= 0.02s` (or paused) and the
  settled visual state is byte-for-byte the same bounding box / opacity / transform as the
  non-reduced settled state.
- `package.json` gains no dependency.
- Zero banned-pattern grep hits; no file under `src/components/ui/` in the diff.

## Assumptions

- `tw-animate-css` remains the only animation helper (it is already a dependency per
  `src/app/globals.css:1-4`).
- Elements that are genuinely static by design (e.g. a disabled control that never changes
  appearance) are still required to declare a transition, because they become enabled — if a
  real exception is found it is added to the enumerated exemption list **in the spec file with a
  cited reason**, never silently skipped.

## Evidence

<!-- filled in as the task runs: per-surface element counts, measured durations, failures fixed -->
