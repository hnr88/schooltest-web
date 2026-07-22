---
id: 191
title: Wire real pagination and the skill filter into Recent results
layer: integration
kind: implement
slice: Server-side paging over C-CHILD-RESULT-HISTORY plus the skill filter that resolves the design's unbound "All reports →".
target: src/modules/children/components/ChildResultsPager.tsx (new), src/modules/children/components/ChildResultsFilter.tsx (new), src/modules/children/hooks/use-child-results.ts (new), src/i18n/messages/*.json
contract: C-CHILD-RESULT-HISTORY
design: .qa/design/screens/portal--child-detail.html (L59-61, L64-72) · .qa/design/spec/02-portal-children.md §B.6, §UNKNOWNS "Handlers"
status: TODO
depends_on: ["190"]
---

## Objective

Make the results card genuinely paginated against the API's own pagination, and give the design's
unbound `All reports →` a real destination: the same card, unfiltered, at `pageSize` 10 with the
page controls and a skill filter — no invented route, no client-side slicing.

## Contract

`C-CHILD-RESULT-HISTORY` query contract, verbatim from `.qa/CONTRACTS.md`:

| Param | Type | Default | Rule |
|---|---|---|---|
| `page` | int >= 1 | `1` | |
| `pageSize` | int 1..50 | `10` | >50 ⇒ `400 ValidationError` |
| `skill` | enum reading/listening/speaking/writing | — | filters to that skill |

Unknown keys ⇒ `400`. Response `meta.pagination` = `{ page, pageSize, pageCount, total }`.
`404` for unknown or foreign child; `403` for a non-parent role.

## Design source

Header link (L61): 13.5px / 500 / `#7C8698`, hover `#2563EB`, copy `All reports →` — §UNKNOWNS records
that it has **no** `onClick` binding, so its destination is chosen here and recorded.
Filter chips follow §C.4's chip geometry ported to the portal: active
`text-caption font-semibold text-white bg-primary px-3 py-1 rounded-full`; inactive
`text-caption font-medium text-portal-muted border border-portal-border px-3 py-1 rounded-full`,
hover `border-navy-900`.
Pager uses the W1 pagination primitive with `rounded-full` controls at >=44px, keys
`Children.pagerLabel` / `pagerPage` / `pagerPrevious` / `pagerNext` / `pagerGoTo` (already present in
all six catalogs).

## Files

- `src/modules/children/hooks/use-child-results.ts` (new) — owns `page` + `skill` state and calls the
  W3 history query with them.
- `ChildResultsPager.tsx`, `ChildResultsFilter.tsx` (new).
- Catalogs: `Children.allReports`, `Children.filterSkillLabel`; `Children.filterAll` and
  `Children.resultSkills.*` already exist.

## Depends on

- `190` — the rows this pages.

## Steps

1. State lives in the hook; the query key includes `documentId`, `page` and `skill` so each page is
   cached separately and `keepPreviousData` avoids a flash between pages.
2. `pageSize` is fixed at the contract default `10`; never send a value above 50, and never send an
   unknown key (the API answers `400` for both) — prove both boundaries in the e2e.
3. Page controls render only when `meta.pagination.pageCount > 1`; the readout uses `pagerPage`.
4. `All reports →` clears the skill filter, returns to page 1 and moves focus to the first row —
   documented in Evidence as the resolution of the design's unbound handler.
5. Selecting a skill re-queries with `skill=` (assert the request URL) and resets `page` to 1.
6. Every filter/pager control is a real `<button>` with `aria-pressed` / `aria-current` as appropriate.

## Project rules

- `.claude/rules/state-data.md` — array query keys starting with the resource; one hook per query.
- `.claude/rules/module-pattern.md` — page/filter state in `hooks/`, not the component.
- `.claude/rules/quality.md` — keyboard operable, visible focus, 44px targets.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright, live: with `meta.pagination.pageCount > 1`, clicking next issues
  `?page=2&pageSize=10` and renders that page's rows (compared against the parsed body); the readout
  matches `page`/`pageCount`.
- Filtering by a skill issues `?skill=reading` (etc.), returns `200`, and every rendered row's `skill`
  equals it; clearing it via `All reports` returns to page 1 unfiltered.
- Contract boundaries proven with direct API requests in the same spec: `pageSize=51` → `400`,
  an unknown query key → `400`, another parent's child → `404`.
- Motion: page transition cross-fades rows with `st-fade-in` 180ms (opacity only), reduced-motion inert.
- 375px: filter chips scroll horizontally inside their own container (the page never scrolls),
  pager controls stay >=44px. 1280px: chips and pager on one row.
- axe zero serious/critical; six catalogs key-identical.

## Assumptions

If the seeded data has fewer than 11 official results, the paging assertions run against a throwaway
parent's child seeded through the API, or are proven at the API level and the UI branch is asserted
with a single page — never skipped.

## Evidence

<!-- filled in as the task runs -->
