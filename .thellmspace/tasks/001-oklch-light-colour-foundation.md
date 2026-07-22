---
id: 001
title: Land the design's 21 swatch-board colours as OKLCH `@theme` tokens with hex provenance (light)
layer: ui
kind: implement
slice: The light colour foundation — every colour the design's swatch board publishes, resolvable as an `@theme` token with its source hex recorded
target: src/app/globals.css (`:root` + `@theme inline`), tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/screens/ds--colors.html · .qa/design/spec/04-ds-foundations.md#2-colour-system (§2.2, §2.3, §2.4) · #TAILWIND-V4-MAPPING sections A + B + C
status: TODO
depends_on: []
---

## Objective

Make every colour on the design's swatch board reachable as an OKLCH `@theme` token whose source
hex is recorded next to it, so no component in waves W1–W11 ever needs a raw hex or an arbitrary
colour value. This is an AUDIT-AND-CLOSE task, not a rewrite: `src/app/globals.css` already carries
most of this layer from mission-2 and the 157-green regression baseline depends on it staying put.

## Contract

n/a — pure token layer. The binding spec is `.qa/design/spec/04-ds-foundations.md` §2.2, quoted in
full below, plus `.qa/DECISIONS.md` **D-DESIGN-2**: "the design's hex values are the authority for
the COLOUR; they are converted to OKLCH and land as `@theme` tokens in `src/app/globals.css`. The
hex is recorded next to each token as provenance."

## Design source

`.qa/design/screens/ds--colors.html` — the board is five groups, each
`display:grid; grid-template-columns:repeat(6,1fr); gap:12px`; every chip is
`height:72px; border-radius:10px`. The 21 published colours and the token each MUST resolve to:

| Group | Board name | Hex | Token that must resolve to it | OKLCH |
|---|---|---|---|---|
| Brand navy | `navy-950` | `#0A1A3C` | `--navy-950` / `--color-navy-950` | `oklch(0.227 0.0691 263.0857)` |
| Brand navy | `navy-900` | `#0E2350` | `--navy-900`, `--foreground`, `--card-foreground`, `--popover-foreground`, `--chart-3` | `oklch(0.2692 0.0871 263.0388)` |
| Brand navy | `navy-800` | `#16326E` | `--navy-800`, `--secondary-foreground`, `--sidebar-accent-foreground` | `oklch(0.3341 0.1099 263.0016)` |
| Primary blue | `blue-700` | `#1D4ED8` | `--blue-700` | `oklch(0.4882 0.2172 264.3763)` |
| Primary blue | `blue-600` | `#2563EB` | `--blue-600`, `--primary`, `--chart-1`, `--sidebar-primary` | `oklch(0.5461 0.2152 262.8809)` |
| Primary blue | `blue-500` | `#3B82F6` | `--blue-500` | `oklch(0.6231 0.188 259.8145)` |
| Primary blue | `blue-100` | `#DBEAFE` | `--blue-100` | `oklch(0.9319 0.0316 255.5855)` |
| Primary blue | `blue-50` | `#EFF5FF` | `--blue-50`, `--secondary`, `--sidebar-accent` | `oklch(0.9685 0.0148 260.7297)` |
| Accent teal | `teal-600` | `#0D9488` | `--teal-600` | `oklch(0.6002 0.1038 184.704)` |
| Accent teal | `teal-500` | `#14B8A6` | `--teal-500`, `--accent`, `--chart-2` | `oklch(0.7038 0.123 182.5025)` |
| Accent teal | `teal-100` | `#CCFBF1` | `--teal-100` | `oklch(0.9527 0.0498 180.8012)` |
| Accent teal | `teal-50` | `#F0FDFA` | `--teal-50` | `oklch(0.9836 0.0142 180.72)` |
| Neutrals | `slate-900` | `#0F172A` | **board-only — no token** | `oklch(0.2077 0.0398 265.7549)` |
| Neutrals | `slate-600` | `#475569` | `--color-body`, `--sidebar-foreground` | `oklch(0.4455 0.0374 257.2808)` |
| Neutrals | `slate-500` | `#64748B` | `--muted-foreground` | `oklch(0.5544 0.0407 257.4166)` |
| Neutrals | `slate-300` | `#CBD5E1` | `--input` | `oklch(0.869 0.0198 252.8943)` |
| Neutrals | `border` | `#E3E8F0` | `--border`, `--sidebar-border` | `oklch(0.9295 0.0121 259.823)` |
| Neutrals | `background` | `#F7F9FC` | `--background` | `oklch(0.9814 0.0045 258.3244)` |
| Semantic | `success` | `#16A34A` | `--success` | `oklch(0.6271 0.1699 149.2138)` |
| Semantic | `warning` | `#D97706` | `--warning` | `oklch(0.6658 0.1574 58.3183)` |
| Semantic | `destructive` | `#DC2626` | `--destructive` | `oklch(0.5771 0.2152 27.325)` |

Off-board colours the eight DS slices use (spec §2.3) and the token that already carries each — this
mapping is the deliverable, not new tokens:

