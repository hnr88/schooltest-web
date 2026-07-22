---
id: 013
title: Author the focus-ring foundation from `--ring` — a WCAG-conformant `focus-ring` utility, the design's input halo, and the error ring
layer: a11y
kind: implement
slice: Visible focus — the indicator the design does not have, authored from its own `--ring` token, at a contrast the design's alpha cannot reach
target: src/app/globals.css (`:root`, `.dark`, `@theme inline`, `@utility focus-ring`), src/lib/utils.ts (`THEME_CLASS_GROUPS['shadow']`), tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/screens/ds--forms.html:8,13,25,39 · ds--dark-mode.html:16 · dashbaord-design/tokens.css:47,98 · .qa/design/spec/04-ds-foundations.md#5-1-text-input, #2-4, UNKNOWN 1
status: TODO
depends_on: ['001', '008']
---

## Objective

`.qa/PLAN.md` finding 2: "**The design has no focus states at all** and explicitly sets
`outline:none` on both search inputs. WCAG 2.2 AA and `.claude/rules/quality.md` both require
visible focus. Focus rings are therefore authored from the design's own `--ring` token. Fixing the
markup, never suppressing the rule." This slice is that authoring — once, as tokens plus one
utility, so 200+ later tasks inherit a conformant indicator instead of each inventing one.

## Contract

n/a. Binding sources:

> `.qa/design/spec/04-ds-foundations.md` §5.1 — text input **focus** (`style-focus`):
> `border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)` `[FRM:8,25,39]`;
> **error**: `border:1px solid #DC2626; box-shadow:0 0 0 3px rgba(220,38,38,.10)` `[FRM:13]` —
> "persistent (not a focus-only shadow)".
> Dark input focus `ds--dark-mode.html:16`:
> `border-color:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,.22)` — a **different alpha** (.22).
>
> UNKNOWN 1: "**No `:focus` / `:focus-visible` style exists for buttons.** … `tokens.css` defines
> `--ring: rgba(37,99,235,0.35)` `[TOK:47]` but nothing in the markup consumes it. The button focus
> ring must be specified by the design owner."
>
> `.claude/rules/quality.md` Accessibility §6: "Focus rings: always visible. Never `outline: none`
> without replacement."

## Design source

**The finding that shapes this task.** `--ring` is `rgba(37,99,235,0.35)`. Composited over the
design's `--card` white it renders `#B3C8F8`, whose contrast against white is **1.68:1** — far below
the 3:1 that WCAG 2.2 SC 1.4.11 (Non-text Contrast) and SC 2.4.13 (Focus Appearance) require of a
focus indicator. The repo-wide `focus-visible:ring-2 focus-visible:ring-ring` convention (in
`chip-variants.ts`, `SearchPagination.tsx`, `UnifiedSearchBar.tsx` and others) inherits that defect
today. The resolution keeps the design's colour and discards only its alpha:

| Token | Light value | Dark value | Contrast | Cite |
|---|---|---|---|---|
| `--focus-ring` | `oklch(0.5461 0.2152 262.8809)` — `#2563EB`, solid `--primary` | `oklch(0.6231 0.188 259.8145)` — `#3B82F6`, dark `--primary` | 5.12:1 on `#FFFFFF`, 4.86:1 on `#F7F9FC`; dark 5.01:1 on `#0B1226` | `[FRM:8]` border-color, `[DARK:16]` |
| `--focus-ring-on-dark` | `oklch(0.7845 0.1325 181.912)` — `#2DD4BF` (= existing `--color-accent-on-dark`) | same | 8.21:1 on `#0E2350` (recorded in `globals.css`) | for navy panels, hero, sidebar-dark, toast |
| `--shadow-ring-focus` | `0 0 0 3px oklch(0.5461 0.2152 262.8809 / 16%)` | `0 0 0 3px oklch(0.6231 0.188 259.8145 / 22%)` | decorative halo, not the indicator | `[FRM:8]`, `[DARK:16]` |
| `--shadow-ring-error` | `0 0 0 3px oklch(0.5771 0.2152 27.325 / 10%)` | same | persistent, not focus-only | `[FRM:13]` |

**The utility.** One `@utility focus-ring` so no component hand-rolls it:

```
@utility focus-ring {
  &:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
    box-shadow: var(--shadow-ring-focus);
  }
}
```

`:focus-visible`, never `:focus` — a mouse click on a button must not paint a ring. `outline`, not
`ring`, because an outline follows `border-radius` and is never clipped by an ancestor's
`overflow: hidden`, which is exactly how focus rings disappear inside the design's scrolling panels.
2px thickness and 2px offset satisfy SC 2.4.13's minimum area with the offset guaranteeing the
indicator is adjacent to, not inside, a filled control.

A `focus-ring-on-dark` companion utility swaps `--focus-ring` for `--focus-ring-on-dark`, for the
navy hero, the navy promo card and the dark toast.

