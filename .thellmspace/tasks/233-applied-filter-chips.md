---
id: 233
title: Derive and render the applied-filter chip row with per-chip removal
layer: frontend
kind: implement
slice: The design's §8.2 `filterChips` list — one removable chip per active filter
target: src/modules/school-search/lib/school-filter-chips.ts (new), src/modules/school-search/components/SchoolFilterChips.tsx (new)
contract: C-SEARCH-SCHOOLS (the request shape the chips summarise)
design: .qa/design/screens/portal--main.html:166 · .qa/design/spec/01-portal-dashboard.md#8.2
status: TODO
depends_on: ["232"]
---

## Objective

Every active filter in the school-search store is summarised as one removable chip in the filter
bar. Clicking a chip removes exactly that filter and re-runs the search — the design's
`fc.remove` behaviour, over the app's real filter vocabulary.

## Contract

Presentation over `SchoolSearchFilters`. The removal must produce a `POST /api/search/schools`
body that no longer carries the removed key, per `storeToRequest`
(`src/modules/school-search/lib/store-to-request.ts`): absent arrays and default fee bounds are
OMITTED from the body, and the body is STRICT server-side (unknown key ⇒ 400,
`.qa/intake/api-inventory.md` §10).

## Design source

`.qa/design/screens/portal--main.html:166`:

```
background:#FFFFFF; color:#0E2350; font-size:13px; font-weight:500;
padding:9px 16px; border-radius:999px; border:1px solid #0E2350; cursor:pointer
```
Label text is `{{ fc.label }} ✕` (U+2715 appended with a space).

| Property | Design | Implementation |
|---|---|---|
| Fill / ink | `#FFFFFF` / `#0E2350` | `bg-card text-navy-900` |
| Border | `1px solid #0E2350` | `border border-navy-900` |
| Type | 13 / 500 | `text-meta font-medium` |
| Padding | `9px 16px` | `px-4 py-2.25` |
| Radius | 999px | `rounded-full` |
| Dismiss | literal `✕` (U+2715) | lucide `X` at `size-3` inside the same button — a bare glyph gives a screen reader nothing; the button's accessible name is `SchoolSearch.filterBar.removeFilter` with the chip label interpolated |

Chip vocabulary — the REAL filters, not the design's fixtures (the design's City / Programs /
Rating groups have no counterpart in `POST /api/search/schools`; see task 246):

| Store field | Chip label source |
|---|---|
| `states[]` | one chip per state, `SchoolSearch.states.<CODE>` |
| `sectors[]` | one chip per sector, `SchoolSearch.sectors.<key>` via `SECTOR_LABEL_KEYS` |
| `schoolTypes[]` | one chip per type, `SchoolSearch.schoolTypes.<value>` |
| `scholarshipAvailable`/`atarAvailable`/`elicos` | one chip each, `SchoolSearch.toggles.<key>` |
| fee range narrowed from `FEE_MIN_BOUND`/`FEE_MAX_BOUND` | one chip, existing `SchoolSearch.fee.readout` |

Motion: each chip enters with `animate-in fade-in zoom-in-95 duration-150 ease-out-expo` (the
design system's `st-pop-in` shape: opacity 0 → 1, `scale(.96)` → none) and the hover/active
states use `transition-colors duration-150`; all carry `motion-reduce:animate-none
motion-reduce:transition-none`.

375px: the row wraps; chips never truncate their label below 8 characters (`max-w-full
truncate`).

## Files

- `src/modules/school-search/lib/school-filter-chips.ts` (**new**, pure: `SchoolSearchFilters` →
  `{ id, label, remove }[]` descriptors — labels are i18n KEYS + values, never translated text,
  so the helper stays pure and testable)
- `src/modules/school-search/components/SchoolFilterChips.tsx` (**new**, renders + dispatches)
- `src/modules/school-search/index.ts`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `SchoolSearch.filterBar.removeFilter`

## Depends on

- **232** — the chips render inside the filter bar row.

## Steps

1. Write the pure descriptor builder in `lib/`. It emits, per chip, the store action to call and
   the next value (e.g. `states` minus this code) so the component holds zero logic.
2. Render the chips; each is a `<button type="button">` with
   `aria-label={t('filterBar.removeFilter', { label })}`.
3. Removing the LAST chip must return the request body to the unfiltered shape — i.e.
   `storeToRequest` emits no `states`, no `sectors`, no fee bounds.
4. Unit-test the builder with Vitest (`tests/unit/school-filter-chips.test.ts`) for the
   empty/one-of-each/fee-narrowed cases. Vitest is a supplement, **not** the proof (D-VERIFY-1).

## Project rules

`.claude/rules/module-pattern.md`: pure helpers in `lib/`, no non-hook helper functions inside
the component, ≤120 lines. `.claude/rules/i18n.md`: no hardcoded label. `.claude/rules/quality.md`:
labelled controls, keyboard reachable, visible focus ring.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: click QLD + NSW in the rail → exactly two chips render with accessible names
  containing `QLD` / `NSW`; clicking the QLD chip fires a `POST /api/search/schools` whose
  `postDataJSON().states` is `['NSW']`; clicking the last chip fires a request whose body has
  **no** `states` key at all (`expect(body).not.toHaveProperty('states')`).
- After removal the "no filters applied" hint from 232 returns.
- Chips are reachable by Tab and removable by Enter/Space.
- Six catalogs key-identical; the seven W8 regression specs green.
- axe clean at 375 + 1280; reduced-motion kills the pop-in.
- Zero raw hex / arbitrary values / `any` in the diff.

## Assumptions

The design's chip label reads `{label} ✕`; the ✕ becomes an icon plus an accessible name because
a literal U+2715 inside the button text is announced as "multiplication x" by screen readers.

## Evidence

_(filled in as the task runs)_
