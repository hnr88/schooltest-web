---
id: 266
title: Build the header "Mark all as read" text action with its real bulk write and honest disabled state
layer: integration
kind: implement
slice: Mark-all-as-read — the blue text button on the header baseline, the real POST, and the unread counter it clears
target: src/modules/notifications/components/NotificationsScreen.tsx, src/modules/notifications/components/NotificationFeedHeader.tsx, src/modules/notifications/queries/use-mark-all-notifications-read.mutation.ts, src/i18n/messages/*.json, tests/e2e/notification-mark-all-read.spec.ts
contract: C-NOTIF-READ-ALL (.qa/CONTRACTS.md:193-194)
design: .qa/design/screens/portal--notifications.html L4-L10; .qa/design/spec/03-portal-forms.md#51 (header)
status: TODO
depends_on: [010, 020, 034, 261, 265]
---

## Objective

The mark-all control is currently an outline `Button` with a `CheckCheck` icon sitting in a pill
group (`NotificationsScreen.tsx:44-56`). The design puts a **borderless blue text button on the
header baseline**, opposite the title. Build it, wire it to the existing bulk mutation, and make
the `N unread` subtitle the single source of truth for its enabled state.

## Contract

`.qa/CONTRACTS.md:193-194`:

> `C-NOTIF-READ-ALL`: `POST /api/notifications/read-all` → `200 { data: { updated } }`.

Client shape (`schemas/notification.schema.ts:52-54`): `{ data: { updated: int 0..100 } }`.
`useMarkAllNotificationsReadMutation` and the `t('actionError')` toast are preserved.

## Design source

`.qa/design/screens/portal--notifications.html` L4-L10:

```
header : display:flex; align-items:flex-end; justify-content:space-between; gap:16px
h1     : 30px / 500 / -0.02em / #0E2350                       -> "Notifications"
p      : margin:6px 0 0; 14px / #7C8698                        -> "2 unread"
button : background:transparent; color:#2563EB; font-size:13.5px; font-weight:600;
         border:none; cursor:pointer; padding:8px 4px          -> "Mark all as read"
```

Build with: `text-body-sm font-semibold text-primary bg-transparent border-0 px-1 py-2` plus a
44px target (`relative after:absolute after:-inset-y-3 after:-inset-x-2` — the pattern documented
in `toggle-row.tsx:24`), `hover:text-primary-hover` (the design's global `a:hover` rule,
`03-portal-forms.md` §A.2 last row: `#0E2350` → `#2563EB`; for an already-blue control the hover
target is `#1D4ED8` `--color-primary-hover`), and
`transition-colors duration-150 ease-out-quart motion-reduce:transition-none` (§A.2: "Each one
declares the target state but no transition duration … Add a shared `transition: <prop> .15s ease`
when building").

Disabled state: the design has none (`04-ds-foundations.md` `UNKNOWNS 4`). Author it as
`disabled:text-portal-faint disabled:cursor-not-allowed disabled:after:hidden` and keep the control
**rendered** when `unreadCount === 0` — it must never disappear, matching the repo's existing
"never a silently absent control" convention in `PushSubscriptionControl.tsx`.

Loading: while `isMarkingAll`, the label swaps to `t('markAllReadPending')` and the button is
`aria-busy="true"` and disabled. No spinner — the design has no spinner on a text button.

## Files

- `src/modules/notifications/components/NotificationFeedHeader.tsx` — new (title + subtitle +
  action), so `NotificationsScreen.tsx` stays ≤120 lines.
- `src/modules/notifications/components/NotificationsScreen.tsx` — mount the header, drop the pill
  group and the `Bell`/`CheckCheck` imports.
- `src/modules/notifications/queries/use-mark-all-notifications-read.mutation.ts` — on success,
  `setQueryData` on `['notifications']` to zero `meta.unreadCount` and stamp `readAt` on every
  cached item, then invalidate. On error, restore + toast (existing behaviour).
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Notifications.markAllReadPending` new in all six;
  `markAllRead` already exists and keeps its exact string ("Mark all as read" — the design's
  literal).
- `tests/e2e/notification-mark-all-read.spec.ts` — new.

## Depends on

- **261** — the header row box and the unread subtitle.
- **265** — the per-row optimistic cache shape; mark-all reuses the same cache mutation helpers.

## Steps

1. Grep the existing specs for `markAllRead` / `markAllReadShort` selectors
   (`NotificationBell.tsx:78` uses the short one — leave the bell alone, task 271 owns it).
2. Build the header component; the action is a real `<button type="button">`.
3. Wire the mutation cache update; ensure the subtitle's plural key re-renders to
   `No unread notifications` immediately.
4. Prove the disabled path: with 0 unread the button is present, disabled and announced.
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 9, 11, 14, 15.
- `.claude/rules/state-data.md` — mutation in `queries/`, cache updated after success.
- `.claude/rules/quality.md` — ≥44px target, visible focus, `aria-busy` while pending, never a
  `<div onClick>`.
- `.claude/rules/tailwind.md` — colour transition is the documented §I.1 exception; 150ms;
  exponential easing; no arbitrary values.
- `.claude/rules/i18n.md`, `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-mark-all-read.spec.ts` green against the running app:
  - creates at least one REAL unread notification (domain event, as `notification-feed.spec.ts`),
    asserts the subtitle shows a non-zero count and the action is enabled;
  - clicks it; asserts `POST /api/notifications/read-all` returns **200** and the response body
    parses to `{ data: { updated: >= 1 } }`;
  - the subtitle becomes `t('unreadCount', { count: 0 })` and every visible row is
    `data-read="true"` without a manual refetch;
  - **persistence:** `page.reload()` → still 0 unread; and a direct `GET /api/notifications`
    in the same test returns `meta.unreadCount === 0`;
  - with 0 unread the button is still in the DOM, `disabled`, and reachable by
    `getByRole('button', { name })` (assert `toBeDisabled()`, not `toBeHidden()`);
  - computed style: `font-size` `13.5px`, `font-weight` `600`, `border-width` `0px`, colour equals
    the resolved `--color-primary`; bounding box ≥44px tall.
- `notification-feed.spec.ts`, `notification-mutation-error.spec.ts` still green.
- Motion: `transition-duration` `150ms` on the label colour; `0s` under reduced motion.
- 375px + 1280px: at 375px the action wraps under the title block without horizontal scroll.
- axe zero serious/critical.
- Six catalogs key-identical (+1 each).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `<div onClick`.

## Assumptions

- `read-all` caps at 100 rows per call (`notificationReadAllResponseSchema` max 100). If a parent
  has >100 unread, one click cannot clear them all — assert the returned `updated` and re-enable
  the button when `meta.unreadCount` is still > 0 after invalidation. Do not fake a zero.

## Evidence

<!-- filled in as the task runs -->
