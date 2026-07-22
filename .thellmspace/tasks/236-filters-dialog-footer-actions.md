---
id: 236
title: Wire the filters dialog footer — Clear all and the live "Show N schools" action
layer: frontend
kind: wire
slice: The design's §8.6 sticky footer, bound to the real result total
target: src/modules/school-search/components/SchoolFiltersDialog.tsx, src/i18n/messages/*.json
contract: C-SEARCH-SCHOOLS
design: .qa/design/screens/portal--main.html:252-256 · .qa/design/spec/01-portal-dashboard.md#8.6
status: TODO
depends_on: ["234", "235"]
---

## Objective

The dialog's sticky footer carries "Clear all" and a navy confirm button whose label states how
many schools the current filter set actually matches, read from the live API total, and which
closes the dialog.

## Contract

The count in the button is `meta.pagination.total` from the in-flight
`POST /api/search/schools` for the CURRENT store state (`.qa/intake/api-inventory.md` §10) — the
same number task 231 renders in the sub-line, from the same TanStack cache entry
(`['school-search', request]`). No extra request. No client-side recount.

Design spec quoted (§8.6):

> **Footer**: sticky. `display:flex; align-items:center; justify-content:space-between;
> padding:18px 28px; border-top:1px solid #EEF1F6; position:sticky; bottom:0; background:#fff;
> border-radius:0 0 24px 24px`.
> **"Clear all"** — `background:transparent; color:#3D4A5C; font-size:14px; font-weight:600;
> border:none; text-decoration:underline; padding:8px 4px`. Resets `fCity:'All', fTypes:{},
> fPrograms:{}, fRating:'Any'`.
> **"Show {{ filteredCount }} schools"** — `background:#0E2350; color:#fff; font-size:14px;
> font-weight:600; padding:13px 26px; border-radius:999px`, `style-hover="background:#16326E"`.
> Closes the modal. Wording is not pluralised — it reads "Show 1 schools" at count 1.

## Design source

`.qa/design/screens/portal--main.html:252-256`.

| Element | Design | Implementation |
|---|---|---|
| Footer | sticky bottom, `18px 28px`, 1px `#EEF1F6` top rule, white | `sticky bottom-0 flex items-center justify-between border-t border-divider bg-card px-7 py-4.5` |
| Clear all | transparent, `#3D4A5C`, 14/600, underline, `8px 4px` | `rounded-md px-1 py-2 text-body-sm font-semibold text-body underline underline-offset-2 hover:text-navy-900` |
| Confirm | `#0E2350`, white, 14/600, `13px 26px`, r999, hover `#16326E` | `rounded-full bg-navy-900 px-6.5 py-3.25 text-body-sm font-semibold text-primary-foreground hover:bg-navy-800` |

**The design's un-pluralised copy is a defect** ("Show 1 schools"). `.claude/rules/i18n.md`
requires ICU plurals for counts, so the key is:

```
"SchoolSearch.filterPanel.showCount": "{count, plural, =0 {Show no matches} one {Show # school} other {Show # schools}}"
"SchoolSearch.filterPanel.clearAll":  "Clear all"
```

`filterPanel.clear` (the rail's existing "Clear filters" key, asserted by
`school-filter-panel.spec.ts:32` and `unified-search.spec.ts:226` through the catalog) is
**kept**; `clearAll` is the dialog footer's own key.

Motion: `transition-colors duration-150 ease-out-expo` + `active:scale-95` on both, with
`motion-reduce:` variants. When the count changes while the dialog is open, the label swaps with
`animate-in fade-in duration-150` keyed on the number.

375px: footer stays two-up (`justify-between`), the confirm button keeps its 44px height, and
neither label wraps to a third line (`whitespace-nowrap` on the confirm label only).

## Files

- `src/modules/school-search/components/SchoolFiltersDialog.tsx`
- `src/modules/school-search/stores/use-school-search-store.ts` (reuse the EXISTING `clearFilters`
  action — it already preserves `q` and `isMapOpen`; do not add a second reset)
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json`

## Depends on

- **234** — the dialog shell owns the sticky footer slot.
- **235** — clearing has to visibly reset the chip groups.

## Steps

1. Read the live total through the same hook task 231 introduced
   (`use-search-result-total.ts`); render `t('filterPanel.showCount', { count })`. While the
   query is pending, keep the previous count rather than flashing 0.
2. "Clear all" calls the existing `clearFilters()` and leaves the dialog OPEN (the design's
   Clear-all does not close), so the user sees the groups reset.
3. The confirm button closes the dialog. It performs no search of its own — the store already
   drove the request as each chip was pressed; this is the design's dismiss affordance and must
   not fire a duplicate `POST`.
4. Add both keys to all six catalogs.

## Project rules

`.claude/rules/i18n.md`: ICU plurals; six catalogs key-identical.
`.claude/rules/state-data.md`: never a second store action for an existing behaviour.
`.claude/rules/quality.md`: 44px targets, visible focus, labelled buttons.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: open the dialog, press QLD, and assert the confirm button's accessible name equals
  `SchoolSearch.filterPanel.showCount` formatted with the `total` taken from the intercepted
  `POST /api/search/schools` response — compared against the captured body, never hard-coded.
- Pressing the confirm button closes the dialog and fires **zero** additional
  `POST /api/search/schools` (count requests before/after).
- "Clear all" resets every chip's `aria-pressed` to `false`, fires one request whose body has no
  `states`/`sectors`/`schoolTypes`/fee keys, and leaves the dialog open.
- At count 1 the label reads "Show 1 school" (the plural defect is not reproduced).
- Six catalogs key-identical; the seven W8 regression specs green.
- axe clean with the dialog open at 375 + 1280; reduced-motion kills the transitions.

## Assumptions

The design's "Show N schools" is a dismiss button, not a submit — the export binds it to
`closeFilters` (`Parent Portal.dc.html`), which is what is implemented.

## Evidence

_(filled in as the task runs)_
