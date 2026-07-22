---
id: 020
title: Rebuild the design-system Button to the export's 8 variants, 5 sizes and 7 states
layer: ui
kind: implement
slice: Button — every variant, size, icon slot, disabled, loading and focus state
target: src/modules/design-system/lib/button-variants.ts, src/modules/design-system/components/button.tsx, src/modules/design-system/types/button.types.ts, src/modules/design-system/components/showcase/buttons-section.tsx, tests/e2e/ds-button.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--buttons.html, .qa/design/spec/04-ds-foundations.md#4-buttons, .qa/design/spec/04-ds-foundations.md#0-2-keyframes-the-complete-animation-inventory, .qa/design/spec/04-ds-foundations.md#TAILWIND-V4-MAPPING
status: TODO
depends_on: [001, 002, 004, 005, 006, 007, 008, 010, 011, 013]
---

## Objective

`src/modules/design-system/components/button.tsx` is the app's only button. Re-cut its variant
and size tables to the design export exactly, add the two states the current component cannot
express (design-spec disabled fill and the `st-spin` loading spinner), and give it a
`prefers-reduced-motion` safe transition. Nothing may be added to `src/components/ui/button.tsx`.

## Contract

n/a. The binding spec is `.qa/design/spec/04-ds-foundations.md` §4:

> §4.1 shared base — `display:inline-flex; align-items:center; gap:8px; font-size:14px;
> font-weight:600; padding:10px 18px; border-radius:10px; cursor:pointer;
> transition:background .15s`.
> §4.2 the eight variants and their hover fills.
> §4.3 sizes sm / default / lg / icon / xs.
> §4.4 leading + trailing icon, icon-only, disabled, loading.

## Design source

`.qa/design/screens/ds--buttons.html` lines 6-28. Exact values — copy these, do not re-derive:

**Sizes** (`[BTN:21-26]`)

| size | font-size | padding | radius | icon gap |
|---|---|---|---|---|
| `sm` | 13px | 7px 13px | 8px (`--radius-sm`) | 6px |
| `default` | 14px | 10px 18px | 10px (`--radius-md`) | 8px |
| `lg` | 15px (`--font-size-btn-lg`) | 13px 26px | 12px (`--radius-lg`) | 8px |
| `icon` | — | none | 10px | — (fixed 38×38, `inline-grid; place-items:center`) |
| `xs` | 12.5px (`--font-size-caption`) | 6px 12px | 8px | — (alert action, `[ALR:23]`) |

**Variants** (hex → the `@theme` token W0 emits; use the token utility, never the hex)

| variant | fill | text | border | hover fill |
|---|---|---|---|---|
| `default` (primary) | `#2563EB` `bg-primary` | `#FFFFFF` `text-primary-foreground` | none, `shadow-btn` = `0 1px 2px oklch(0.2692 0.0871 263.04 / 0.08)` | `#1D4ED8` `hover:bg-primary-hover` |
| `navy` | `#0E2350` `bg-navy-900` | white | none, **no shadow** | `#16326E` `hover:bg-navy-800` |
| `accent` | `#14B8A6` `bg-accent` | white | none | `#0D9488` `hover:bg-accent-hover` |
| `secondary` | `#EFF5FF` `bg-secondary` | `#16326E` `text-secondary-foreground` | none | `#DBEAFE` `hover:bg-secondary-hover` |
| `outline` | `#FFFFFF` `bg-card` | `#16326E` | `1px solid #CBD5E1` `border-input`, padding `9px 17px` (1px compensation so the border-box height matches) | `#F7F9FC` `hover:bg-background`, border unchanged |
| `ghost` | transparent | `#16326E` `text-secondary-foreground` | none | `#F1F5F9` `hover:bg-muted` |
| `destructive` | `#DC2626` `bg-destructive` | white | none | `#B91C1C` `hover:bg-destructive-hover` |
| `link` | none | `#2563EB` `text-primary` | none, **no radius, no gap**, padding `10px 4px` | `#1D4ED8` + `underline` |

