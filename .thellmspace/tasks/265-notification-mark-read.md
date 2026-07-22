---
id: 265
title: Recut per-row mark-as-read to the design's dot affordance with a real optimistic write that survives reload
layer: integration
kind: implement
slice: Marking ONE notification read — affordance, optimistic state, real PUT, rollback, motion
target: src/modules/notifications/components/NotificationFeedItem.tsx, src/modules/notifications/queries/use-mark-notification-read.mutation.ts, src/modules/notifications/hooks/use-notification-actions.ts, src/i18n/messages/*.json, tests/e2e/notification-mark-read.spec.ts
contract: C-NOTIF-READ (.qa/CONTRACTS.md:192-194)
design: .qa/design/screens/portal--notifications.html L21; .qa/design/spec/03-portal-forms.md#51 (row states) + #A4 (mark-as-read transition)
status: TODO
depends_on: [010, 013, 020, 262]
---

## Objective

Today each unread row carries a full ghost `Button` labelled "Mark as read" plus a `Check` +
"Read" caption on read rows (`NotificationFeedItem.tsx:70-90`). The design's row has **no button
and no read caption** — only the 8px dot, which is the state. Make the dot the affordance: a real
`<button>` sized to a 44px target, announced correctly, writing through the existing mutation, with
the tile/dot transition of task 262 playing on success.

## Contract

`.qa/CONTRACTS.md:192-194`:

> `C-NOTIF-READ`: `PUT /api/notifications/:documentId/read` → `200 { data }`; foreign 403,
> unknown 404.

Client shape (`schemas/notification.schema.ts:45-50`): `{ data: { documentId, readAt: iso } }`.
Existing mutation `queries/use-mark-notification-read.mutation.ts` and the `onError` toast
`t('actionError')` in `hooks/use-notification-actions.ts:16-18` are preserved.

## Design source

`.qa/design/screens/portal--notifications.html` L21 — the only trailing element in a row:

```
dot : width:8px; height:8px; border-radius:999px; background:{{ n.dot }};
      flex:none; margin-top:6px
```
unread `#2563EB` (`bg-primary`) → read `transparent` (`03-portal-forms.md` §5.1 row states).

`03-portal-forms.md` §A.4 lists "notification 'mark as read' transition … the two states are fully
specified, the transition between them is not" — so the motion is authored per **D-DESIGN-3**:
`transition-[transform,opacity] duration-200 ease-out-quart` on the dot and
`transition-colors duration-200 ease-out-quart` on the 40×40 tile, both with
`motion-reduce:transition-none`.

Accessibility (`03-portal-forms.md` "ACCESSIBILITY GAPS": the export's controls are `<div onClick>`
— that is a defect to fix, never to copy):
- the dot is a real `<button type="button">` with `aria-label={t('markReadFor', { title })}`;
- its hit area is grown to 44px with the pseudo-element pattern already used in this repo
  (`toggle-row.tsx:24` documents `after:-inset-*`): `relative after:absolute after:-inset-4.5`
  — visual box stays 8×8, target becomes 44×44;
- `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` (PLAN finding 2: the
  design suppresses focus; we author it from `--ring`);
- a read row renders the same 8px box as a non-interactive `<span aria-hidden>` spacer, so the
  measure never shifts;
- the existing `sr-only` `t('unread')` marker stays on the row.

## Files

- `src/modules/notifications/components/NotificationFeedItem.tsx` — swap the Button/caption block
  for the dot button; delete the `Check` import if unused. ≤120 lines.
- `src/modules/notifications/queries/use-mark-notification-read.mutation.ts` — add an optimistic
  update: `onMutate` cancels `['notifications']`, snapshots, `setQueryData` sets that item's
  `readAt` to `new Date().toISOString()` and decrements `meta.unreadCount` (floor 0);
  `onError` restores the snapshot; `onSettled` invalidates `['notifications']`. Keep the response
  validated by `notificationReadResponseSchema`.
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Notifications.markReadFor` (`Mark "{title}" as
  read`) new in all six; keep `markRead`/`read` until the grep proves nothing selects them.
- `tests/e2e/notification-mark-read.spec.ts` — new.

## Depends on

- **262** — the dot, tile and their state pair are defined there; this task only makes the dot
  actionable.

## Steps

1. Read `tests/e2e/notification-feed.spec.ts:100-211` and record exactly how it marks a
   notification read today (selector + assertion). If it clicks a button by accessible name, that
   name must survive or the spec must be updated **in the same commit** with the same coverage.
2. Build the dot button + the read spacer.
3. Add the optimistic cache update in the mutation (`.claude/rules/state-data.md`: always
   invalidate or `setQueryData` after a successful mutation).
4. Prove rollback: force a 404 by mutating a `documentId` that does not exist and confirm the dot
   returns to unread and the `actionError` toast shows.
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 9 (never `fetch` from a client component — the typed axios
  instance in `src/lib/axios/strapi` is already used), law 11, law 14, law 15.
- `.claude/rules/state-data.md` — mutations live in `queries/`, always invalidate or
  `setQueryData`; array query keys starting with the resource name.
- `.claude/rules/quality.md` — never `<div onClick>`; ≥44px targets; visible focus; every control
  labelled.
- `.claude/rules/tailwind.md` — animate transform/opacity; exponential easing; no arbitrary values.
- `.claude/rules/i18n.md`, `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-mark-read.spec.ts` green against the running app:
  - triggers a REAL notification (create a child, as `notification-feed.spec.ts` does), finds the
    unread row, asserts `data-read="false"`;
  - clicks the dot; asserts a `PUT /api/notifications/<documentId>/read` returning **200** via
    `waitForResponse`;
  - asserts the row flips to `data-read="true"` and the header unread count decreases by exactly 1
    without a refetch (optimistic);
  - **persistence:** `page.reload()` → the row is still `data-read="true"`, and a direct
    `GET /api/notifications` in the same test shows `readAt !== null` for that `documentId`;
  - keyboard: `Tab` reaches the dot, `Enter` marks read, and the focus ring is visible
    (non-zero `box-shadow`/`outline-width`);
  - the dot button's bounding box is ≥44×44 while its visible dot is 8×8.
- `notification-feed.spec.ts` (desktop + mobile) and `notification-mutation-error.spec.ts` green.
- Motion: the tile's `transition-duration` is `200ms`; `0s` under reduced motion.
- 375px + 1280px: the dot target does not overlap the row text at 375px (assert bounding boxes do
  not intersect).
- axe zero serious/critical (this removes a visible button — confirm the row still has an
  accessible name for its action).
- Six catalogs key-identical (+1 key each).
- Zero banned-pattern grep hits: `any`, raw hex, `<div onClick`, `p-[`, `w-[`.

## Assumptions

- The API's read endpoint is idempotent enough that a double click cannot 500; if a second PUT on
  an already-read notification returns non-200, disable the button while `isPending` and record
  the API's actual behaviour rather than swallowing it.

## Evidence

<!-- filled in as the task runs -->
