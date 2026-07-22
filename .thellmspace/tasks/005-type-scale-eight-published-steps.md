---
id: 005
title: Land the design's eight published type steps as `--text-*` tokens with exact line-height and tracking
layer: ui
kind: implement
slice: The type scale — Display / H1 / H2 / H3 / H4 / Body / Body-sm / Caption at the design's exact metrics, registered with tailwind-merge
target: src/app/globals.css (`@theme inline`), src/lib/utils.ts (`THEME_CLASS_GROUPS['font-size']`), tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/screens/ds--typography.html · .qa/design/spec/04-ds-foundations.md#3-1-the-eight-published-steps and #TAILWIND-V4-MAPPING-H
status: TODO
depends_on: []
---

## Objective

The eight steps the design publishes on its typography board must be reachable as `--text-*` tokens
carrying the design's exact `font-size`, `line-height` and `letter-spacing`. Two of the eight have
no token today; one is tuned to a different design's numbers and must be corrected; five already
match and are confirmed, not rewritten.

## Contract

n/a. Binding source, quoted from `.qa/design/screens/ds--typography.html` (each specimen row is
`display:flex; align-items:baseline; gap:24px` with a `width:150px` gutter label):

| Step | Gutter label | size | line-height | weight | letter-spacing | colour |
|---|---|---|---|---|---|---|
| Display | `Display · 56/700` | `56px` | `1.05` | `700` | `-0.03em` | `#0E2350` |
| H1 | `H1 · 40/700` | `40px` | `1.15` | `700` | `-0.02em` | `#0E2350` |
| H2 | `H2 · 32/700` | `32px` | `1.2` | `700` | `-0.015em` | `#0E2350` |
| H3 | `H3 · 24/600` | `24px` | `1.3` | `600` | not declared | `#0E2350` |
| H4 | `H4 · 18/600` | `18px` | `1.4` | `600` | not declared | `#0E2350` |
| Body | `Body · 16/400` | `16px` | `1.6` | 400 | normal | `#475569`, `max-width:560px` |
| Body sm | `Body sm · 14/400` | `14px` | `1.55` | 400 | normal | `#475569` |
| Caption | `Caption · 12.5/500` | `12.5px` | `1.5` | `500` | normal | `#64748B` |

> §3.1: "Letter-spacing tightens monotonically as size grows: 56 → `-0.03em`, 40 → `-0.02em`,
> 32 → `-0.015em`, ≤24 → normal."

## Design source

Per-step action against `src/app/globals.css` as it stands:

| Step | Existing token | Existing value | Action |
|---|---|---|---|
| Display | `--text-display` | `clamp(3rem, 6vw, 4.25rem)` / lh `1.03` / ls `-0.032em` — max **68px** | **RETUNE** to `clamp(2.25rem, 1.25rem + 3.2vw, 3.5rem)` / lh `1.05` / ls `-0.03em`. Desktop maximum becomes exactly `3.5rem` = 56px, the design's published value; the clamp form is kept because it already ships and `.claude/rules/tailwind.md:7` asks for fluid type. Spec §H publishes this exact clamp. At 1280px it resolves to 56px; at 375px to 36px (`1.25rem + 3.2vw` = 32px, floored by the 2.25rem minimum). |
| H1 | `--text-h1` | `2.5rem` / `1.15` / `-0.02em` | **CONFIRM** — exact match. Add provenance comment. |
| H2 | `--text-h2` | `2rem` / `1.2` / `-0.015em` | **CONFIRM** — exact match. |
| H3 | `--text-h3` | `1.5rem` / `1.3` | **CONFIRM** — exact match, no tracking, as designed. |
| H4 | `--text-h4` | `1.125rem` / `1.4` | **CONFIRM** — exact match. |
| Body | — | none | **ADD** `--text-body: 1rem; --text-body--line-height: 1.6;`. Tailwind's built-in `text-base` is 16px/1.5 — the wrong leading, which is why a token is required rather than a built-in. |
| Body sm | — | none | **ADD** `--text-body-md: 0.875rem; --text-body-md--line-height: 1.55;`. Built-in `text-sm` is 14px/1.43 — wrong leading. See the naming note below. |
| Caption | `--text-meta` | `0.78125rem` (12.5px) / lh **1.4** | **RETUNE** `--text-meta--line-height: 1.5`. Size already exact. |

**Naming collision, resolved explicitly and recorded in the file.** `--text-body-sm` already exists
at `0.84375rem` = **13.5px** with **46 consumers** across `src/modules/**`, and 13.5/600 is the
design's *Form label* step (§3.2), not its *Body sm*. Renaming it is refused: 46 call sites, a
tailwind-merge registry entry, and a live assertion at `tests/e2e/design-tokens.spec.ts:68`
(`toHaveCSS('font-size', '13.5px')`) all depend on it, and CLAUDE.md law 1 bans refactors. The
design's 14px "Body sm" therefore lands as `--text-body-md`. Write this reasoning as the one comment
this task adds, so wave W1 does not re-litigate it.

