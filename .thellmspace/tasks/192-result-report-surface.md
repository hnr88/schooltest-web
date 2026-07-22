---
id: 192
title: Open a full official-result report from a result row (C-PARENT-RESULT-VIEW)
layer: integration
kind: build
slice: The "Report" action — a real result view with its label, band, phase, readiness, per-attribute mastery map and caveats.
target: src/modules/children/components/ChildResultReport.tsx (new), src/modules/children/components/ChildRecentResults.tsx, src/i18n/messages/*.json
contract: C-PARENT-RESULT-VIEW
design: .qa/design/screens/app--result-detail.html · .qa/design/spec/02-portal-children.md §D (blocked parts recorded in task 189)
status: TODO
depends_on: ["190", "186"]
---

## Objective

Give the design's unbound `Report` action a real destination: the official result itself, rendered
with the fields the parent branch of `C-PARENT-RESULT-VIEW` actually returns — and none of §D's
subject/donut/cohort furniture.

## Contract

`C-PARENT-RESULT-VIEW` — `GET /api/results/:documentId` (route already exists; new grant
`result.getResult` → `parent`).

- Ownership: `student.parent.documentId` must equal the caller AND `destination` must be `official`;
  anything else ⇒ `404 NotFoundError` (never `403`).
- `200` with the existing `ResultView` shape; consumed fields: `scope`, `skill`, `attributes`
  (`{status, prob, prob_se?, items, delta}`), `display_label`, `acara_phase`, `cefr_band`, `readiness`,
  `low_confidence`, `effort_valid`, `supplementary`, `productive_scores`, `status`, `published_at`.
- `401` no/invalid JWT · `403` role not permitted · `404` unknown id, foreign child, or transient.
- Persistence effect: none.
- Security note (verbatim): "this widens who can read a result row. The verify task for it MUST prove,
  with real requests: parent reads own child's official result → 200; parent reads ANOTHER parent's
  child's result → 404; parent reads own child's transient result → 404; no JWT → 401."

## Design source

From §D, only the parts with data behind them are ported into the PORTAL chrome (24px radii, navy
primary — §D's App chrome is a different grey ramp and must not be merged, per the spec's opening note):
- Hero block: `bg-navy-900 rounded-3xl p-6.5`, eyebrow 12.5px/700/`tracking-overline`/`text-navy-body`
  (`#8FA3C7`) carrying `{SKILL} · {ACARA PHASE} · {DATE}`; `h1` 26px/700 white = `display_label`
  (or the skill name when null); student line 14px `text-navy-body` with the 28px initials avatar.
- Instead of §D.2's donut/`Correct`/`Top 12%`/`Grade A` tiles (all BLOCKED, task `189`), the hero
  carries three honest tiles in the same geometry (`bg-white/7 rounded-2xl px-5.5 py-4`, value
  24px/700, label 12px `text-navy-body`): **CEFR band**, **Readiness**, **Evidence items**
  (the sum of `attributes[].items`).
- Body: the per-attribute mastery list from task `186` (reused component), then the caveat block from
  task `187`. `productive_scores` renders for speaking/writing as its own named sub-values only if the
  contract's field is populated — never invented.

## Files

- `src/modules/children/components/ChildResultReport.tsx` (new) — rendered as a design-system `Sheet`
  on <=768px and an inline expanded panel on desktop, so no new route is invented.
- `ChildRecentResults.tsx` — the `Report` action becomes a real `<button aria-expanded>` /
  sheet trigger.
- Catalogs: `Children.reportHeading`, `Children.reportEyebrow`, `Children.reportEvidenceTotal`,
  `Children.reportClose`, `Children.resultUnavailable`.

## Depends on

- `190` (the rows that trigger it), `186` (the attribute list it reuses).

## Steps

1. Trigger loads the W3 `C-PARENT-RESULT-VIEW` hook by `documentId` on open only.
2. Render the hero + attribute map + caveats. No donut, no letter grade, no class average, no topic
   percentages, no recommendation rows (task `189`).
3. `low_confidence` / `effort_valid` caveats always render when the flags say so
   (`docs/SCHOOLTEST_DOC1_DATA_CONTRACT_V2.md:356` — "the caveat block is always present").
4. Error paths: `404` → `Children.resultUnavailable` inside the panel with a close action; `403` →
   the same message; `401` → the axios interceptor's existing session handling.
5. Focus management: opening moves focus into the panel, `Escape` closes and returns focus to the
   `Report` trigger.

## Project rules

- `.claude/rules/quality.md` — modal traps focus, closes on Escape, labelled by its heading.
- `.claude/rules/state-data.md` — the query is a W3 hook in `queries/`, never inline.
- `.qa/intake/docs-constraints.md` §3a/§3i — probability is not printed as a percentage.
- `CLAUDE.md` §0.11 — wrap the shadcn `Sheet`, never edit `src/components/ui/*`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright, live, all four security paths proven with real requests in the same spec:
  own official result → `200` and the panel renders its real `display_label`/`cefr_band`/`readiness`;
  another parent's child's result id → `404`; a transient result id → `404`; no JWT → `401`.
- Every rendered value is traceable to the parsed response body; no `%`, no letter grade, no cohort.
- Motion: panel enters with `st-pop-in` (desktop) / the sheet's slide (mobile) at 180-250ms
  `--ease-out-quart`; reduced-motion inert.
- 375px: full-height sheet, body scrolls internally, page does not h-scroll. 1280px: inline panel.
- axe zero serious/critical with the panel open; six catalogs key-identical.

## Assumptions

The parent grant for `result.getResult` lands in W2; if it is not yet granted the task is BLOCKED on
that dependency rather than falling back to a fabricated view.

## Evidence

<!-- filled in as the task runs -->
