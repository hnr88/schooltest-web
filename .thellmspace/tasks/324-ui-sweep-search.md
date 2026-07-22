---
id: 324
title: UI sweep unified search — schools, agents, map, filter rail and sort at 375 and 1280
layer: ui
kind: verify
slice: `/[locale]/dashboard/search` (both modes) plus the two 308 redirects
target: src/modules/unified-search/**, src/modules/school-search/**, src/modules/agent-search/**, src/modules/search-shared/**, new spec tests/e2e/sweep-search.spec.ts
contract: n/a for presentation; reads `POST /api/search/schools`, `POST /api/search/agents`, `GET|PUT /api/search-preferences/me`
design: .qa/design/screens/portal--main.html (Find a school view), .qa/design/spec/01-portal-dashboard.md#find-a-school, .qa/design/spec/05-ds-components.md#navigation
status: TODO
depends_on: ["320"]
---

## Objective

Sweep every interactive control on the unified search surface at 375px and 1280px — search
field, mode tabs, every filter control in both rails, both sort menus, pagination, the map
(clusters, pins, zoom, Map/List toggle, mobile sheet) and the saved-preferences write — proving
each fires the contracted request, renders the real response, and fails honestly.

## Contract

Quoted from `.qa/intake/api-inventory.md`:

**`POST /api/search/schools` (#10)** — STRICT Zod body, **any unknown key ⇒ 400**:
`q?` 1..200 (trimmed), `states?` `QLD,NSW,VIC,SA,WA,TAS,NT,ACT` (1..8),
`schoolTypes?` `combined|primary|secondary` (1..3), `sectors?`
`government|non-government|catholic` (1..3), `levels?`
`primary|junior_secondary|senior_secondary` (1..3), `atarAvailable?`,
`englishLanguageSupport?`, `scholarshipAvailable?` booleans, `feeMin?`/`feeMax?` int 0..1000000
(`feeMin ≤ feeMax`), `sortBy?` `relevance|name-asc|name-desc|fee-asc|fee-desc` (default
`relevance`), `page?` 1..10000 (default 1), `pageSize?` 1..50 (default **12**).
Success **200** BARE `{ data: SchoolHit[], meta: { pagination: {page,pageSize,pageCount,total} } }`.
Errors: `400 ValidationError "invalid search payload"` + `details.fields/issues`;
`403 "Only parents and admins can search schools"`; `500 ApplicationError "school search response
failed contract validation"`; `429`. **No ownership rule** — schools are shared reference data.

**`POST /api/search/agents` (#11)** — STRICT body: `q?` 1..200, `countriesServed?` ≤20,
`languages?` ≤20, `services?` (8-value enum) 1..8, `sortBy?`
`relevance|experience|name_asc|name_desc|recently_verified`, `page?`, `pageSize?` ≤50
(default 12). Unconditional data gate: `status = 'verified' AND publicProfileEnabled = true`.
Success **200** BARE `{ data: AgentHit[], meta: { pagination } }`. Agent `email` is
`private: true` and never read.

**`GET|PUT /api/search-preferences/me` (#12/#13)** — parent only; target is always
`ctx.state.user`; PUT body is a STRICT partial (unknown key ⇒ 400) over
`default_states`, `default_school_types`, `default_sectors`, `default_sort`,
`default_page_size` (1..50), `default_fee_min`/`default_fee_max` (0..1000000|null,
min ≤ max). Success **200** BARE `{ data: SearchPreferenceView }` — **no `meta` member**.
**DB effect:** INSERT/UPDATE exactly one `search_preferences` row per user.

**Routing behaviour preserved:** `/dashboard/search/schools` and `/dashboard/search/agents` are
`permanentRedirect` → `308` to `/dashboard/search?mode=…`
(`.qa/intake/web-inventory.md` §1).

## Design source

`.qa/design/screens/portal--main.html` "Find a school" view + `.qa/design/spec/01-portal-dashboard.md`:

- Search pill: `background:#FFFFFF` → `--color-card`; the design sets `outline:none` on the
  input — **not ported** (`.qa/PLAN.md` finding 2). The focus ring is authored from
  `--color-ring: oklch(0.5461 0.2152 262.88 / 0.35)` as
  `outline: 2px solid var(--color-ring); outline-offset: 2px`.
- Search input (`05-ds-components.md:440`): `padding:9px 13px 9px 36px; border-radius:10px;
  border:1px solid #CBD5E1` → `--color-input`; `font-size:13.5px`;
  `transition: border-color .15s, box-shadow .15s`.
- Filter chip, unselected: border `#D8DFEA` → `--color-input`, text `#3D4A5C` → `--color-body`;
  selected: `background #0E2350` → `--color-navy-900`, text `--color-primary-foreground`.
- Map cluster bubble `#2563EB` → `--color-primary`; the cluster count (metric #11) shows only at
  zoom `< 9`.
- Result count line (metric #9): `{n} schools across Australia accept SchoolTest placement` and
  `Show {n} schools` — `n` is the **real** `meta.pagination.total`, never a literal.
- School rating (metric #10, `01-portal-dashboard.md#10`) is an **explicit static field
  `rating` in the design export**. `SchoolHit` in `.qa/intake/api-inventory.md` §10 has **no
  rating field** — so no rating is rendered. Recorded as a design↔data conflict here; nothing
  is invented.
- Motion: the design's map fly/pan is a Leaflet `flyTo` (≤ 400ms is the map's own easing, kept
  as-is); all UI chrome transitions are 150ms `--ease-out-quart`; the mobile filter Sheet uses
  `st-fade-in` (scrim 180ms) + a translateY panel slide (180ms). The existing
  `@media (prefers-reduced-motion: reduce)` block in `src/app/globals.css` (~L521-651) that kills
  the Leaflet transitions is **preserved**, and the new chrome transitions join it.

## Files

- `tests/e2e/sweep-search.spec.ts` (new)
- Fix-in-place authority: `src/modules/unified-search/**`, `src/modules/school-search/**`,
  `src/modules/agent-search/**`, `src/modules/search-shared/**`,
  `src/app/[locale]/dashboard/search/**`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` if a string is missing
- Never `src/components/ui/**`

## Depends on

- **320** — the shell wraps this route.
- Wave gate (prose): **all of W8 (Search, ids 230-253)** must be DONE.

## Steps

1. Log in with `loginAsParent`; open `/dashboard/search` at 1280×800. Capture the first
   `POST /api/search/schools`; assert `200` and that the rendered result count equals
   `meta.pagination.total` and the rendered card count equals `data.length`.
2. Search field: type a query, assert exactly **one** settled request after the debounce
   (count `POST /api/search/schools` calls), assert the sent body's `q` is the trimmed input,
   and assert every rendered card comes from the new `data`. Assert clearing restores the
   default corpus.
3. Filter rail — for **every** control in `SchoolFilterRail` (states, school types, sectors,
   levels, the three booleans, the fee range): toggle it, assert the next request body carries
   exactly the contracted key/values (e.g. `states: ['NSW']`), assert the result set changes,
   and assert the active-filter count from `countActiveSchoolFilters` matches.
4. Sort: for each of the five `sortBy` values assert the request body carries it and the
   rendered order matches the returned `data` order.
5. Pagination: click page 2, assert `page: 2` in the body and that the rendered
   `documentId`s differ from page 1; assert the pager reflects `meta.pagination.pageCount`.
6. Map: assert clusters render at zoom 5 and de-cluster on zoom-in; card↔pin hover sync;
   Map/List toggle; zoom controls; at 375px the map opens in a Sheet. Assert the SSR path does
   not crash (no `window` at module scope — `CLAUDE.md` §5 pitfall 14).
7. Agents mode: switch via `SearchModeTabs`, assert `?mode=agents` is written to the URL and
   survives a reload, capture `POST /api/search/agents` → `200`, and repeat 2-5 for the agent
   controls (`countriesServed`, `languages`, `services`, its five `sortBy` values).
   Assert **no** agent email is rendered anywhere (it is `private: true` server-side).
8. **Write proof (saved preferences):** in `/dashboard/settings?tab=search`, change
   `default_states` and `default_page_size`, save, assert `PUT /api/search-preferences/me` →
   `200`, reload, assert the values persist, and read the row directly with `runSql`:
   `select default_states, default_page_size from search_preferences where …` — the values must
   match. Restore the original values at the end.
9. Live contract negatives via `request.post` with the real parent JWT: an unknown body key →
   `400 "invalid search payload"`; `pageSize: 51` → `400`; `feeMin > feeMax` → `400`;
   no `Authorization` header → `401`.
10. Error path in the UI: intercept `POST /api/search/schools` with `{ status: 500 }` and assert
    the translated `Alert` + working retry (the existing behaviour asserted by
    `tests/e2e/unified-search-states.spec.ts` — do not break it); assert `watchErrors(page)`
    stays empty.
11. Redirects: `GET /dashboard/search/schools` and `/dashboard/search/agents` both return
    **308** to `/dashboard/search?mode=…` (preserve the existing assertions).
12. Repeat 1-7 at **375×812**: the rail collapses to the `Filters` trigger + Sheet, no
    horizontal scroll, every control ≥44×44, Sheet traps focus and closes on `Escape`.
13. Motion: measure chip/card/tab transitions (150-200ms) and re-measure under
    `reducedMotion: 'reduce'` (`<= 0.02s`); assert the Leaflet reduced-motion block still
    suppresses the pan/zoom animation.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 8, 9, 11, 12, 14; §5 pitfall 14 (`window` at
  module top level), pitfall 17 (raw `useQuery` in components).
- `.claude/rules/state-data.md` — Zustand stores use selectors; one hook per query in
  `queries/`; array query keys start with the resource name.
- `.claude/rules/module-pattern.md` — cross-module imports through the barrel only
  (`search-shared` is consumed by both search modules through its `index.ts`).
- `.claude/rules/tailwind.md`, `.claude/rules/quality.md`, `.claude/rules/i18n.md`,
  `.claude/rules/testing.md`, D-VERIFY-1.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/sweep-search.spec.ts` passes at 375×812 and 1280×800.
- **Every** filter, sort, page and mode control asserted to (a) send the exact contracted key in
  the real request body and (b) change the rendered set to match the real response body.
- Debounce proven: one settled request per query, not N.
- Saved-preferences write proven: `PUT` 200 → reload → still set → direct
  `search_preferences` SQL read matches; originals restored.
- Live negatives proven: unknown key → 400, `pageSize: 51` → 400, `feeMin > feeMax` → 400,
  no JWT → 401.
- 308 redirects still assert; `tests/e2e/unified-search*.spec.ts`, `school-map.spec.ts`,
  `school-filter-panel.spec.ts`, `school-search-presentation.spec.ts` and
  `agent-search-polish.spec.ts` all still pass unchanged in the same run.
- Zero agent email rendered; zero school `rating` invented.
- No horizontal scroll at 375; every control ≥44×44; Sheet traps focus, `Escape` closes.
- Motion 150-200ms measured; `<= 0.02s` under `reducedMotion: 'reduce'`; the Leaflet
  reduced-motion suppression still holds.
- All six locale catalogs key-identical if any string changed.
- Zero banned-pattern grep hits; no hardcoded results array standing in for a search response.

## Assumptions

- The schools and agents corpora already contain real rows (root `.qa` D30 recorded verified
  live school cover-media provenance), so a non-empty result set is reachable without seeding.

## Evidence

<!-- filled in as the task runs -->
