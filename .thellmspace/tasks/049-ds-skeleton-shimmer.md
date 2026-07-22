---
id: 049
title: Rebuild Skeleton + st-shimmer as a transform sweep, and the SkeletonCard composition
layer: ui
kind: implement
slice: Skeleton primitives (avatar, line, block) + SkeletonCard
target: src/modules/design-system/components/skeleton-line.tsx, src/modules/design-system/components/skeleton-card.tsx, src/modules/design-system/types/record.types.ts, src/modules/design-system/components/showcase/feedback-section.tsx, tests/e2e/ds-skeleton.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/05-ds-components.md#6.9, .qa/design/spec/04-ds-foundations.md#0.2
status: TODO
depends_on: [001, 003, 007, 010, 012, 035]
---

## Objective

Every wave after this one ships loading states. Build the skeleton vocabulary once, and replace
the design's `background-position` shimmer with a compliant transform sweep.

## Contract

n/a. `.qa/design/spec/05-ds-components.md` §6.9 (`ds--dashboard-components.html:97-108`),
verbatim:

- Every skeleton element shares
  `background:linear-gradient(90deg,#F1F5F9 25%,#E9EEF5 37%,#F1F5F9 63%);
  background-size:400px 100%; animation:st-shimmer 1.4s ease infinite`.
- `st-shimmer` = `0% { background-position:-400px 0 } 100% { background-position:400px 0 }`.
- Avatar skeleton: `display:inline-block; width:38px; height:38px; border-radius:50%; flex:none`.
- Line skeleton: `display:block; height:11px; border-radius:6px`; widths used `60%`, `85%`, then a
  full-width `100%` line at `margin-top:14px` and a `70%` line at `margin-top:8px`.
- Header wrapper: `display:flex; align-items:center; gap:12px`; the two header lines sit in
  `display:flex; flex-direction:column; gap:8px; flex:1`.
- Card shell: base card at `padding:20px`.

## Design source

Tokens: `#F1F5F9` → `--color-skeleton-base` (already in `globals.css`), `#E9EEF5` →
`--color-skeleton-sheen` (already present). Radius 6px on lines, `--radius-full` on the avatar.
Dark: base `--color-muted` `#17233F`, sheen one step lighter.

**Motion — consumed, not re-authored.** `.qa/design/spec/04-ds-foundations.md` §I.3 records that
`st-shimmer` animates `background-position`, which `.claude/rules/tailwind.md` forbids
(transform/opacity only). **W0 task 012 owns the rewrite** — it re-authors `@keyframes st-shimmer`
and the `@utility shimmer-sweep` in `src/app/globals.css` as a translated overlay
(`transform: translateX()` on an `inset-0` gradient span, 1400ms `ease infinite`, name preserved).
This task **consumes** that utility and must not re-author it. If 012's utility does not yet exist
when this runs, the task is BLOCKED on 012 rather than adding a second mechanism.

Under `prefers-reduced-motion: reduce` the sweep stops entirely and the skeleton renders as a
flat `--color-skeleton-base` block — a pulsing loader is a known vestibular trigger.

## Files

- `src/modules/design-system/components/skeleton-line.tsx` — **new**; `SkeletonLine`,
  `SkeletonCircle`, `SkeletonBlock` wrapping `Skeleton` from `@/components/ui/skeleton`.
- `src/modules/design-system/components/skeleton-card.tsx` — re-cut to the §6.9 composition.
- `types/record.types.ts` — `SkeletonCardProps`, `SkeletonLineProps`.
- showcase `feedback-section.tsx`; `tests/e2e/ds-skeleton.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **012** — the rule-compliant `st-shimmer` (transform sweep, not `background-position`).

Within W1:

- **035** — the card shell.

## Steps

1. Confirm W0-012's `shimmer-sweep` utility is present and that no existing consumer of it breaks
   (`grep -rn "shimmer-sweep" src/`). Do not edit `globals.css` in this task.
2. Skeletons are `aria-hidden="true"` and the loading region carries `aria-busy="true"` with a
   `sr-only` "Loading…" — a screen reader must not read a wall of empty boxes.
3. Line widths are props (`60|70|85|100`) mapped to `w-*` utilities, not arbitrary percentages.
4. `SkeletonCard` mirrors the real card's geometry so there is no layout shift when data arrives —
   measure both in the spec.
5. i18n the `sr-only` loading string; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11 (`skeleton.tsx` read-only), law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (**animate transform/opacity
  only**; `@utility`/`@keyframes` live in `globals.css` and are W0-012's, never a component's);
  `.claude/rules/quality.md` (`aria-busy`, no CLS);
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-skeleton.spec.ts` asserts on `/design-system`:
  - the shimmer element's `animation-name` is `st-shimmer` with `animation-duration: 1400ms` and
    `animation-iteration-count: infinite`;
  - the animated property is a **transform** — assert the computed `transform` differs between two
    samples 300ms apart, and that `background-position` does **not** change;
  - the skeleton container is `aria-hidden` and its parent is `aria-busy="true"` with an
    accessible "Loading" text;
  - `SkeletonCard`'s `boundingBox()` height is within 4px of the real card it stands in for
    (render both side by side in the showcase).
- Reduced motion: `animation-name: none` (or duration 0.01ms) and the block renders flat —
  assert the transform does **not** change over 300ms.
- 375px + 1280px, no horizontal overflow; axe zero serious/critical.
- Six catalogs key-identical; zero banned-pattern hits.
- `grep -rn "shimmer-sweep" src/` shows every existing consumer still renders (re-run
  `school-search-presentation.spec.ts`, which asserts loading states).

## Assumptions

- W0-012 has already re-authored `st-shimmer` to animate a transform while keeping the design's
  name. This task only composes it; if 012 is not DONE, this task blocks rather than forking it.

## Evidence
