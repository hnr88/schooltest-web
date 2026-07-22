---
id: 252
title: Apply the parent's saved search preferences to the school search, and let them save the current filters
layer: integration
kind: wire
slice: `search-preferences/me` ↔ the school-search store — read on entry, write on demand
target: src/modules/unified-search/hooks/use-search-preference-defaults.ts (new), src/modules/school-search/stores/use-school-search-store.ts, src/modules/settings/index.ts
contract: C-SEARCHPREF-GET, C-SEARCHPREF-UPDATE
design: .qa/design/spec/01-portal-dashboard.md#8.2 (filter bar hosts the control)
status: TODO
depends_on: ["235"]
---

## Objective

The defaults a parent saved in Settings actually shape the search they land on, and the filters
they just built can be saved back as their default — a real row in Postgres that survives a
reload. Today the preference row is write-only from Settings and the search surface ignores it.

## Contract

**C-SEARCHPREF-GET — `GET /api/search-preferences/me`** (`.qa/CONTRACTS.md`):

> Auth: users-permissions parent JWT only. No request body, path parameter or query parameter;
> the owning user is always derived server-side from the JWT.
> 200: `{ data }`, without a `meta` member. `data` is
> `{ documentId, default_states: AU-state[], default_school_types: combined|primary|secondary[],
> default_sectors: government|non-government|catholic[], default_sort:
> relevance|name-asc|name-desc|fee-asc|fee-desc, default_page_size: integer 1..50,
> default_fee_min: integer 0..1000000|null, default_fee_max: integer 0..1000000|null, createdAt,
> updatedAt }`.
> Persistence: get-or-create the caller's single `search_preferences` row … First read returns
> the persisted defaults (empty arrays, `relevance`, page size `12`, null fees); it never returns
> the `user` relation. Errors: project-standard 403 for unauthenticated/non-parent callers.

**C-SEARCHPREF-UPDATE — `PUT /api/search-preferences/me`**:

> Request: a strict, flat partial object using only C-SEARCHPREF-GET's seven `default_*` setting
> fields. Arrays have the same enum vocabulary and maximum cardinality (states 8, school
> types/sectors 3); duplicates are persisted once. `default_page_size` is 1..50; fee values are
> integers 0..1000000 or null; when both fee bounds are non-null, minimum must not exceed
> maximum. Owner/id/timestamp or other unknown fields are rejected.
> 200: the exact `{ data: SearchPreferenceView }` after the durable update. Errors: 400 typed
> `ValidationError` for invalid/unknown input; 403 for unauthenticated/non-parent callers.

## Design source

The design has no saved-search control (G17 records that no shortlist/saved-search content-type
exists — this task does **not** invent one; it only uses the seven existing `default_*` fields).
The control is one chip in the design's §8.2 filter bar row, drawn exactly like the applied-filter
chip from task 233 but with a bookmark glyph:

`bg-card text-navy-900 border border-navy-900 rounded-full px-4 py-2.25 text-meta font-medium`,
lucide `Bookmark` at `size-3.5`, `transition-colors duration-150 ease-out-expo`,
`active:scale-95`, `motion-reduce:` variants. On success it swaps to a check for 1.5 s with
`animate-in zoom-in-95 fade-in duration-150`, then back — no toast stack needed.

Field mapping (preferences → store), applied ONCE per mount before the first search:

| Preference | Store field |
|---|---|
| `default_states` | `states` |
| `default_school_types` | `schoolTypes` |
| `default_sectors` | `sectors` |
| `default_sort` | `sortBy` |
| `default_page_size` | `pageSize` (new store field; `storeToRequest` currently hard-codes `PAGE_SIZE`) |
| `default_fee_min` / `default_fee_max` | `feeMin`/`feeMax`, falling back to `FEE_MIN_BOUND`/`FEE_MAX_BOUND` when null |

375px: the save chip wraps with the rest of the filter bar; its pointer box is ≥44px.

## Files