| Hex | Role | Existing token |
|---|---|---|
| `#94A3B8` | placeholder / helper / disabled text / idle dismiss icon | `--color-slate-400` `oklch(0.7107 0.0351 256.7878)` |
| `#F1F5F9` | ghost-button hover, inline-code bg, disabled input bg, neutral badge bg | `--muted` = `--color-surface-inset` `oklch(0.9683 0.0069 247.8956)` |
| `#EEF2F7` | hairline divider, toast progress track | `--color-divider` = `--color-surface-well` `oklch(0.9595 0.008 253.8534)` |
| `#DCFCE7` / `#15803D` | success tint / success text | `--color-success-soft-2` / `--color-success-strong` |
| `#FEF3C7` / `#B45309` | warning tint / warning text | `--color-warning-soft` / `--color-warning-strong` |
| `#FEE2E2` / `#B91C1C` | destructive tint / destructive text | `--color-danger-soft-2` / `--color-danger-strong` |
| `#E9EEF5` | skeleton sheen | `--color-skeleton-sheen` |
| `#0E2350` / `#A9BADC` / `#2DD4BF` / `#8FA3C7` | dark-toast surface / body / icon / dismiss | `--navy-900` / `--color-navy-body` / `--color-accent-on-dark` / `--color-navy-muted` |

## Files

- `src/app/globals.css` — `:root` and the `@theme inline` block ONLY. No other rule in the file.
- `tests/e2e/design-tokens.spec.ts` — EXTEND (a new `test.describe('TOKENS: colour foundation')`
  block). Never a second token spec file.

## Depends on

Nothing. This is the wave's root; 002, 003 and 013 build on the provenance convention it sets.

## Steps

1. Read `src/app/globals.css` end to end before editing. Every value in the table above is already
   present and correct EXCEPT the provenance comments — verify each one byte-for-byte against the
   table and fix only genuine mismatches.
2. Add a `/* #RRGGBB — <board name> */` provenance comment to each of the 21 `:root` declarations
   that lacks one. Comments only; do not reorder or regroup the block.
3. `#0F172A` (`slate-900`) is board-only — the spec records no component that consumes it. Do NOT
   add a token for it (CLAUDE.md law 1, zero extras). Record the refusal in Evidence.
4. Leave `--color-slate-400`, `--color-divider`, `--color-surface-inset`, `--color-success-soft-2`,
   `--color-warning-soft`, `--color-danger-soft-2`, `--color-skeleton-sheen`, `--color-navy-body`,
   `--color-accent-on-dark`, `--color-navy-muted` exactly as they are — they already carry the §2.3
   values. Add the design hex as a provenance comment where missing.
5. Extend `tests/e2e/design-tokens.spec.ts` with the assertions in Done criteria.

## Project rules

- `schooltest-web/.claude/rules/tailwind.md:1` — OKLCH only, never raw hex/HSL in a declaration.
  The design hex appears ONLY inside a CSS comment, which is the provenance mechanism D-DESIGN-2
  mandates and is not a colour declaration.
- `tailwind.md:12` — every value from the default scale or an `@theme` token; square brackets are
  a failure.
- The `@theme inline` + `:root` split is load-bearing: a token whose value differs between light
  and `.dark` MUST be declared raw on `:root`/`.dark` and referenced from `@theme inline` as
  `--color-x: var(--x)`. A light-only fixed brand tint may be declared literally inside `@theme`
  (existing precedent: `--color-success-soft`, `--color-skeleton-sheen`).
- `src/lib/utils.ts` `THEME_CLASS_GROUPS` deliberately does NOT register the `--color-*` namespace
  (tailwind-merge accepts any colour value). This task therefore must NOT touch `src/lib/utils.ts`.
- CLAUDE.md law 15 — no unsolicited prose comments. The provenance hex comment is explicitly
  required by D-DESIGN-2 and is the only comment this task adds.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- Playwright, against the running app on `/design-system`: for each of the 21 rows,
  `getComputedStyle(document.documentElement).getPropertyValue('<var>').trim()` equals the OKLCH
  string in the table EXACTLY (the browser returns custom properties as declared).
- Playwright rendered proof, exact-equality without string-format guessing: inject two probe
  elements via `page.evaluate` — one with `style.backgroundColor = 'var(--background)'`, one with
  `class="bg-background"` — and assert their computed `backgroundColor` strings are identical and
  non-empty. Repeat for `--primary`/`bg-primary` and `--border`/`border-border`.
- The `TOKENS: every --…* @theme token is registered` parity tests already in the spec stay green
  (no `--text-*`/`--radius-*`/`--shadow-*`/`--ease-*`/`--tracking-*`/`--container-*` token added).
- Assertions run at 1280×720 and 375×812; tokens are viewport-independent so both must return the
  identical strings — assert that explicitly, it is the guard against a stray media query.
- No motion in this slice (token declarations paint nothing); state so rather than inventing one.
- axe: zero serious/critical on `/design-system` at 375 and 1280 (regression fence — this task must
  not move any rendered colour).
- No i18n keys change; all six catalogs stay at 1151 keys.
- Banned-pattern grep over the diff: zero hex literals outside a `/* … */` comment, zero `[` in any
  class string.
- The full pre-existing suite stays at its 157-pass baseline (PLAN.md "Regression baseline").

## Assumptions

- **Pure white is kept.** `--card`, `--popover` and every `*-foreground` on a coloured fill resolve
  to `oklch(1 0 89.8756)`. `.qa/design/spec/04-ds-foundations.md` UNKNOWN 9 flags this against
  `CLAUDE.md §5` pitfall 12, and proposes `oklch(0.9955 0.0015 258)` as a tinted substitute — but
  that is explicitly labelled "a proposal, not a design decision", the design ships literal
  `#FFFFFF`, and changing it would move every card surface in the app. D-DESIGN-2 makes the design
  hex authoritative for the colour, so the value stands unchanged and the conflict is recorded here
  rather than silently resolved.
- The board's `slate-900 #0F172A` has no component consumer anywhere in the eight DS slices, so no
  token is created for it.

## Evidence

<!-- computed custom-property strings for all 21, probe-element equality output, axe summary,
     full-suite pass count, and the two recorded refusals (pure white, slate-900) -->