**Disabled** `[BTN:27]` — fill `#E2E8F0` (`bg-disabled`), text `#94A3B8`
(`text-muted-foreground-soft`), `cursor-not-allowed`, no hover, no shadow, **no opacity change**
(the vendored primitive's `disabled:opacity-50` must be overridden, not inherited).

**Loading** `[BTN:28]` — primary fill, gap `9px`, `cursor:progress`, `opacity:.85`, label
`Saving…`; spinner is 14×14, `border:2px solid rgba(255,255,255,.35)`, `border-top-color:#fff`,
`border-radius:50%`, `animation: st-spin .7s linear infinite` (W0's `--animate-spin`).

**Icons** — leading/trailing SVG 15×15, `stroke-width:2.4`, `stroke-linecap:round`; icon-only
button is 38×38 with a 16×16 `stroke-width:2` glyph and a required `aria-label`.

**Focus-visible** — `.qa/design/spec/04-ds-foundations.md` UNKNOWN 1: the export declares **no**
button focus style. Per `.qa/PLAN.md` finding 2 the ring is authored from the design's own
`--ring` token (`rgba(37,99,235,.35)` → `--color-ring`). The vendored primitive already ships
`focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50` — **keep it**; the
wrapper must not add `outline-none` or otherwise suppress it.

## Files

- `src/modules/design-system/lib/button-variants.ts` — rewrite `VARIANT_CLASSES` / `SIZE_CLASSES`
  to the tables above; add `ghost`, `link`, `xs`, `icon`.
- `src/modules/design-system/types/button.types.ts` — extend `ExtendedButtonVariant` /
  `ExtendedButtonSize`; keep `ButtonProps` shape (`loading`, `href`) unchanged.
- `src/modules/design-system/components/button.tsx` — keep the `href` → `next-intl` `Link`
  branch, the `aria-busy` / `aria-disabled` wiring and `render`/`nativeButton` pass-through
  exactly as they are today; only swap the spinner to the `st-spin` element and add the
  `loading` gap/cursor classes.
- `src/modules/design-system/components/showcase/buttons-section.tsx` — one row per group
  (`Variants`, `Sizes · icons · states`) as `[BTN:6,19]`.
- `tests/e2e/ds-button.spec.ts` — new spec.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **002** — the hover / disabled interaction colour roles taken from the design's `style-hover`.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **005** — the eight published type steps.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **011** — `st-fade-in` / `st-pop-in` / `st-toast-in` / `st-spin` as `--animate-*` + the reduced-motion variant.
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

## Steps

1. Read `src/components/ui/button.tsx` (read-only) and record which base classes already land:
   `transition-all`, `focus-visible:ring-3`, `disabled:opacity-50`, `active:…translate-y-px`.
2. Rewrite `lib/button-variants.ts` variant/size maps; the `after:` pointer-target insets already
   in `SIZE_CLASSES` stay — they are the 44px target fix from mission 2 and must survive.
3. Override `disabled:opacity-50` → `disabled:opacity-100 disabled:bg-disabled
   disabled:text-muted-foreground-soft disabled:cursor-not-allowed` on the wrapper.
4. Motion: `transition-[background-color] duration-150 ease-out-quart` on every filled/outline/
   ghost variant (`transition:background .15s` `[BTN:8-14]`, upgraded to an exponential easing per
   `.claude/rules/tailwind.md`). Link keeps no transition, matching `[BTN:15]`.
5. Reduced motion: rely on W0's global `@media (prefers-reduced-motion: reduce)` block; assert it.
6. Spinner: a `<span aria-hidden>` with `animate-spin` (W0 `--animate-spin` = `st-spin 700ms
   linear infinite`), `size-3.5`, 2px ring, `border-t-*` highlight.
7. Showcase: render all 8 variants, 5 sizes, leading/trailing icon, icon-only, disabled, loading.
   All labels via `t('DesignSystem.button*')`; add the missing keys to all six catalogs.
8. E2E `tests/e2e/ds-button.spec.ts`.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 11 — **never edit `src/components/ui/*`**; law 8; law 14
  (no `any`); law 15 (no comments beyond the ones that explain a non-obvious constraint).
- `.claude/rules/module-pattern.md` — variants live in `lib/`, types in `types/*.types.ts`,
  component ≤120 lines, cross-module import via `@/modules/design-system` barrel only.
- `.claude/rules/tailwind.md` — OKLCH tokens only; **no arbitrary values** (`text-[13px]`,
  `p-[7px]` are failures — use the W0 utilities); animate transform/opacity (the background-colour
  transition is the documented §I.1 exception); exponential easings only.
- `.claude/rules/i18n.md`, `.claude/rules/quality.md` (visible focus, ≥44px targets),
  `.claude/rules/testing.md` + D-VERIFY-1.

## Done criteria

- `pnpm tsc --noEmit` and `pnpm lint` clean.
- `tests/e2e/ds-button.spec.ts` green against the running app and asserts, on `/design-system`:
  - all 8 variants resolve to the right computed `background-color` /`color`
    (`getComputedStyle` equality against the OKLCH token resolved from `:root`);
  - `sm|default|lg` heights and the 38×38 icon button (`boundingBox()`);
  - `button[disabled]` has `cursor: not-allowed` and `opacity: 1`;
  - the loading button has `aria-busy="true"`, a spinner with a non-`none` `animation-name`, and
    is not clickable;
  - `page.keyboard.press('Tab')` onto the primary button yields a non-zero
    `box-shadow`/`outline` (focus ring visible).
- Motion proof: hovering the primary button transitions `background-color` over `150ms`; with
  `page.emulateMedia({ reducedMotion: 'reduce' })` the computed `transition-duration` is `0.01ms`.
- 375px and 1280px: the variant rows wrap (`flex-wrap`), `document.documentElement.scrollWidth
  <= clientWidth` at both widths.
- axe: zero serious/critical on `/design-system`.
- Six catalogs key-identical (en, zh, ko, ms, vi, th) — assert via `tests/e2e/helpers/i18n.ts`.
- The existing `design-system.spec.ts` variant matrix still passes (it selects
  `button.bg-navy-900`, `button.bg-accent`, `button.border-input`, `button.text-primary` — keep
  those class hooks or update the spec in the same commit).
- Zero banned-pattern grep hits in the diff: `any`, `#[0-9a-fA-F]{3,6}`, `p-[`, `text-[`, `w-[`.

## Assumptions

- The W0 tokens named above exist by the time this runs (`.qa/fragments/w0.json` ids 001-013).
  If a specific token is missing — e.g. `--shadow-btn` at alpha `.08` rather than `--shadow-sm`'s
  `.06` — add it to the `@theme` block in this commit as an OKLCH entry with the hex recorded as
  provenance (D-DESIGN-2), and say so in Evidence. Never fall back to a raw hex or an arbitrary
  value.
- Ghost foreground is `#16326E` (`[BTN:13]`), not the `#64748B` used by the alert's ghost
  "Dismiss" (`[ALR:24]`) — spec UNKNOWN 17; the buttons board wins for the generic component and
  task 033 passes the alert's colour as a prop.

## Evidence

<!-- filled in as the task runs -->
