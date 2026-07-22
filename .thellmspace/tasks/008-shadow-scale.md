---
id: 008
title: Confirm the four-step shadow scale and add the seven component elevations the design actually paints
layer: ui
kind: implement
slice: The elevation scale — the navy-tinted four-step ramp plus every distinct box-shadow the design system uses, as `--shadow-*` tokens
target: src/app/globals.css (`:root` + `@theme inline`), src/lib/utils.ts (`THEME_CLASS_GROUPS['shadow']`), tests/e2e/design-tokens.spec.ts
contract: n/a
design: dashbaord-design/tokens.css:68-71 · .qa/design/screens/ds--buttons.html:8 · ds--alerts.html:7,41,46 · ds--forms.html:77 · ds--dark-mode.html:35,48 · .qa/design/spec/04-ds-foundations.md#2-4 and #TAILWIND-V4-MAPPING-F
status: TODO
depends_on: []
---

## Objective

`tokens.css` publishes a four-step shadow ramp, and the components then use seven shadows that are
NOT on that ramp — same geometry, different alpha. Both facts are real. Land the ramp as-is and add
the seven component elevations as their own named tokens, so no W1 primitive has to write a raw
`box-shadow` or pick the wrong alpha.

## Contract

n/a. Binding source, quoted from `.qa/design/spec/04-ds-foundations.md` §2.4:

> Shadow scale `[TOK:68–71]` — all tinted with navy-900 `#0E2350`:
> `--shadow-sm` `0 1px 2px rgba(14,35,80,.06)` · `--shadow-md` `0 2px 8px rgba(14,35,80,.08)` ·
> `--shadow-lg` `0 8px 24px rgba(14,35,80,.12)` · `--shadow-xl` `0 20px 48px rgba(14,35,80,.18)`
>
> **Shadows actually used in the eight slices** (none of them exactly equals a `--shadow-*` token —
> the alpha differs): `0 1px 2px rgba(14,35,80,.08)` Primary button `[BTN:8]` ·
> `0 1px 2px rgba(14,35,80,.05)` Alert card ×4 `[ALR:7,12,17,28]` ·
> `0 1px 3px rgba(14,35,80,.25)` Switch knob `[FRM:77,81]` ·
> `0 12px 32px rgba(14,35,80,.28)` Dark toast `[ALR:41]` ·
> `0 12px 32px rgba(14,35,80,.14)` Light toast `[ALR:46]` ·
> `0 16px 40px rgba(14,35,80,.35)` Live fixed toast `[SRC:1527]`

and UNKNOWN 12: "Whether the components or the tokens are authoritative is undecided."

## Design source

The navy tint is `#0E2350` = `oklch(0.2692 0.0871 263.0388)` in every one of these.

**Ramp — already present in `:root`, verify byte-for-byte and add provenance comments:**

| Token | Value | Cite |
|---|---|---|
| `--shadow-sm` | `0 1px 2px oklch(0.2692 0.0871 263.0388 / 6%)` | `[TOK:68]` |
| `--shadow-md` | `0 2px 8px oklch(0.2692 0.0871 263.0388 / 8%)` | `[TOK:69]` |
| `--shadow-lg` | `0 8px 24px oklch(0.2692 0.0871 263.0388 / 12%)` | `[TOK:70]` |
| `--shadow-xl` | `0 20px 48px oklch(0.2692 0.0871 263.0388 / 18%)` | `[TOK:71]` |

**Component elevations — ADD, all seven:**

| Token | Value | Consumer | Cite |
|---|---|---|---|
| `--shadow-btn` | `0 1px 2px oklch(0.2692 0.0871 263.0388 / 8%)` | Primary button | `[BTN:8]` |
| `--shadow-alert` | `0 1px 2px oklch(0.2692 0.0871 263.0388 / 5%)` | all four alert cards | `[ALR:7,12,17,28]` |
| `--shadow-knob` | `0 1px 3px oklch(0.2692 0.0871 263.0388 / 25%)` | switch knob | `[FRM:77,81]` |
| `--shadow-toast` | `0 12px 32px oklch(0.2692 0.0871 263.0388 / 28%)` | dark toast specimen | `[ALR:41]` |
| `--shadow-toast-light` | `0 12px 32px oklch(0.2692 0.0871 263.0388 / 14%)` | light toast specimen | `[ALR:46]` |
| `--shadow-toast-live` | `0 16px 40px oklch(0.2692 0.0871 263.0388 / 35%)` | the runtime fixed toast | `[SRC:1527]`, `ds--dark-mode.html:48` |
| `--shadow-dialog` | `0 28px 64px oklch(0.2692 0.0871 263.0388 / 30%)` | live dialog panel | `ds--dark-mode.html:35` |

