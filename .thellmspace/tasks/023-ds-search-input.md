---
id: 023
title: Build the SearchInput primitive — leading magnifier, 38px inset, clear affordance
layer: ui
kind: implement
slice: SearchInput — the design's two search variants (forms board 14px, filter bar 13.5px)
target: src/modules/design-system/components/search-input.tsx, src/modules/design-system/types/primitives.types.ts, src/modules/design-system/components/showcase/forms-section.tsx, tests/e2e/ds-search-input.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--forms.html, .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/04-ds-foundations.md#5.2, .qa/design/spec/05-ds-components.md#6.1a
status: TODO
depends_on: [001, 004, 006, 007, 008, 010, 013, 022]
---

## Objective

One search input, two sizes, used by the dashboard filter bar (W5), school/agent search (W8) and
the topbar (W4). It must never carry the design's `outline:none` without a replacement focus
treatment — `.qa/PLAN.md` finding 2 records that the export suppresses focus on both search
inputs and that WCAG 2.2 AA forbids it.

## Contract

n/a. Two declared variants:

**A — forms board** `[FRM:23-26]`: wrapper `position:relative`; icon
`<svg width=15 height=15 stroke=#94A3B8 stroke-width=2.2 stroke-linecap=round>` (lucide `search`:
`circle cx=11 cy=11 r=8`, `m21 21-4.35-4.35`) at `left:13px; top:50%; translateY(-50%)`; input =
the §5.1 text input except `padding:10px 13px 10px 38px`; `font-size:14px`; same
`style-focus` (`border-color:#2563EB; box-shadow:0 0 0 3px rgba(37,99,235,.16)`); placeholder
`Search tests…`.

**B — filter bar** `ds--dashboard-components.html:6-9`: wrapper `position:relative; flex:1;
min-width:200px`; icon at `left:12px`; input `padding:9px 13px 9px 36px; border-radius:10px;
border:1px solid #CBD5E1; font-size:13.5px; color:#0E2350; background:#FFFFFF;
transition:border-color .15s, box-shadow .15s`; placeholder `Search students, tests…`.

## Design source

Tokens: `#94A3B8` → `text-muted-foreground-soft` (icon stroke); `#CBD5E1` → `border-input`;
`#0E2350` → `text-foreground`; `#FFFFFF` → `bg-card`; focus ring `--shadow-ring-focus`
(`0 0 0 3px oklch(0.5461 0.2152 262.88 / 0.16)`) + `border-primary`; radius `--radius-md` (10px);
sizes `--font-size-body-sm` (14px) / `--font-size-label` (13.5px).

Motion: `transition-[border-color,box-shadow] duration-150 ease-out-quart`; reduced-motion from
W0. The optional clear button (`x`) fades with `transition-opacity duration-150` — it is an
addition required by usability, recorded here so it is not mistaken for design drift.

Mobile (375px): variant B's `min-width:200px` plus the filter bar's `flex-wrap:wrap` means the
input takes the full row; the input must be `w-full` and the icon must not overlap typed text.

## Files

- `src/modules/design-system/components/search-input.tsx` — **new**; wraps `Input` from
  `@/components/ui/input`; props `{ size?: 'default'|'compact'; onClear?: () => void; label: string }`.
- `src/modules/design-system/types/primitives.types.ts` — `SearchInputProps`.
- `src/modules/design-system/index.ts` — export.
- `src/modules/design-system/components/showcase/forms-section.tsx` — both sizes.
- `tests/e2e/ds-search-input.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).
- **013** — the focus-ring foundation — the `focus-ring` utility, the input halo and the error ring.

Within W1:

- **022** — reuses the field shell's focus / error contract and `describedBy`.

## Steps

1. `type="search"`, `role` left native; a **visible-or-`sr-only` label** is required — the design
   shows a placeholder only, which is not an accessible name.
2. Left inset via `ps-*` padding token (38px / 36px) — logical properties, because `ar`/`he` are
   not in the locale set but `next-intl` routing already uses logical CSS elsewhere; icon
   positioned with `start-3.25`-equivalent token, never `left-[13px]`.
3. Focus: keep the vendored `focus-visible:border-ring focus-visible:ring-3
   focus-visible:ring-ring/50`; **never** add `outline-none` alone.
4. `onClear` renders a 26×26 dismiss IconButton (task 021, tone `ghost-soft`) only when the value
   is non-empty; it must be reachable by keyboard and labelled.
5. i18n: `DesignSystem.searchPlaceholder`, `.searchLabel`, `.searchClear` × 6 catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11 (input primitive read-only), law 8 (`'use client'` first line — this
  component holds no state unless `onClear` is used; keep it uncontrolled otherwise), law 14.
- `.claude/rules/module-pattern.md`, `.claude/rules/tailwind.md` (no `left-[13px]`,
  no `pl-[38px]` — use W0 spacing tokens), `.claude/rules/i18n.md`, `.claude/rules/quality.md`
  (visible focus is mandatory; the design's `outline:none` is a defect, not a spec),
  `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-search-input.spec.ts` asserts:
  - `getByRole('searchbox', { name: <label> })` resolves both variants;
  - focus produces a non-`none` `box-shadow` (proves the design's `outline:none` was replaced);
  - `padding-inline-start` is 38px (default) / 36px (compact) and the icon's bounding box does not
    intersect the text start;
  - typing then clicking clear empties the value and returns focus to the input.
- Motion: 150ms `transition-duration` on border/shadow; `0.01ms` under reduced motion.
- 375px: input is full-width, no horizontal overflow; 1280px: variant B sits in the filter row.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.

## Assumptions

- The clear button is an addition (the export has none). It is opt-in via `onClear`, so no
  existing screen changes shape.

## Evidence
