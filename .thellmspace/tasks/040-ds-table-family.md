---
id: 040
title: Rebuild the Table — clipped card shell, toolbar, uppercase head row, hover row transition
layer: ui
kind: implement
slice: TableCard + toolbar + head row + body row + cells
target: src/modules/design-system/components/data-grid-row.tsx, src/modules/design-system/components/data-table-shell.tsx, src/modules/design-system/types/data-display.types.ts, src/modules/design-system/components/showcase/data-table.tsx, tests/e2e/ds-table.spec.ts
contract: n/a (presentation slice — the rows it displays are contracted by C-CHILD-RESULT-HISTORY in W2/W3)
design: .qa/design/screens/ds--table.html, .qa/design/spec/05-ds-components.md#2.1,#2.2,#2.3,#2.4
status: TODO
depends_on: [001, 004, 006, 007, 008, 010, 021, 031, 035]
---

## Objective

The child's recent-results table (W6) is this component. Ship the shell, toolbar, head row and
body row with the design's exact grid tracks and the one transition the export actually declares.

## Contract

n/a for presentation. The row data comes from `C-CHILD-RESULT-HISTORY`
(`GET /api/my/students/:documentId/results`) in W2/W3 — this component renders what it is handed.

`.qa/design/spec/05-ds-components.md` §2, verbatim:

**Shell** `background:#FFFFFF; border:1px solid #E3E8F0; border-radius:16px; overflow:hidden;
box-shadow:0 1px 2px rgba(14,35,80,.05)` — `overflow:hidden` clips rows to the radius.

**Toolbar** `display:flex; align-items:center; justify-content:space-between; padding:18px 22px;
border-bottom:1px solid #EEF2F7`; title `16px / 600 / #0E2350`; trailing tonal button
`background:#EFF5FF; color:#16326E; font-size:13px; font-weight:600; padding:7px 13px;
border-radius:9px`, hover `#DBEAFE`.

**Head row** `display:grid; grid-template-columns:2.2fr 1.2fr .8fr .8fr .9fr .5fr;
padding:10px 22px; background:#F8FAFD; border-bottom:1px solid #EEF2F7; font-size:11.5px;
font-weight:700; letter-spacing:.06em; text-transform:uppercase; color:#94A3B8`. **No sort
affordance exists in the markup** (UNKNOWN) — do not invent one here.

**Body row** same grid tracks, `align-items:center; padding:14px 22px;
border-bottom:1px solid #F1F5F9; font-size:14px; transition:background .12s`; hover
`background:#F8FAFD`.

Cells: (1) icon tile 30×30 radius 9px with a tinted 14×14 glyph + name `600 / #0E2350`;
(2)(3) `color:#64748B`; (4) `font-weight:600; color:#0E2350`; (5) status pill (task 031);
(6) `text-align:right` + a 30×30 row-actions button (task 021).

## Design source

Tokens: shell `bg-card`/`border-border`/`--radius-2xl`/`--shadow-card`; toolbar rule
`--color-rule` (`#EEF2F7`); head `bg-table-head` (`#F8FAFD` → W0 `--color-surface-subtle`),
`--font-size-count` (11.5px), `tracking-[0.06em]` → W0 `--tracking-head`,
`text-muted-foreground-soft`; row divider `bg-muted` (`#F1F5F9`); row hover
`--color-surface-subtle`; body `--font-size-body-sm` (14px).

Motion: `transition-[background-color] duration-[--duration-row] ease-out-quart` where
`--duration-row` = **120ms** (the export's `.12s` — a distinct step from the 150ms control
vocabulary; W0 must expose it). Reduced-motion from W0.

Mobile (375px): the six-track grid cannot survive 375px. The export defines no collapse
(`.qa/design/spec/05-ds-components.md` RESPONSIVE HINTS: "these will overflow on narrow
viewports as authored"). Authored here: below `md` the table becomes a stacked card list — each
row a two-column `label / value` block with the name cell as its header — **not** a horizontally
scrolling table, because a parent on a phone must be able to read a result without panning.

## Files

- `src/modules/design-system/components/data-table-shell.tsx` — **new**; shell + toolbar +
  head-row + pagination slot.
- `src/modules/design-system/components/data-grid-row.tsx` — re-cut `DataGridHeadRow` /
  `DataGridRow` to the tracks above; keep the existing `grid-cols-*` `@utility` names from
  `globals.css` (`grid-cols-history-row` etc.) rather than adding new arbitrary track strings.
- `types/data-display.types.ts` — `DataTableShellProps`, `DataGridRowProps` (+ `stacked`).
- showcase `data-table.tsx` (already exists — re-point it); `tests/e2e/ds-table.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **004** — the spacing scale and the design's off-4pt named steps (7/9/11/13/18/22/26px).
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).

Within W1:

- **035** — the card shell.
- **031** — the status pill in the status cell.
- **021** — the 30px row-actions button.

## Steps

1. Semantics: use `role="table"`/`rowgroup`/`row`/`columnheader`/`cell` on the grid divs, or wrap
   a real `<table>` with `display:grid` rows. Whichever is chosen, the head cells must be
   programmatically associated — a grid of divs with no roles is an a11y failure.
2. Keep the em-dash "no data" convention from §2.4 (`Avg` is `—` when there are no graded
   submissions) — the component never substitutes `0%`.
3. The stacked (mobile) form reuses the same data; no second data path.
4. Row hover must not be the only affordance for a clickable row — if rows are clickable they get
   a focusable control, never `<div onClick>`.
5. i18n all column labels and the toolbar action; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11 (`table.tsx` read-only), law 14, law 15.
- `.claude/rules/module-pattern.md` (≤200 lines per file — split shell and row);
  `.claude/rules/tailwind.md` (named grid `@utility`, no arbitrary `grid-cols-[2.2fr…]` in JSX);
  `.claude/rules/quality.md` (table semantics, focus, contrast); `.claude/rules/i18n.md`;
  `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-table.spec.ts` asserts on `/design-system`:
  - the shell has `overflow: hidden` and 16px radius, and the first row's top corners are clipped
    (screenshot-free check: row `border-top-left-radius` inherits nothing, shell clips);
  - the head row is uppercase 11.5px/700 with `letter-spacing: 0.06em` on `#F8FAFD`;
  - the six grid tracks resolve to the documented fractions at 1280px;
  - hovering a body row transitions `background-color` over **120ms** to the subtle token;
  - a row with no average renders `—` and not `0%`;
  - `getByRole('columnheader')` returns 5 named headers (the 6th is intentionally unnamed and
    must therefore be `aria-hidden` or given an sr-only label — assert whichever is implemented).
- Motion `0.01ms` under `reducedMotion: 'reduce'`.
- 375px: the stacked form renders, every value is reachable without horizontal scrolling, and
  `scrollWidth <= clientWidth`; 1280px: the grid form.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.

## Assumptions

- The mobile collapse (stacked cards) is authored — the export defines none, and a horizontally
  scrolling table would fail the mission's "do good mobile" requirement (D-SCOPE-1).
- No sort affordance is added; the export has none and inventing one would be out of scope.

## Evidence