**Do not collapse near-duplicates.** `--shadow-dark-lift` already exists at
`0 16px 40px oklch(0.2692 0.0871 263.0388 / 28%)` — same geometry as `--shadow-toast-live`, four
alpha points lighter, and it has live consumers. Keep both, comment the distinction. `--shadow-btn`
and `--shadow-sm` share a geometry and differ only in alpha (.08 vs .06); that is the design's own
inconsistency and both are kept, per UNKNOWN 12 resolved as: **the component value is authoritative
for that component; the ramp stays exactly as `tokens.css` declares it.**

**Focus and error rings are NOT in this task.** `0 0 0 3px rgba(37,99,235,.16)` `[FRM:8]` and
`0 0 0 3px rgba(220,38,38,.10)` `[FRM:13]` are box-shadows in the markup but are focus/validation
affordances; they belong to 013 so the a11y reasoning lives in one place.

**The dialog scrim** `rgba(10,26,60,.45)` + `backdrop-filter:blur(2px)`
(`ds--dark-mode.html:34`) is a background, not a shadow — and `backdrop-filter` on a translucent
panel is the banned "glassmorphism" pattern (`.claude/rules/tailwind.md:11`). Resolution: land the
scrim colour only, as `--color-scrim: oklch(0.227 0.0691 263.0857 / 45%)` (navy-950 at 45%), and
drop the 2px blur. Record the refusal — do not port the blur.

## Files

- `src/app/globals.css` — `:root` (seven new `--shadow-*` raw values + `--scrim`) and
  `@theme inline` (the `--shadow-*` references and `--color-scrim`).
- `src/lib/utils.ts` — add `'btn'`, `'alert'`, `'knob'`, `'toast'`, `'toast-light'`,
  `'toast-live'`, `'dialog'` to `THEME_CLASS_GROUPS['shadow']`. **Mandatory** — the existing
  `shadow` group lists `sm, md, lg, xl, primary-glow, dark-lift`, and the parity test in
  `design-tokens.spec.ts` fails on any `--shadow-*` token missing from it.
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: elevation` block.

## Depends on

Nothing. (013 depends on this for the `--shadow-*` namespace and its registration convention.)

## Steps

1. Verify the four ramp values against `[TOK:68-71]`; add provenance comments.
2. Add the seven component elevations to `:root`, each with its cite.
3. Add `--scrim` / `--color-scrim`; record the refused `backdrop-filter:blur(2px)`.
4. Register the seven names in `src/lib/utils.ts`.
5. Extend the e2e. Touch no component — W1 wires them.

## Project rules

- `.claude/rules/tailwind.md:1` — OKLCH only; the design's `rgba(14,35,80,α)` becomes
  `oklch(0.2692 0.0871 263.0388 / α%)`, hex recorded in the comment.
- `.claude/rules/tailwind.md:11` — glassmorphism banned; the scrim ships without the blur.
- `.claude/rules/tailwind.md:9` — animate `transform`/`opacity` only; nothing here may become a
  transitioned property. A hover "lift" in W1 uses `transform`, not a shadow interpolation.
- `src/lib/utils.ts` docstring — registration is binding.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright on `/design-system`: all eleven `--shadow-*` custom properties plus `--scrim` resolve
  to the exact strings above on `document.documentElement`.
- Rendered proof on real markup: `[data-slot="metric-card"]` or another existing `shadow-sm`
  consumer computes a `box-shadow` string equal to an injected `shadow-sm` probe's — exact string
  equality between two computed values, no format guessing.
- Injected probes for `shadow-btn`, `shadow-alert`, `shadow-knob`, `shadow-toast`,
  `shadow-toast-live`, `shadow-dialog` each compute a non-`none` `box-shadow` whose blur radius
  matches the table (2px, 2px, 3px, 32px, 40px, 64px). A probe with
  `class="shadow-sm shadow-btn"` must compute the `shadow-btn` value — the tailwind-merge proof.
- `--shadow-dark-lift` still resolves to its `28%` value and is NOT equal to `--shadow-toast-live`
  — the anti-collapse assertion.
- The `shadow` classGroup parity test passes with all seven names registered.
- 375 and 1280: identical resolved strings.
- Motion: none added; assert no element gains a `transition-property` containing `box-shadow` in
  the diff.
- axe zero serious/critical at both viewports.
- No i18n change; six catalogs key-identical at 1151.
- Zero banned-pattern grep hits; zero `backdrop-filter` in the diff.
- Full suite at the 157-pass baseline.

## Assumptions

- UNKNOWN 12 is resolved in favour of "both are real": the ramp is the elevation *system*, the seven
  component values are what those specific components draw. Neither is deleted, and the divergence
  is a design fact recorded in comments rather than smoothed away.
- `--shadow-toast-light` is named for the light-surface toast, not for a "small toast". Stated
  because the `-light` suffix reads ambiguously next to `-lg`/`-sm`.

## Evidence

<!-- resolved shadow strings, probe blur radii, the shadow-sm/shadow-btn merge probe, the
     dark-lift ≠ toast-live assertion, parity output, suite count -->
