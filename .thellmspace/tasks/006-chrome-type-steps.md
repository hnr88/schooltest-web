---
id: 006
title: Land the seven chrome type steps the typography board omits (masthead, section, eyebrow, group label, form label, count, inline code)
layer: ui
kind: implement
slice: The DS chrome type layer — the steps every section frame, eyebrow and label in the export uses that the eight-step board never publishes
target: src/app/globals.css (`@theme inline`), src/lib/utils.ts, src/modules/design-system/components/eyebrow.tsx, tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/screens/ds--header.html · ds--colors.html:2-3,6 · ds--typography.html:2-3 · ds--forms.html:7,9,12 · ds--badges.html:21 · .qa/design/spec/04-ds-foundations.md#3-2-additional-type-steps-used-by-the-ds-chrome-but-absent-from-the-board
status: TODO
depends_on: ['005']
---

## Objective

Every section in the export repeats the same chrome: an eyebrow, a section `<h2>`, group labels
inside cards, form labels, helper text and a count numeral. None of those steps is on the typography
board, all of them are load-bearing, and three have no token. Land them, and wire the one existing
component (`Eyebrow`) that already renders one of them so the slice is proven on real markup rather
than a probe.

## Contract

n/a. Binding source, quoted from `.qa/design/spec/04-ds-foundations.md` §3.2:

| Role | Spec | Cite |
|---|---|---|
| Page title (masthead H1) | `44px / 1.1 / 700 / -0.02em / #0E2350` | `[HDR:4]` |
| Section heading (`<h2>` on every section) | `26px / 700 / #0E2350`, `margin:0 0 24px`, **no line-height or letter-spacing declared** | `[LOGO:3]`, `[COL:3]`, `[TYP:3]`, `[BTN:3]`, `[FRM:3]`, `[BDG:3]`, `[ALR:3]` |
| Section eyebrow | `12px / 700 / letter-spacing .1em / text-transform:uppercase / #2563EB`, `margin-bottom:8px` | `[COL:2]`, `[TYP:2]`, `[BTN:2]` … |
| Group label (inside cards) | `11px / 700 / letter-spacing .08em / uppercase / #94A3B8` | `[COL:6]`, `[BTN:6,19]`, `[FRM:45,64,75]`, `[ALR:5,39]` |
| Lead paragraph | `16px / 1.6 / #64748B`, `max-width:640px` | `[HDR:5]` |
| Inline code | `ui-monospace, Menlo, monospace` at `14px`, `#16326E` on `#F1F5F9`, `padding:2px 7px`, `radius:6px` | `[HDR:5]` |
| Form label | `13.5px / 600 / #0E2350` | `[FRM:7,12,22,29,38]` |
| Field helper / inline error | `12.5px`, helper `#94A3B8` (400), error `#DC2626` (500) | `[FRM:9,14,19]` |
| Count-badge numeral | `11.5px / 700 / #FFFFFF` | `[BDG:21]` |

## Design source

Per-role action against `src/app/globals.css` as it stands:

| Role | Token | Action |
|---|---|---|
| Masthead 44px | — | **ADD** `--text-masthead: 2.75rem; --text-masthead--line-height: 1.1; --text-masthead--letter-spacing: -0.02em;` `[HDR:4]`. A new name is required because `--text-page-title` is already 26px — the design's *Section heading*, not its page title. |
| Section h2 26px | `--text-page-title` `1.625rem` / lh `1.2` / ls **`-0.015em`** | **RETUNE**: delete `--text-page-title--letter-spacing`. The design declares no tracking on any of its seven section `<h2>`s; −0.015em at 26px is −0.39px per character and is visible. Line-height `1.2` is retained (the design's undeclared `normal` resolves to ≈1.2 for this face) — keep, do not chase. 8 consumers; read each before editing. |
| Eyebrow 12/.1em | `text-xs` + `--tracking-eyebrow: 0.1em` | **CONFIRM** both exist and are exact. Wire the existing `Eyebrow` component to them (see Steps). |
| Group label 11/.08em | `--text-micro` `0.6875rem` (11px) + `--tracking-rail: 0.08em` | **CONFIRM** — both exact. Record the pairing. |
| Form label 13.5/600 | `--text-body-sm` `0.84375rem` (13.5px) | **CONFIRM** — this token IS the design's form-label step (the collision documented in 005). Record the mapping. |
| Helper / inline error 12.5 | `--text-meta` (12.5px, lh 1.5 after 005) | **CONFIRM**. Helper ink `--color-slate-400` (`#94A3B8`), error ink `--destructive` (`#DC2626`) at weight 500. |
| Count numeral 11.5/700 | `--text-overline` `0.71875rem` (11.5px) | **CONFIRM** — exact. Its consumer `src/modules/design-system/components/count-badge.tsx` already exists. |
| Lead 16/1.6 | `--text-body` (from 005) | **CONFIRM**, ink `--muted-foreground`, measure `max-w-160` (640px). |
| Inline code 14px mono | `--font-mono` + `text-sm` | **CONFIRM**. Full recipe: `font-mono text-sm text-navy-800 bg-muted px-1.75 py-0.5 rounded-sm` — `--radius-sm` is `calc(0.625rem * 0.6)` = 6px, matching `[HDR:5]` exactly. |

**Eyebrow, wired.** `src/modules/design-system/components/eyebrow.tsx` (`data-slot="eyebrow"`) is the
existing consumer of this step and is rendered by `BrandSection` on `/design-system`. Read it, then
make it render exactly `text-xs font-bold tracking-eyebrow uppercase text-primary` with the design's
`margin-bottom:8px` expressed as the parent's `gap-2` where it is a flex child, and only as
`mb-2` where it is not. Change nothing else about it — no new props, no new variants.

**Mobile (375px).** The masthead step is the only one large enough to matter: 44px on a 375px
viewport with `px-5` gutters leaves a 335px measure, which fits "Design System" but not a long
localised title. Apply the design's own tightening pattern rather than inventing a breakpoint —
`text-h2 sm:text-masthead` (32px → 44px). Every other step here is ≤16px and is viewport-invariant;
assert that.

## Files

- `src/app/globals.css` — `@theme inline` `--text-*` region.
- `src/lib/utils.ts` — add `'masthead'` to `THEME_CLASS_GROUPS['font-size']`. **Mandatory** (see 005).
- `src/modules/design-system/components/eyebrow.tsx` — class list only.
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: chrome type` block.

## Depends on

- **005** — `--text-body` and the `--text-meta` leading retune are its output; this task confirms
  their chrome pairings and would assert stale numbers if run first.

## Steps

1. Add `--text-masthead` + its two sub-properties, with the `[HDR:4]` provenance comment.
2. Delete `--text-page-title--letter-spacing`; read all 8 `text-page-title` consumers first.
3. Register `'masthead'` in `src/lib/utils.ts`.
4. Read `eyebrow.tsx`, then align its classes to the design's exact four properties. Preserve its
   current API and every existing consumer's rendering contract.
5. Extend the e2e.

## Project rules

- `.claude/rules/tailwind.md:5` — token or built-in step, never an arbitrary size.
- `.claude/rules/module-pattern.md` — `eyebrow.tsx` is a design-system component; it stays dumb
  (no logic, no new props). File limits: 200 lines / 120 for a component.
- CLAUDE.md law 11 — `src/components/ui/*` untouched.
- CLAUDE.md law 15 — no unsolicited comments in the component.
- `.claude/rules/i18n.md` — the eyebrow renders `children`; no string is hardcoded by this task.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright on `/design-system`, against real rendered markup:
  - `[data-slot="eyebrow"]` first instance computes `font-size: 12px`, `font-weight: 700`,
    `letter-spacing: 1.2px` (12 × 0.1), `text-transform: uppercase`, and `color` equal to the
    resolved `--primary` probe string.
  - An injected `text-masthead` probe computes `44px` / `48.4px` / `-0.88px` at 1280.
  - A `text-page-title` element computes `26px` and `letter-spacing: normal` — the retune, asserted.
  - `text-micro` + `tracking-rail` probe → `11px` / `0.88px`.
  - `--text-overline` on the real `[data-slot="count-badge"]` → `11.5px`, `font-weight: 700`.
  - `--text-body-sm` on a real `FormsSection` label → `13.5px`, `font-weight: 600`.
- Mobile: at 375px the masthead element computes `32px` (the `text-h2 sm:text-masthead` step) and
  `document.documentElement.scrollWidth <= 375`; every other step returns the identical value it
  returned at 1280.
- `font-size` classGroup parity test green with `'masthead'` registered.
- Motion: this slice paints no animation. The `Eyebrow` change must not remove any existing
  `transition`/`animate-*` class from the component — diff-check and state so.
- axe zero serious/critical on `/design-system` at 375 and 1280; heading order unchanged.
- No i18n change; six catalogs key-identical at 1151.
- Zero banned-pattern grep hits.
- Full suite at the 157-pass baseline; `design-system.spec.ts` in particular stays green.

## Assumptions

- The design's section `<h2>` declares neither line-height nor letter-spacing, so "normal" is the
  faithful value for both. `--text-page-title--line-height: 1.2` is kept because the browser's
  `normal` for Google Sans lands within a fraction of it and removing it would make the step
  face-dependent; the letter-spacing is removed because −0.015em is a deliberate, visible
  deviation the design does not make.

## Evidence

<!-- computed metrics per step on real elements, the 375 masthead value, parity output, axe,
     suite count, and the eyebrow.tsx before/after class list -->
