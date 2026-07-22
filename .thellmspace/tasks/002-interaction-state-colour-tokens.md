---
id: 002
title: Author the hover / disabled colour role tokens from the design's `style-hover` attributes
layer: ui
kind: implement
slice: The interaction-state colour layer — every `style-hover` and disabled fill in the design system reachable as a named `@theme` role token
target: src/app/globals.css (`:root` + `@theme inline`), tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/screens/ds--buttons.html (`[BTN:8-15,21-27]`) · .qa/design/screens/ds--alerts.html (`[ALR:10,15,23,24,34,44,49,54]`) · .qa/design/spec/04-ds-foundations.md#4-2-variants-all-seven-states-each and #TAILWIND-V4-MAPPING-B
status: TODO
depends_on: ['001']
---

## Objective

Every `style-hover="…"` block in the design export becomes a named colour role token, so the 38
W1 primitive tasks never restate a ramp step by hand and never reach for `hover:bg-blue-700`-style
implicit coupling. The design's disabled fill — the one colour on the buttons board that maps to no
existing token — is added.

## Contract

n/a. Binding source is `.qa/design/spec/04-ds-foundations.md` §4.2, quoted:

> | Variant | default | hover (`style-hover`) |
> | **Primary** | `background:#2563EB; …; box-shadow:0 1px 2px rgba(14,35,80,.08)` | `background:#1D4ED8` |
> | **Navy** | `background:#0E2350; color:#FFFFFF` | `background:#16326E` |
> | **Accent** | `background:#14B8A6; color:#FFFFFF` | `background:#0D9488` |
> | **Secondary** | `background:#EFF5FF; color:#16326E` | `background:#DBEAFE` |
> | **Outline** | `background:#FFFFFF; color:#16326E; border:1px solid #CBD5E1` | `background:#F7F9FC` |
> | **Ghost** | `background:transparent; color:#16326E` | `background:#F1F5F9` |
> | **Destructive** | `background:#DC2626; color:#FFFFFF` | `background:#B91C1C` |
>
> **Disabled** `[BTN:27]` — `background:#E2E8F0; color:#94A3B8; border:none; cursor:not-allowed`.
> No hover, no shadow, **no opacity change.**

## Design source

Tokens to declare. Nine of the ten alias an existing ramp step — declare them as `var(--ramp)` so a
future ramp correction cannot desynchronise the hover:

| New token | Design hex | Value to write | Cite |
|---|---|---|---|
| `--color-primary-hover` | `#1D4ED8` | `var(--blue-700)` → `oklch(0.4882 0.2172 264.3763)` | `[BTN:8]` |
| `--color-navy-hover` | `#16326E` | `var(--navy-800)` → `oklch(0.3341 0.1099 263.0016)` | `[BTN:9]`, `[ALR:44,54]` |
| `--color-accent-hover` | `#0D9488` | `var(--teal-600)` → `oklch(0.6002 0.1038 184.704)` | `[BTN:10]` |
| `--color-secondary-hover` | `#DBEAFE` | `var(--blue-100)` → `oklch(0.9319 0.0316 255.5855)` | `[BTN:11]`, `[ALR:23]` |
| `--color-outline-hover` | `#F7F9FC` | `var(--background)` → `oklch(0.9814 0.0045 258.3244)` | `[BTN:12,25,26]` |
| `--color-ghost-hover` | `#F1F5F9` | `var(--muted)` → `oklch(0.9683 0.0069 247.8956)` | `[BTN:13]`, `[ALR:10,24,49]` |
| `--color-destructive-hover` | `#B91C1C` | `var(--color-danger-strong)` → `oklch(0.5054 0.1905 27.5181)` | `[BTN:14]`, `[ALR:34]` |
| `--color-link-hover` | `#1D4ED8` | `var(--blue-700)` | `[BTN:15]`, `[SRC:16]` |
| `--color-disabled-surface` | `#E2E8F0` | `oklch(0.9288 0.0126 255.5078)` — **NEW value, nothing existing matches** (`--border` is `#E3E8F0`, one step lighter) | `[BTN:27]` |
| `--color-disabled-foreground` | `#94A3B8` | `var(--color-slate-400)` → `oklch(0.7107 0.0351 256.7878)` | `[BTN:27]`, `[FRM:17,18]` |

Two facts from the spec that must be carried, not smoothed over:

