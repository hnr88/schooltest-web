---
id: 231
title: Render the school result count from the real pagination total in the header sub-line
layer: frontend
kind: wire
slice: Design metric #9 — the "{n} schools" sub-line and the live results heading
target: src/modules/unified-search/components/UnifiedSearchScreen.tsx, src/modules/school-search/components/SchoolResults.tsx, src/i18n/messages/*.json
contract: C-SEARCH-SCHOOLS
design: .qa/design/screens/portal--main.html:153 · .qa/design/spec/01-portal-dashboard.md#8.1 · §10 metric 9
status: TODO
depends_on: ["230"]
---

## Objective

The header sub-line states how many schools the current filter set matches, taken from the real
`meta.pagination.total`, and it updates live as filters change. The design's literal sentence
makes a claim the API cannot back; this task lands the honest form of it.

## Contract

`POST /api/search/schools` → `200 { data: SchoolHit[], meta: { pagination: { page, pageSize,
pageCount, total } } }` (`.qa/intake/api-inventory.md` §10). `total` is the count AFTER the
server applied the posted filters, which is exactly design metric #9
(`.qa/design/spec/01-portal-dashboard.md` §10: *"explicit: `visibleIdx.length` after the filter
predicate"*). Errors 400/403/429 are the existing paths and are owned by task 250.

## Design source

`.qa/design/screens/portal--main.html:153`:

```
<p style="margin:6px 0 0;font-size:14px;color:#7C8698">
  {{ filteredCount }} schools across Australia accept SchoolTest placement</p>
```

- Geometry/typography: `mt-1.5 text-body-sm` (14px step), colour `text-body`
  (`--color-body` `#475569`) — the design's `#7C8698` is 3.67:1 on white / 3.24:1 on the page
  well and fails `.claude/rules/quality.md`.
- The results-panel heading (`SearchResultsPanel` `count` prop) keeps rendering
  `SchoolSearch.resultsCount` inside its existing `aria-live="polite"` wrapper.

**The claim is not portable.** "…accept SchoolTest placement" asserts a per-school fact. No such
field exists: `schoolHitSchema` has no acceptance/placement field, `school/schema.json` has no
such attribute, and `HIT_FIELDS` (`schooltest-api/src/utils/school-search.ts:17-23`) cannot
return one. D-SCOPE-1 rule 4 ("do not invent" is absolute) forbids printing it. The sub-line
therefore reads the count and the corpus only.

New/changed keys (all six catalogs, identical shape, ICU plural):

```
"UnifiedSearch.schoolCountLine": "{count, plural, =0 {No Australian schools match} one {# Australian school} other {# Australian schools}}"
"UnifiedSearch.agentCountLine":  "{count, plural, =0 {No verified agents match} one {# verified agent} other {# verified agents}}"
```

Motion: when the count changes the sub-line re-mounts with `animate-in fade-in duration-150`
keyed on the value, `motion-reduce:animate-none`. No layout shift — the line keeps its height at
count 0.

## Files

- `src/modules/unified-search/components/UnifiedSearchScreen.tsx`
- `src/modules/unified-search/hooks/use-search-result-total.ts` (**new** — reads the already-
  cached school/agent query result for the active mode; no second request)
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json`

## Depends on

- **230** — the header band this line sits in must exist first.

## Steps

1. Add `use-search-result-total.ts`: for `mode==='schools'` it reads the SAME request object the
   pane builds (`storeToRequest` over the school store) and calls `useSchoolSearchQuery` — the
   TanStack cache dedupes it to zero extra network calls (same array query key
   `['school-search', request]`); mirrored for agents. Return
   `{ total: number | null, isPending: boolean }`.
2. Render the sub-line from that total; while pending render the previous total (or nothing at
   first load) — never `0` as a placeholder.
3. Add both keys to all six catalogs.
4. Leave `SchoolResults`/`AgentResults` `resultsCount` untouched (spec-visible surface).

## Project rules

`.claude/rules/state-data.md`: one hook per query in `queries/`; array query keys; never a raw
`useQuery` in a component — the new file is a `hooks/` composition over the existing query hook.
`.claude/rules/i18n.md`: ICU plurals for counts, six catalogs key-identical.
`.claude/rules/module-pattern.md`: hook in `hooks/`, no logic in the component.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: on `/dashboard/search` the sub-line text equals
  `cat(en,'UnifiedSearch.schoolCountLine')` formatted with the `total` read from the intercepted
  `POST /api/search/schools` response body — asserted by capturing the response and comparing,
  not by hard-coding 312.
- Applying the QLD filter changes BOTH the intercepted `total` and the rendered sub-line, and the
  two still match.
- The string "accept SchoolTest placement" appears in **zero** files under `src/` (grep).
- Exactly ONE `POST /api/search/schools` fires per settled filter change (proves the shared cache
  key, not a duplicate request).
- Six catalogs key-identical; `pnpm exec playwright test tests/e2e/unified-search.spec.ts` green.
- axe clean at 375 + 1280; reduced-motion kills the fade.

## Assumptions

Agents get the parallel line so both modes read consistently; the agents corpus is already
gated to `status='verified' AND publicProfileEnabled=true` server-side, so "verified agents" is
a true statement about what is counted.

## Evidence

_(filled in as the task runs)_
