---
id: 250
title: Re-skin the search empty and error states to the redesigned surface
layer: ui
kind: implement
slice: Zero results and a failed search request, on both panes
target: src/modules/search-shared/components/SearchEmptyState.tsx, src/modules/school-search/components/SchoolResults.tsx
contract: C-SEARCH-SCHOOLS (error envelope)
design: .qa/design/spec/06-auth-states-landing.md (empty states) · .qa/design/spec/01-portal-dashboard.md#11.5 (gap)
status: TODO
depends_on: ["237"]
---

## Objective

A search that matches nothing, and a search that fails, both land in the redesigned surface with
a state that explains itself and offers the one action that helps — reset, or retry.

## Contract

`POST /api/search/schools` errors (`.qa/intake/api-inventory.md` §10):

- `400 ValidationError "invalid search payload"` + `details.fields/issues`
- `403 "Only parents and admins can search schools"`
- `500 ApplicationError "school search response failed contract validation"`
- `429` rate limit (120 req/min/IP)

Strapi error envelope: `{ "data": null, "error": { "status", "name", "message", "details" } }`.
The UI never prints `error.message` verbatim (it can carry server internals); it prints the
catalog copy and offers retry. `unified-search-states.spec.ts` asserts the intercepted-500 path
renders an Alert with a retry control — that behaviour is preserved exactly.

Zero results is a **200**, not an error, and must never render as one.

## Design source

The Find-a-school design has no empty or error state (§11.5). Both are authored from the design
system's own objects, which the app already wraps:

| State | Object | Values |
|---|---|---|
| Empty | DS `EmptyState`, `tone="brand"` | 52px soft-blue medallion (`--color-blue-50` field, `--color-primary` glyph) inside a dashed tile; title `text-panel-title font-semibold text-navy-900`; description `text-body-sm text-body`; action = the existing `Search.resetFilters` outline button |
| Error | DS `Alert variant="error"` | `--color-danger-soft-2` chip, `--color-danger-strong` ink, `--radius-xl` box, `--shadow-alert`; title `SchoolSearch.error.title`, body `SchoolSearch.error.body`, action `SchoolSearch.error.retry` |

Copy: existing keys are kept (`SchoolSearch.empty.title`, `empty.sub`, `error.title`,
`error.body`, `error.retry`, `Search.resetFilters`, and the agent mirrors) — three specs resolve
them through the catalog. Their VALUES may be re-written; their keys may not be removed.

Empty-state copy must distinguish the two real causes, so one new key pair per pane:
`SchoolSearch.empty.titleQuery` / `empty.subQuery` when `q` is non-empty (suggest clearing the
term), versus the existing filter-only copy.

Motion: the existing `animate-in fade-in slide-in-from-bottom-2 duration-300 ease-out-expo`
on the empty state is kept; the Alert enters with `animate-in fade-in duration-200`. Both keep
`motion-reduce:animate-none`.

375px: the empty medallion and copy stack centred with `px-4`; the Alert's action wraps under its
body rather than shrinking the text.

## Files

- `src/modules/search-shared/components/SearchEmptyState.tsx`
- `src/modules/school-search/components/SchoolResults.tsx`
- `src/modules/agent-search/components/AgentResults.tsx`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json`

## Depends on

- **237** — the states sit in the list column the cards define.

## Steps

1. Re-skin `SearchEmptyState` to the values above; keep `[data-slot="search-empty-state"]`
   (`unified-search.spec.ts:160` locates it) and keep the reset button's accessible name equal to
   `Search.resetFilters`.
2. Add the query-aware copy branch; `onReset` still calls the store `reset()` (which clears `q`
   too, so the shared `UnifiedSearchBar` blanks — the W6 reset-desync fix must not regress).
3. Keep the error branch's early return in `SchoolResults`/`AgentResults` and its retry →
   `query.refetch()`.
4. Add the new keys to all six catalogs.

## Project rules

`.claude/rules/i18n.md`: six catalogs key-identical; never print a raw server message.
`.claude/rules/quality.md`: the empty state is not an error (`role="status"`, not `alert`);
visible focus; 4.5:1 contrast. `.claude/rules/state-data.md`: retry through the query hook.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: search a term with no matches → `[data-slot="search-empty-state"]` renders the
  query-aware copy, no Alert appears, and the network shows a **200** (not an error path);
  pressing `Search.resetFilters` clears the field, fires one request, and restores results
  (`unified-search.spec.ts:155-165` passes unmodified).
- `page.route('**/api/search/schools', r => r.fulfill({ status: 500, … }))` → the error Alert
  renders, the retry button is focusable, and un-routing + retry restores results
  (`unified-search-states.spec.ts` passes unmodified).
- The rendered error text never contains the server's `error.message` string.
- Six catalogs key-identical.
- axe clean in BOTH states at 375 + 1280; reduced motion kills both entrances.

## Assumptions

429 and 403 render the same generic error copy as 500 — the app cannot help a parent act on
either, and distinguishing them would leak rate-limit internals.

## Evidence

_(filled in as the task runs)_
