---
id: 174
title: Preserve archive/unarchive on the redesigned child card (menu, confirm dialog, toasts, DB proof)
layer: integration
kind: wire
slice: The card's row-actions menu — Edit / Archive / Unarchive — re-dressed onto the new card without losing a single existing behaviour.
target: src/modules/children/components/ChildrenRowActions.tsx, src/modules/children/components/ArchiveConfirmDialog.tsx, src/modules/children/components/ChildCard.tsx
contract: C-STUDENT-ARCHIVE / C-STUDENT-UNARCHIVE (POST /api/students/:documentId/archive · /unarchive)
design: .qa/design/screens/portal--my-children-list.html (card shell L13) · .qa/design/spec/02-portal-children.md §A.5
status: TODO
depends_on: ["167"]
---

## Objective

Move the existing actions cluster onto the new card, keeping every assertion in
`tests/e2e/dashboard-students.spec.ts` true: menu → `Archive` → confirm dialog → toast → the card
leaves the default list → the row is `archived` in Postgres → `Include archived` brings it back →
`Unarchive` returns it to `active`.

## Contract

`POST /api/students/:documentId/archive` and `POST /api/students/:documentId/unarchive`
(Bearer parent JWT, no body), consumed today by `useArchiveStudentMutation` /
`useUnarchiveStudentMutation` (`src/modules/children/queries/use-archive-student.mutation.ts:13,17`).
Persistence effect: `students.status` moves `active` ⇄ `archived`; `GET /api/my/students` without
`filters[status][$in]` no longer returns the row. Ownership is server-side; a foreign documentId must
never be reachable from this UI.

## Design source

The portal card slice declares no actions menu — this is an existing behaviour the redesign must
carry (`.qa/PLAN.md` "Preserve behaviour"; D-SCOPE-3). Placement: top-right of the card, inside the
28px padding, as a 36px icon button that only becomes fully opaque on hover/focus-within
(`opacity-60` → `opacity-100`), so it never competes with the identity row. Menu surface uses the
design-system `menu.tsx` wrapper (W1), radius `rounded-2xl` (16px), `--shadow-lg`.
Confirm dialog keeps `Children.archiveDialogTitle` / `archiveDialogDescription` / `archiveConfirm` /
`archiveCancel` verbatim.

## Files

- `ChildrenRowActions.tsx` — repositioned/re-dressed; keep `Children.actionsLabel` (`Actions for {name}`).
- `ArchiveConfirmDialog.tsx` — re-dressed only.
- `ChildCard.tsx` — hosts the cluster; ensure the actions button is NOT swallowed by the card link's
  `after:inset-0` overlay (`relative z-10` on the cluster).

## Depends on

- `167` — the card that hosts it.

## Steps

1. Keep the menu items' accessible names exactly: `Children.edit`, `Children.archive`,
   `Children.unarchive` (`dashboard-students.spec.ts` selects `menuitem` by those names, `exact: true`).
2. Keep the toasts `Children.archivedToast` / `Children.unarchivedToast` and the mutation's cache
   invalidation of `['dashboard','students', …]` AND the new household key, so both the card list and
   its metrics refresh after the write.
3. Verify the link overlay/menu z-order by keyboard: `Tab` order is link → actions button; `Escape`
   closes the menu and returns focus to the trigger.
4. Prove persistence with the spec's own SQL-free method: re-query `GET /api/my/students` with and
   without `filters[status][$in]` and assert the status list.

## Project rules

- `CLAUDE.md` §0.3 never break existing logic; §0.11 never edit `src/components/ui/*`.
- `.claude/rules/state-data.md` — invalidate after every successful mutation.
- `.claude/rules/quality.md` — modal traps focus and closes on Escape.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/dashboard-students.spec.ts` passes unchanged (both tests).
- Playwright, live: archive a throwaway parent's child → toast → card gone → `GET /api/my/students`
  shows `[]` for that id and `['archived']` with the `$in` filter → reload keeps it archived →
  unarchive → `['active']`.
- The household metrics on the remaining cards re-fetch after the mutation (network shows a new
  `GET /api/my/progress`).
- Motion: menu uses the design-system overlay animation (`st-pop-in` 180ms, `--ease-out-quart`),
  reduced-motion inert.
- 375px: the actions button stays inside the card and remains a 44px target; no h-scroll.
- axe zero serious/critical with the menu open and with the dialog open.

## Assumptions

No catalog change is needed — every string already exists in all six catalogs.

## Evidence

<!-- filled in as the task runs -->