- `src/modules/unified-search/hooks/use-search-preference-defaults.ts` (**new**)
- `src/modules/unified-search/components/SaveSearchDefaultsButton.tsx` (**new**)
- `src/modules/school-search/stores/use-school-search-store.ts` (`pageSize` + `applyDefaults`)
- `src/modules/school-search/lib/store-to-request.ts` (`pageSize` from the store)
- `src/modules/settings/index.ts` (export `useSearchPreferencesQuery`,
  `useUpdateSearchPreferencesMutation`, `SEARCH_PREFERENCES_QUERY_KEY`, type `SearchPreference` —
  the barrel currently exports only `SettingsScreen`)
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `SchoolSearch.savedDefaults.save`,
  `savedDefaults.saved`, `savedDefaults.error`

## Depends on

- **235** — the controls must reflect the hydrated selection when it lands.

## Steps

1. Widen the `settings` barrel (additive only). **Import direction:** the hook lives in
   `unified-search`, which already imports both search barrels; `school-search` must NOT import
   `@/modules/settings` — `settings/schemas/search-preferences.schema.ts` already imports
   `@/modules/school-search`, and the reverse edge would close a cycle.
2. `use-search-preference-defaults.ts`: run `useSearchPreferencesQuery`, and on first success
   call `applyDefaults(preference)` guarded by a ref so a refetch never stomps filters the user
   has since changed. A 403/failed read is non-fatal — the search runs on the built-in defaults.
3. `applyDefaults` sets the six fields in ONE `set()` (one re-render, one request) and resets
   `page` to 1.
4. Add `pageSize` to `SchoolSearchFilters` (default `PAGE_SIZE` = 12) and read it in
   `storeToRequest`; the server accepts `pageSize` 1..50, and `SearchPagination` must be handed
   the same value it requested rather than the constant.
5. `SaveSearchDefaultsButton` PUTs only the six mapped fields plus `default_page_size`, using the
   existing `useUpdateSearchPreferencesMutation` (which already `setQueryData`s the cache).
   Send `null` for a fee bound that equals its bound constant, so "no fee filter" persists as
   `null`, not as `5000`/`60000`.
6. Surface a failed save with the existing DS `Alert`/sonner toast path and the new error key —
   never a silent no-op.

## Project rules

`.claude/rules/state-data.md`: mutations invalidate/`setQueryData`; hooks in `queries/`;
selectors only; no cross-module internals. `.claude/rules/module-pattern.md`: barrel-only cross
imports, no cycles. `.claude/rules/i18n.md`: six catalogs.
`.qa/CONTRACTS.md`: strict body — an unknown key is a 400, so send exactly the seven fields.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- **Persistence proof:** Playwright logs in as the seeded parent, applies QLD + Catholic + sort
  `name-desc`, presses Save; the `PUT /api/search-preferences/me` returns 200 with
  `default_states:['QLD']`, `default_sectors:['catholic']`, `default_sort:'name-desc'`; then a
  FULL page reload (`page.reload()`) lands on `/dashboard/search` with those filters already
  applied and the first `POST /api/search/schools` body already carrying them.
- The same row is visible in Postgres: `psql` read against 127.0.0.1:5540 shows the
  `search_preferences` row for that user with the three values (read-only query, pasted into
  Evidence).
- Restoring the defaults (clear all → Save) returns the row to `[] [] relevance 12 null null`
  and a reload shows the unfiltered corpus — the test leaves the fixture as it found it.
- Sending an unknown field is not possible: assert the PUT body has exactly the seven `default_*`
  keys.
- A stubbed 403 on `GET /api/search-preferences/me` still renders a working search on built-in
  defaults (no crash, no error state).
- `settings-tabs.spec.ts` still passes (its search-preferences write path is untouched).
- Six catalogs key-identical; axe clean at 375 + 1280; reduced motion kills the save animation.

## Assumptions

`default_page_size` is applied to the school search only; the agents pane keeps its own
`PAGE_SIZE` because the preference row is documented as the school search's defaults.

## Evidence

_(filled in as the task runs)_