Colour pairing, for the record (no token work — these already exist): Display/H1/H2/H3/H4 →
`text-foreground` (`#0E2350`); Body / Body-sm → `text-[--color-body]` i.e. the `--color-body`
token (`#475569`); Caption → `text-muted-foreground` (`#64748B`). Body's `max-width:560px` measure
cap → `max-w-140` (560/4).

## Files

- `src/app/globals.css` — the `@theme inline` `--text-*` region only.
- `src/lib/utils.ts` — add `'body'` and `'body-md'` to `THEME_CLASS_GROUPS['font-size']`.
  **Mandatory**: an unregistered `--text-*` token is read by tailwind-merge as a text COLOUR and
  silently drops back to 16px; the parity test in `design-tokens.spec.ts` exists precisely to catch
  this and will fail without the entries.
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: type scale` block.

## Depends on

Nothing. (006 depends on this.)

## Steps

1. Retune `--text-display` + its two sub-properties. Its ONLY consumer is
   `src/modules/landing/components/HeroSection.tsx:31` (`<h1 className="… text-display …">`) —
   read it first and confirm no e2e asserts its size (`grep -rn "font-size" tests/e2e` returns only
   `design-tokens.spec.ts:68,72`).
2. Add `--text-body` and `--text-body-md` with their `--line-height` sub-properties.
3. Retune `--text-meta--line-height` from `1.4` to `1.5`. This lengthens every 12.5px line by
   1.25px across ~50 consumers — run `a11y-responsive.spec.ts` and the 375px overflow check before
   claiming done.
4. Add provenance comments (`/* Display 56/1.05/-0.03em [TYP:5] */` form) to all eight.
5. Register `'body'`, `'body-md'` in `src/lib/utils.ts`.
6. Extend the e2e.

## Project rules

- `.claude/rules/tailwind.md:5` — never arbitrary text sizes; `text-xs`…`text-9xl` or `--font-size-*`
  tokens. Every step above is a token.
- `.claude/rules/tailwind.md:7` — `clamp()` for fluid typography via the size tokens. Only
  `--text-display` is fluid; the design has zero media queries (§9), so no other step becomes fluid
  without sign-off.
- `.claude/rules/quality.md` Accessibility §4 — the Caption retune must not drop any text below AA;
  `--text-meta` pairs with `--muted-foreground` `#64748B` on `--card`, 4.76:1, unaffected by leading.
- CLAUDE.md law 3 — the 46 `text-body-sm` and ~50 `text-meta` consumers are existing behaviour.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright at **1280×720** on `/design-system`: an injected probe with `class="text-display"`
  computes `font-size: 56px`, `line-height: 58.8px` (56 × 1.05), `letter-spacing: -1.68px`
  (56 × −0.03). Same probe at **375×812** computes `font-size: 36px` — the mobile behaviour named
  above, asserted, not assumed.
- Probes for `text-body` → `16px` / `25.6px`; `text-body-md` → `14px` / `21.7px`;
  `text-meta` → `12.5px` / `18.75px`; `text-h1` → `40px` / `46px` / `-0.8px`;
  `text-h2` → `32px` / `38.4px` / `-0.48px`; `text-h3` → `24px` / `31.2px`;
  `text-h4` → `18px` / `25.2px`.
- The existing `tests/e2e/design-tokens.spec.ts:68` assertion (ToggleRow description at `13.5px`)
  and `:72` (ScoreText at `14px`) stay green — proof the collision was resolved without collateral.
- The `font-size` classGroup parity test passes with `body` and `body-md` registered.
- `tests/e2e/landing.spec.ts` and `landing-aria.spec.ts` stay green after the Display retune, and
  the landing hero `<h1>` is asserted to compute `56px` at 1280 and `36px` at 375.
- Motion: none added by this slice. Under `reducedMotion: 'reduce'` the clamp still resolves — a
  fluid size is layout, not motion, and must NOT be gated.
- 375 and 1280 both asserted, per step, as above.
- axe zero serious/critical on `/design-system` and `/` at both viewports.
- No i18n change; six catalogs key-identical at 1151.
- Zero banned-pattern grep hits.
- Full suite at the 157-pass baseline.

## Assumptions

- `--text-display` stays a clamp rather than becoming a fixed 56px. The design has no media queries
  at all (§9) so a fixed 56px is equally "faithful" at desktop; the clamp is retained because it
  already ships, because `.claude/rules/tailwind.md:7` asks for it, and because 56px on a 375px
  viewport overflows a two-word line. The clamp's maximum is the design's published number exactly,
  so nothing is invented at the design's own breakpoint.

## Evidence

<!-- probe computed font-size / line-height / letter-spacing per step at 375 and 1280, landing h1
     measurements, parity-test output, the two pre-existing assertions still green, suite count -->