- **Ghost foreground is ambiguous** (spec UNKNOWN 17): `#16326E` on the buttons board `[BTN:13]`
  but `#64748B` for the ghost "Dismiss" inside the warning alert `[ALR:24]`. Both are real, in
  different contexts. Do NOT invent a single canonical value: the ghost BUTTON foreground is
  `--navy-800`, the alert's xs ghost ACTION foreground is `--muted-foreground`. Record both, add
  no third token.
- **Disabled is a colour swap, not an opacity drop.** The design sets an explicit fill and ink and
  changes no alpha. Anything in W1 that reaches for `disabled:opacity-*` for a button contradicts
  `[BTN:27]`.
- **No `:active` / pressed colour exists anywhere in the export** (spec UNKNOWN 2). Do not author
  one here — pressed feedback is a motion concern and belongs to 010/011's transform scale.

## Files

- `src/app/globals.css` — `@theme inline` (the ten tokens) and, for `--color-disabled-surface`
  only, a `:root` raw declaration if it needs to differ under `.dark` (it does — see 003; declare
  it on `:root` as `--disabled-surface` and reference it, so 003 can override).
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: interaction states` block.

## Depends on

- **001** — sets the provenance-comment convention and confirms every ramp step these tokens alias.

## Steps

1. Declare `--disabled-surface: oklch(0.9288 0.0126 255.5078); /* #E2E8F0 — disabled button fill [BTN:27] */`
   on `:root`.
2. Add the ten `--color-*` role tokens to `@theme inline`, each aliasing its ramp token via `var()`
   (only `--color-disabled-surface` points at the new `:root` value), each with its hex + slice cite
   as a provenance comment.
3. Do NOT touch `src/lib/utils.ts` — the `--color-*` namespace is deliberately unregistered.
4. Do NOT rewrite `src/modules/design-system/lib/button-variants.ts` in this task. W1 owns the
   button. This slice only makes the colours reachable; proving them uses the button as it stands
   today (its `hover:bg-blue-700` resolves to the identical colour, which is exactly what makes the
   assertion meaningful).
5. Extend the e2e.

## Project rules

- `.claude/rules/tailwind.md:1,12` — OKLCH only; hex lives in comments only; no square brackets.
- CLAUDE.md law 11 — `src/components/ui/*` is read-only; this task touches neither it nor any
  component.
- CLAUDE.md law 1/4 — ten tokens, nothing else. No third ghost token, no `:active` token, no
  `disabled:opacity` helper.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright on `/design-system`: each of the ten custom properties resolves non-empty on
  `document.documentElement`, and each equals the computed value of the ramp token it aliases
  (compare the two resolved strings via probe elements, as in 001).
- **Rendered hover proof against the running app:** `page.hover()` the first primary `Button` in
  `ButtonsSection`, then assert its computed `background-color` equals the resolved
  `--color-primary-hover` probe string. Repeat for the outline button → `--color-outline-hover`.
  Playwright's real pointer hover, not a class assertion.
- `--color-disabled-surface` proof: assert the computed `background-color` of the disabled button
  specimen on `/design-system` is NOT equal to `--border` (it is one step darker) and that its
  computed `opacity` is `1` — the design's disabled state changes fill, never alpha.
- Motion: this slice adds no animation, but the hover it enables is what 010 gives a transition to;
  state the seam explicitly. Assert nothing regressed under
  `page.emulateMedia({ reducedMotion: 'reduce' })` — the hover colour must still apply (a colour
  change is not motion and must not be suppressed).
- 375 and 1280: identical resolved strings at both.
- axe zero serious/critical on `/design-system` at both viewports.
- No i18n change; six catalogs stay key-identical at 1151.
- Zero banned-pattern grep hits in the diff.
- Full suite still at the 157-pass baseline.

## Assumptions

- `--color-link-hover` duplicates `--color-primary-hover`'s value but is declared separately because
  the design gives anchors and Link-buttons DIFFERENT hover treatments at the same colour
  (`[BTN:15]` adds `text-decoration:underline`; the global `a:hover` `[SRC:16]` does not). Naming
  them apart keeps that distinction expressible in W1.
- `--color-disabled-surface` is declared on `:root` (not literally inside `@theme`) because 003 must
  override it for dark mode; every other token here aliases a ramp that already switches.

## Evidence

<!-- resolved token strings, real-hover computed background-color before/after, disabled opacity,
     axe summary, suite pass count -->
