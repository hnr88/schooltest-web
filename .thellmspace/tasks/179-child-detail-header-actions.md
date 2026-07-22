---
id: 179
title: Ship the detail header's two pill actions as Edit and Archive/Unarchive
layer: integration
kind: implement
slice: The right half of the detail header — the design's secondary + primary pill pair, bound to the two operations this child actually has.
target: src/modules/children/components/ChildProfileHeader.tsx, src/modules/children/components/ChildDetailActions.tsx (new), src/modules/children/components/ArchiveConfirmDialog.tsx
contract: C-STUDENT-UPDATE (edit route) · C-STUDENT-ARCHIVE / C-STUDENT-UNARCHIVE
design: .qa/design/screens/portal--child-detail.html (L12-13) · .qa/design/spec/02-portal-children.md §B.1
status: TODO
depends_on: ["178", "174"]
---

## Objective

Fill the design's two header buttons with the two real actions available for a child, instead of the
unbound "Share with teacher" / "Assign practice" pair (refused in task `180`).

## Contract

- Edit: navigates to the existing `/dashboard/children/{documentId}/edit` wizard, which PUTs
  `/api/students/:documentId` (`useUpdateStudentMutation`).
- Archive/Unarchive: `POST /api/students/:documentId/archive` · `/unarchive` (parent JWT, no body),
  the same mutations task `174` wires on the list. Persistence: `students.status` flips and survives a
  reload. After a successful archive from the detail page the user is returned to
  `/dashboard/children` with the `Children.archivedToast` toast; after unarchive the page stays and
  the status pill flips.

## Design source

`portal--child-detail.html`:
- Secondary (L12): `background:#FFFFFF` (`bg-card`), `color:#0E2350` (`text-navy-900`),
  13.5px / 600 (`text-body-sm font-semibold`), `padding:11px 20px`, `rounded-full`,
  `border:1px solid #D8DFEA` (`border-portal-border`); hover `border-color:#0E2350`.
- Primary (L13): `background:#0E2350` (`bg-navy-900`), white label, 13.5px / 600,
  `padding:11px 22px`, `rounded-full`, no border; hover `background:#16326E` (`bg-navy-800`).
- Both sit at the end of the `flex-wrap` identity row and drop to a second line when the column
  narrows (§B.1: "Because the row is `flex-wrap:wrap` with `min-width:200px` on the text stack").

Mapping: Edit → secondary pill; Archive (or Unarchive when `status === 'archived'`) → primary pill.

## Files

- `src/modules/children/components/ChildDetailActions.tsx` (new).
- `ChildProfileHeader.tsx` — hosts it.
- `ArchiveConfirmDialog.tsx` — reused unchanged (same keys, same confirm/cancel).

## Depends on

- `178` (the header), `174` (the mutation wiring + dialog it reuses).

## Steps

1. Edit is a `<Link>` styled as the secondary pill with the existing `Children.edit` label.
2. Archive uses the existing dialog (`Children.archiveDialogTitle` etc.); on success invalidate
   `['dashboard','students', …]`, the household key and `['children','progress',documentId]`, then
   `router.push('/dashboard/children')`.
3. Unarchive (visible only when the child is archived) stays on the page and flips the status pill.
4. Both pills are >=44px tall including the `after:` pointer inset and carry a visible focus ring.

## Project rules

- `.claude/rules/state-data.md` — invalidate after every successful mutation.
- `.claude/rules/quality.md` — dialog traps focus, Escape closes, focus returns to the trigger.
- `CLAUDE.md` §0.1 — do exactly this; no share/export/assign affordance is added.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright, live, with a throwaway parent + child: Edit opens the prefilled wizard;
  Archive → dialog → confirm → toast → redirect to `/dashboard/children` → the child is absent from
  `GET /api/my/students` and present as `archived` with the `$in` filter → reload keeps it archived →
  Unarchive from the archived list returns it to `active`.
- Motion: pill hover transitions 200ms `ease-out-quart` (background for primary, border colour for
  secondary), reduced-motion inert.
- 375px: pills go full-width on their own row under the name; both remain >=44px; no h-scroll.
- axe zero serious/critical with the dialog open; existing specs green.

## Assumptions

No new catalog keys — `Children.edit`, `archive`, `unarchive` and the dialog/toast keys all exist in
all six catalogs.

## Evidence

<!-- filled in as the task runs -->
