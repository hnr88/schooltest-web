---
id: 190
title: Build the "Recent results" rows from C-CHILD-RESULT-HISTORY
layer: ui
kind: build
slice: The result stream card — one row per official result with its label, date, band, readiness and a Report action.
target: src/modules/children/components/ChildRecentResults.tsx (new), src/modules/children/components/ChildResults.tsx, src/modules/children/lib/child-results.ts, src/i18n/messages/*.json
contract: C-CHILD-RESULT-HISTORY
design: .qa/design/screens/portal--child-detail.html (L58-72) · .qa/design/spec/02-portal-children.md §B.6
status: TODO
depends_on: ["177", "178"]
---

## Objective

Ship the design's Recent results card against the real, paginated official-result history, with the
row's score slot carrying CEFR band + readiness instead of the forbidden `B1 · 74%`.

## Contract

`C-CHILD-RESULT-HISTORY` — `GET /api/my/students/:documentId/results`:

- Query (all optional, strictly validated, unknown keys ⇒ `400`): `page` (int >= 1, default 1),
  `pageSize` (int 1..50, default 10; >50 ⇒ `400 ValidationError`),
  `skill` (reading|listening|speaking|writing).
- `200 { data: [ { documentId, scope: skill|combined, skill (null when combined), displayLabel,
  cefrBand, acaraPhase, readiness, lowConfidence, effortValid, status: scoring|partial_pending|complete,
  publishedAt, createdAt (ALWAYS present), previousResultDocumentId, sessionDocumentId } ],
  meta: { pagination: { page, pageSize, pageCount, total } } }`.
- Scope: `destination='official'` ONLY. Sort: `published_at_field:desc, createdAt:desc`.
- Errors: `400` bad/unknown query · `401` no JWT · `403` non-parent · `404` unknown or foreign child.

## Design source

`portal--child-detail.html` L58-72:
- Card: `bg-card rounded-3xl`, `padding:8px 30px` (the **8px** vertical padding is deliberate),
  `--shadow-portal-card`.
- Header (L59): `flex items-baseline justify-between pt-5.5 pb-1.5`; `h2` (L60) 19px / 600 /
  `-0.01em` / `#0E2350` (19px = the `@theme` step whose value is 1.1875rem); link (L61) 13.5px / 500 /
  `#7C8698`, hover `#2563EB`.
- ResultRow (L64): `flex items-center gap-5 py-4.25 border-b border-portal-rule` — the border is on
  **every** row including the last, and a trailing spacer `pt-2 pb-3.5` sits below it.
  - Left stack (L65): name 14.5px / 600 / `#0E2350` (`text-lede font-semibold text-navy-900`);
    date 13px / `#7C8698` / `mt-0.5` (`text-caption text-portal-muted`).
  - Score (L66): 14px / 700 / `#0E2350`, `flex-none` — **`B1 · 74%` is BLOCKED (B-3)**; this slot
    renders `{cefrBand} · {readiness}` from the row, or `Children.notBanded` when `cefrBand` is null.
  - Delta (L67): 12px / 600 / `w-22.5` (90px) / `text-right`, colour `#2563EB` normally and
    `#9AA6B8` (`text-portal-muted-2`) for "first attempt" — the design's own neutral rule. The design's
    `+6% vs May` is a percentage delta and is refused; this slot renders the band change against
    `previousResultDocumentId` (`Children.deltaBandUp` / `deltaBandSame` / `deltaBandDown`) or
    `Children.deltaFirstAttempt` when `previousResultDocumentId` is null.
  - Action (L68): 13px / 600 / `text-primary` — `Report`, wired in task `192`.

## Files

- `src/modules/children/components/ChildRecentResults.tsx` (new).
- `ChildResults.tsx` — superseded markup; keep `data-slot="child-results-timeline"`
  (`children-profile.spec.ts:69` asserts it) and `Children.recentResultsHeading` as the `h2`
  (asserted at `children-profile.spec.ts:123`) and `Children.emptyResults` for the zero case
  (asserted at `:126`).
- `child-results.ts` — row view-model mapping; no fetching.
- Catalogs: `Children.resultRowLabel`, `Children.deltaFirstAttempt`, `Children.deltaBandUp`,
  `Children.deltaBandSame`, `Children.deltaBandDown`, `Children.allReports`.

## Depends on

- `177` (the history query is in the view model), `178` (header above).

## Steps

1. Row name = `displayLabel` when present, else `Children.resultSkills.{skill}` for a skill-scoped
   result, else `Children.untitledResult` (already in all six catalogs). `scope: 'combined'` rows read
   `Children.resultCombined`.
2. Date = `publishedAt` when set, else `createdAt` (the contract guarantees `createdAt`), formatted
   with `useFormatter().dateTime(..., { dateStyle: 'medium' })` so it localises per catalog.
3. Rows with `status !== 'complete'` show the existing `Children.resultStatus.{scoring|partial_pending}`
   pill instead of a band, so a still-scoring result never looks final.
4. Band delta: compare this row's `cefrBand` with the band of the row whose `documentId` equals
   `previousResultDocumentId` when it is present in the loaded pages; when it is not loaded, render
   `Children.deltaBandSame`'s neutral variant rather than fetching a second page just for an arrow.
5. Empty: zero rows → `Children.emptyResults` centred in the card (keep the exact key).

## Project rules

- `.claude/rules/i18n.md` — dates through `useFormatter`, never `toLocaleDateString` with a literal.
- `.claude/rules/tailwind.md` — tokens, no arbitrary values.
- `.qa/intake/docs-constraints.md` §3c — no percentage; §2 — controlled vocabulary only.
- `CLAUDE.md` §0.3 — the three existing `data-slot`/key assertions stay true.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `GET /api/my/students/{id}/results` returns `200`; the rendered row count equals
  `Math.min(meta.pagination.total, pageSize)` and each row's label/date/band/readiness matches its
  entry in the parsed body; a child with no official results shows `Children.emptyResults`.
- `await expect(resultsCard).not.toContainText('%')` passes.
- Motion: rows enter with `st-fade-in` 180ms `--ease-out-quart` staggered 40ms;
  the "All reports" link colour transitions 200ms; reduced-motion inert.
- 375px: the delta column drops below the name/date stack (not clipped) and the row stays >=44px tall;
  no h-scroll. 1280px: matches the slice's four-column row.
- axe zero serious/critical; six catalogs key-identical; `children-profile.spec.ts` green.

## Assumptions

The seeded children may have zero official results; the empty branch is then the asserted path.

## Evidence

<!-- filled in as the task runs -->
