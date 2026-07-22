---
id: 041
title: Rebuild Pagination — range caption, chevron buttons, active/inactive pages, ellipsis
layer: ui
kind: implement
slice: Pagination bar (the table footer control)
target: src/modules/design-system/components/pagination-bar.tsx, src/modules/design-system/lib/pagination-range.ts, src/modules/design-system/types/data-display.types.ts, src/modules/design-system/components/showcase/data-table.tsx, tests/e2e/ds-pagination.spec.ts
contract: n/a (presentation slice — page/total values come from C-CHILD-RESULT-HISTORY meta in W3)
design: .qa/design/screens/ds--table.html, .qa/design/spec/05-ds-components.md#2.5
status: TODO
depends_on: [001, 006, 007, 010, 021, 040]
---

## Objective

Real pagination for the child's result history (W6) — `.qa/PLAN.md` W6 calls for "recent results
with **real** pagination", so this control must drive an actual page change, not a decorative
row of numbers.

## Contract

n/a for presentation; the counts come from the Strapi `meta.pagination` block returned by
`C-CHILD-RESULT-HISTORY` (`GET /api/my/students/:documentId/results`).

`.qa/design/spec/05-ds-components.md` §2.5 (`ds--table.html:22-32`), verbatim:

- Bar: `display:flex; align-items:center; justify-content:space-between; padding:14px 22px`
  (**no top border**).
- Range caption: `font-size:13px; color:#94A3B8` — `Showing 1–4 of 12` (en dash U+2013),
  pattern `Showing {from}–{to} of {total}`.
- Cluster: `display:flex; gap:6px; align-items:center`.
- Prev/Next: 32×32, `border-radius:8px; border:1px solid #E3E8F0; background:#FFFFFF;
  color:#94A3B8`, hover `#F7F9FC`, `aria-label="Previous"` / `"Next"`, 14×14 chevrons
  (`m15 18-6-6 6-6` / `m9 18 6-6-6-6`) at `stroke-width:2.4`.
- Active page: 32×32, `border-radius:8px; border:none; background:#2563EB; color:#FFFFFF;
  font-size:13px; font-weight:600` — **no hover override declared**.
- Inactive page: same box, `border:1px solid #E3E8F0; background:#FFFFFF; color:#475569`,
  hover `#F7F9FC`.
- Ellipsis: `color:#94A3B8; font-size:13px; padding:0 4px`, glyph `…` (U+2026).
- Order: Prev, `1` (active), `2`, `3`, `…`, Next. Note the chevrons are deliberately lighter
  (`#94A3B8`) than the digits (`#475569`).

## Design source

Tokens: caption `--font-size-caption-lg` (13px) `text-muted-foreground` (the design's `#94A3B8`
is 2.8:1 on white and fails `.claude/rules/quality.md`; the caption carries information, so it
steps to `#64748B` — recorded, not silent). Buttons: `border-border`, `bg-card`,
`text-muted-foreground-soft` (chevrons, decorative + labelled), `text-body` (digits),
active `bg-primary`/`text-primary-foreground`; radius `--radius-sm` (8px); box 32px.

Motion: `transition-[background-color] duration-150 ease-out-quart` on hover (the export declares
none); the page-change itself is instant — never animate a content swap that a screen reader must
announce. Reduced-motion from W0.

## Files

- `src/modules/design-system/components/pagination-bar.tsx` — **new**; wraps
  `Pagination*` from `@/components/ui/pagination` (read-only, already re-exported through
  `design-system/primitives/data.ts`).
- `src/modules/design-system/lib/pagination-range.ts` — **new**; pure function
  `getPageItems({ page, pageCount, siblings })` → `(number | 'ellipsis')[]`. Pure, testable, no
  React.
- `types/data-display.types.ts` — `PaginationBarProps { page, pageCount, pageSize, total,
  onPageChange }`.
- showcase `data-table.tsx`; `tests/e2e/ds-pagination.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).

Within W1:

- **040** — pagination lives inside the table card (the export places it there, not in Navigation).
- **021** — the 32px icon-button box.

## Steps

1. `getPageItems` is a pure helper in `lib/` — never inline page-window maths in the component
   (`.claude/rules/module-pattern.md`: no non-hook helper functions inside components).
2. Semantics: `<nav aria-label="Pagination">`; the current page carries `aria-current="page"`;
   Prev/Next are `disabled` at the ends (the export shows no disabled state — UNKNOWN — so the
   treatment is derived from task 020's disabled fill and recorded).
3. The range caption is an ICU message with three values, not string concatenation:
   `Showing {from}–{to} of {total}`.
4. `onPageChange` is the only side effect; the component holds no page state.
5. i18n `DesignSystem.paginationRange|Previous|Next|Page`; six catalogs; verify the en dash
   survives every catalog.
6. E2E.

## Project rules

- `CLAUDE.md` law 11, law 14, law 15; `.claude/rules/module-pattern.md` (pure helper in `lib/`);
  `.claude/rules/tailwind.md`; `.claude/rules/quality.md` (`aria-current`, keyboard reachable,
  44px targets); `.claude/rules/i18n.md` (ICU, no concatenation); `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-pagination.spec.ts` asserts on `/design-system`:
  - the caption reads `Showing 1–4 of 12` in `en` and the correctly-formatted equivalent in `zh`;
  - `getByRole('navigation', { name: /pagination/i })` exists; the active page has
    `aria-current="page"` and the primary fill; inactive pages have the bordered white box;
  - each button is 32×32 at 8px radius and every one has an accessible name;
  - clicking `2` calls the handler and the active page moves (assert `aria-current` moves);
  - `Previous` is `disabled` on page 1 and `Next` on the last page;
  - the ellipsis is not focusable.
- `getPageItems` output is asserted for `pageCount` 1, 3, 12 and 100 by rendering each in the
  showcase and reading the DOM (no unit test substitutes for the running-app proof, D-VERIFY-1).
- Motion 150ms hover; `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: the cluster wraps below the caption and every target is ≥44px; no horizontal overflow.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.

## Assumptions

- Disabled Prev/Next styling is derived from task 020 (the export shows none).
- Page-size selection is not part of the design and is not added.

## Evidence