**What is explicitly NOT done here:** no component is migrated. The existing
`focus-visible:ring-2 focus-visible:ring-ring` call sites keep working (they are a defect, recorded
below, owned by W11's a11y sweep) and this task adds the conformant alternative they will migrate to.
Rewriting them now would be a cross-cutting refactor across 8 modules in a foundation task.

**The `outline:none` refusal.** `[FRM:8,25,39]` sets `outline:none` on the text input, search input
and textarea. That declaration is NOT ported. Where a design slice sets `outline:none`, the
implementation replaces it with `focus-ring`; the suppression is a design defect that
`.claude/rules/quality.md` §6 forbids reproducing.

**Mobile (375px).** `outline-offset: 2px` paints 2px outside the control's border box. A control
flush against the viewport edge would push the outline into the scrollport. The wave-wide rule:
any focusable control must sit at least `px-1` (4px) inside its scroll container — assert
`scrollWidth <= 375` with a first and a last focusable element focused.

## Files

- `src/app/globals.css` — `:root` (`--focus-ring`, `--focus-ring-on-dark`, `--shadow-ring-focus`,
  `--shadow-ring-error`), `.dark` (the two overridden values), `@theme inline` (`--color-focus-ring`,
  `--color-focus-ring-on-dark`, and the two `--shadow-*` references), and the two `@utility` blocks.
- `src/lib/utils.ts` — add `'ring-focus'`, `'ring-error'` to `THEME_CLASS_GROUPS['shadow']`.
  **Mandatory** — the parity test fails on any unregistered `--shadow-*` token.
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: focus ring` block.

## Depends on

- **001** — `--primary`, `--destructive` and `--color-accent-on-dark` are its output.
- **008** — the `--shadow-*` namespace, its `:root` + `@theme inline` split, and its registration
  convention.

## Steps

1. Declare the four `:root` values and the two `.dark` overrides, each with its design cite and the
   measured contrast ratio as the provenance comment.
2. Add the `@theme inline` references and register the two shadow names.
3. Add `@utility focus-ring` and `@utility focus-ring-on-dark`.
4. Apply `focus-ring` to exactly one real control so the slice is provable on shipped markup:
   `src/modules/design-system/components/icon-button.tsx` (`data-slot="icon-button"`), which renders
   on `/design-system` and today carries no focus treatment of its own. Read it first; add the class
   and nothing else.
5. Extend the e2e.

## Project rules

- `.claude/rules/quality.md` Accessibility §1 (keyboard reachable), §6 (focus rings always visible,
  never `outline:none` without replacement).
- `.claude/rules/tailwind.md:1` — OKLCH only; the design's `rgba()` becomes `oklch(… / n%)`.
- `.claude/rules/tailwind.md:9` — the ring must not be transitioned into existence; it appears
  instantly on `:focus-visible`. A transition on `outline-color` is not permitted.
- CLAUDE.md law 11 — `src/components/ui/*` untouched.
- CLAUDE.md law 1 — one utility, four tokens, one consumer. No migration of existing `ring-ring`
  call sites.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright on `/design-system`, **keyboard focus, not `.focus()`**: press `Tab` until
  `[data-slot="icon-button"]` is `document.activeElement`, then assert it computes
  `outline-width: 2px`, `outline-style: solid`, `outline-offset: 2px`, and an `outline-color` equal
  to the resolved `--focus-ring` probe string; and `box-shadow` contains `3px`.
- Mouse-click negative proof: `page.mouse.click()` the same control and assert
  `outline-style` is `none` — `:focus-visible`, not `:focus`.
- Contrast, computed in-page from the resolved tokens: `--focus-ring` against `--card`, against
  `--background`, and (under `.dark`) against the dark `--background` — every ratio ≥ 3:1.
  `--focus-ring-on-dark` against `--navy-900` ≥ 3:1.
- The design's input treatment, asserted on a real `FormsSection` input: on focus, `border-color`
  equals the resolved `--primary` and `box-shadow` equals the resolved `--shadow-ring-focus`.
- `--shadow-ring-error` resolves to the exact string and its `.dark` value is unchanged (the design
  gives no dark error ring — record, do not invent).
- The `shadow` classGroup parity test passes with both names registered.
- axe on `/design-system` at 375 and 1280: zero serious/critical, and specifically zero
  `focus-order-semantics` and zero `color-contrast` violations.
- Mobile: with the first and the last focusable element on the page focused,
  `document.documentElement.scrollWidth <= 375`.
- Motion: none — the ring must appear with no transition. Assert the focused control's
  `transition-property` does not contain `outline-color` or `outline`. Under
  `reducedMotion: 'reduce'` the ring must still appear (a focus indicator is never motion and must
  never be gated).
- No i18n change; six catalogs key-identical at 1151.
- Zero banned-pattern grep hits; zero `outline: none` added anywhere in the diff.
- Full suite at the 157-pass baseline; `a11y-auth.spec.ts`, `a11y-responsive.spec.ts` and
  `shell-a11y.spec.ts` stay green.

## Assumptions

- The design owner's decision that UNKNOWN 1 asks for is not available in this unattended run. The
  ring is therefore derived from the design's own `--ring` hue at the alpha the design already uses
  for its input focus border (solid `#2563EB`), so nothing outside the design's palette is
  introduced. Recorded as authored, not ported.
- The pre-existing `focus-visible:ring-ring` call sites across `search-shared`, `unified-search`,
  `student-wizard` and `shell` render a ~1.68:1 indicator and are a real WCAG 2.2 defect. They are
  NOT fixed here — this task supplies the conformant replacement; the migration belongs to W11's
  a11y sweep and must be carried into it as a known finding.

## Evidence

<!-- resolved token strings light + dark, keyboard-focus computed outline properties, the mouse
     click negative proof, the contrast table with measured ratios, the input focus border +
     box-shadow, parity output, axe summaries at both viewports, scrollWidth at 375, suite count -->
