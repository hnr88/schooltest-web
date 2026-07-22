---
id: 177
title: Recompose the child detail route as the design's single vertical stack and join its three reads
layer: integration
kind: wire
slice: The child detail screen's skeleton of blocks and the one view model behind them — student detail + per-child progress + household child entry + paginated result history.
target: src/modules/children/components/ChildProfileScreen.tsx, src/modules/children/components/ChildProfileTabs.tsx (removed), src/modules/children/lib/child-detail-view-model.ts (new), src/modules/children/types/children.types.ts, tests/e2e/children-profile.spec.ts
contract: C-PARENT-CHILD-PROGRESS · C-DASH-HOUSEHOLD · C-CHILD-RESULT-HISTORY · C-UI-CHILD-LEARNING-SURFACE
design: .qa/design/screens/portal--child-detail.html · .qa/design/spec/02-portal-children.md §B (opening note: "There are NO tabs on this screen")
status: TODO
depends_on: ["090", "110"]
---

## Objective

Turn `/dashboard/children/[documentId]` into the design's five-block vertical stack — header, KPI
strip, two-up (Level journey | Skills), Recent results, Record — fed by one view model, and retire
the tab control the design does not have while keeping the record content reachable.

## Contract

- `C-PARENT-CHILD-PROGRESS` — `GET /api/my/students/:documentId/progress`, parent JWT, unknown AND
  foreign both `404`. `200 { data: { student, metrics, recentResults }, meta }`, where `metrics` is
  `{ totalSessions, completedSessions, activeSessions, officialResults }` (non-negative integers) and
  `student` is the parent-safe projection (no passport, guardian relation ids, teacher or class).
  Already consumed by `useChildProgressQuery` — keep it.
- `C-DASH-HOUSEHOLD` — `GET /api/my/progress` supplies this child's `cefrBand`, `cefrStageIndex`,
  `acaraPhase`, `practiceDayStreak`, `testsCompleted`, `focusSkill`, `skills[]`. No query parameters
  are accepted (any key ⇒ `400`).
- `C-CHILD-RESULT-HISTORY` — `GET /api/my/students/:documentId/results?page=&pageSize=&skill=`,
  `pageSize` 1..50 (default 10, >50 ⇒ `400`), sorted `published_at_field:desc, createdAt:desc`,
  `destination='official'` only, `200 { data: [...], meta: { pagination } }`.
- `C-UI-CHILD-LEARNING-SURFACE` — "the individual route is a distinct learning-progress surface …
  When no metrics or results exist, the UI states that honestly rather than synthesizing a score,
  chart, or recommendation." Foreign/not-found protection is inherited unchanged.

## Design source

`portal--child-detail.html` L3: page container `flex flex-col gap-6` with `pt-2 pr-1 pb-2 pl-2`.
§B: "**There are NO tabs on this screen.** The content is a single vertical stack of five blocks."
Block order and their tasks: DetailHeader (`178`/`179`), KpiStrip (`181`/`182`),
TwoUpCardGrid `repeat(auto-fit,minmax(380px,1fr)) gap:20px` holding LevelJourney (`183`) and
SkillsCard (`185`), RecentResults (`190`/`191`). The existing Record panel (enrolment + guardian,
real `student` fields) has no slot in the design and becomes the stack's closing card in the same
portal chrome (`rounded-3xl`, `p-7`, `--shadow-portal-card`).

## Files

- `ChildProfileScreen.tsx` — the stack; keep `data-surface="child-learning-dashboard"`.
- `ChildProfileTabs.tsx` — deleted; `ChildRecordPanel.tsx` keeps `data-slot="child-record-panel"`
  and its `Children.enrolmentHeading` / `Children.guardianHeading` headings.
- `src/modules/children/lib/child-detail-view-model.ts` (new) — merges the three responses into one
  typed object; the household child entry is looked up by `documentId` and may legitimately be absent.
- `tests/e2e/children-profile.spec.ts` — the tab assertions are retargeted at the stack (documented
  retarget, same guarantee: the enrolment and guardian content is present and comes from the API).

## Depends on

- All of **W3** for the two new typed query hooks (edge: `090`) and all of **W4** for the shell the
  route renders inside (edge: `110`).

## Steps

1. Add the household + result-history hooks alongside the two existing queries; fire them in parallel
   (TanStack Query does this by default) — never sequentially, never one request per skill.
2. Build `child-detail-view-model.ts` returning `{ student, metrics, householdChild | null,
   results, pagination }` with explicit nulls; no default band, no zero-filled skill list.
3. Replace the tab shell with the stack. Keep `data-slot="child-progress-panel"` on the progress
   region so the existing spec's region assertion still resolves.
4. Retarget the two tab assertions in `children-profile.spec.ts` to assert the record card is present
   in the stack with both headings — record the retarget and its justification in Evidence
   (design §B outranks the current UI per D-SCOPE-1.1; the behaviour, not the chrome, is preserved).
5. Keep the 404 path exactly: `[data-slot="query-error-fallback"][data-query-error="gone"]` with
   `Children.profileGoneTitle` and the `Children.backToList` link (task `193` owns its dressing).

## Project rules

- `.claude/rules/module-pattern.md` — the merge lives in `lib/`, the screen stays presentational,
  120-line component cap (split blocks into their own files, which the sibling tasks do).
- `.claude/rules/nextjs-patterns.md` — `params` is async in Next 16; `'use client'` only where state lives.
- `.claude/rules/state-data.md` — array query keys; no client `fetch`.
- `CLAUDE.md` §0.3 — never break existing logic.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: opening a seeded child fires exactly one request each to `/progress`, `/my/progress`
  and `/results`, all `200`; the page renders five blocks in the design's order.
- The record card shows `Children.enrolmentHeading` and `Children.guardianHeading` with values from
  the live `student` projection; no tab control exists in the accessibility tree
  (`getByRole('tab')` → count 0).
- A foreign child still yields `404` and the gone-state fallback (the existing third test in
  `children-profile.spec.ts` passes unchanged).
- Motion: the stack enters with `st-fade-in` 180ms `--ease-out-quart`, staggered per block by 40ms,
  `motion-reduce:animate-none`.
- 375px: single column, no h-scroll; 1280px: the two-up grid is side by side.
- axe zero serious/critical; `children-profile.spec.ts` green after the documented retarget.

## Assumptions

W3 exposes `useChildResultHistoryQuery` and `useHouseholdProgressQuery`; if named differently, import
W3's actual exports rather than adding a parallel hook.

## Evidence

<!-- filled in as the task runs -->
