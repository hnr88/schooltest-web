---
id: 270
title: Give the feed its three honest states — shimmer skeleton, empty card, and a retryable error inside the card
layer: ui
kind: implement
slice: Feed loading / empty / error states in the portal card dialect
target: src/modules/notifications/components/NotificationFeedSkeleton.tsx, src/modules/notifications/components/NotificationsScreen.tsx, src/modules/notifications/constants/notification.constants.ts, src/i18n/messages/*.json, tests/e2e/notification-feed-states.spec.ts
contract: C-NOTIF-LIST (.qa/CONTRACTS.md:190-191)
design: .qa/design/spec/03-portal-forms.md#a3-declared--keyframes-present-in-the-export-but-not-used-by-these-screens (st-shimmer); .qa/design/spec/06-auth-states-landing.md (skeletons + empty states); .qa/design/screens/portal--notifications.html L11-L37
status: TODO
depends_on: [012, 033, 049, 050, 261]
---

## Objective

The feed's three non-happy states are currently three `Skeleton` blocks, a design-system
`EmptyState` and an `Alert` — all in the old card dialect. Recut them to the portal card so the
loading state has the row's exact geometry (no layout shift on settle), and so the empty and error
states live INSIDE the one 24px card rather than replacing it.

## Contract

`.qa/CONTRACTS.md:190-191` — the three states map to the query's real states from
`useNotificationsQuery` (`retry: false`, `staleTime: 0`): `isPending`, `data.data.length === 0`,
`isError`. No new request, no client-side retry loop beyond the explicit user action.

## Design source

**Loading.** `03-portal-forms.md` §A.3 records the export's only real keyframe:

```css
@keyframes st-shimmer { 0% { background-position:-400px 0 } 100% { background-position:400px 0 } }
animation: st-shimmer 1.4s linear infinite
background: linear-gradient(90deg,#F1F5F9 25%,#E9EEF6 50%,#F1F5F9 75%); background-size:800px 100%
```
and states: "the add-child wizard, settings, notification feed and invoice list are all
async-loaded surfaces that **should reuse this exact shimmer token** for their loading states."
`04-ds-foundations.md` §I.3 requires the compliant form — animate a translated overlay
(`transform: translateX()`), never `background-position` — via W0's `--animate-shimmer`
(`shimmer 1400ms ease infinite`).

Skeleton geometry must mirror the real row (task 262): `flex items-start gap-4 py-4.25 border-b
border-portal-line` with a `size-10 rounded-xl` tile block, a `h-3.5 w-2/5 rounded-full` title
block, a `h-3 w-4/5 rounded-full` body block and a `h-2.5 w-20 rounded-full` time block. Render
**5 rows** (the design's own feed length). Wrap in `aria-hidden="true"` with a single
`role="status"` `sr-only` `t('loading')` announcement.

**Empty.** Inside the card: `py-14 text-center`; title `text-lede font-semibold text-navy-900`
(`Notifications.emptyTitle` — "You're all caught up"), body `mt-1.5 text-caption
text-portal-muted` (`emptyDescription`). Icon: 46×46 well from the design's dropzone icon well
(`03-portal-forms.md` §2.7 `width:46px;height:46px;border-radius:999px;background:#EEF1F6;`) with a
20×20 `stroke-width:1.8` lucide `Inbox` in `--color-navy-900` → `size-11.5 rounded-full
bg-portal-line grid place-items-center mx-auto mb-3`.

**Error.** Inside the card: the design has no error component at all
(`03-portal-forms.md` UNKNOWNS 1). Use the W1 `Alert` `variant="error"` — the design-system sheet
DOES specify alerts (`04-ds-foundations.md` §ALR) — with the existing `errorTitle` /
`errorDescription` and a `retry` action calling `notificationsQuery.refetch()`. Keep the exact
existing i18n keys so `notification-mutation-error.spec.ts` semantics are unchanged.

Motion: skeleton = `--animate-shimmer` with
`motion-reduce:animate-none` (a static tint, never a frozen half-gradient); empty/error mount with
`animate-in fade-in-0 duration-180 ease-out-quart motion-reduce:animate-none`.

## Files

- `src/modules/notifications/components/NotificationFeedSkeleton.tsx` — new, ≤120 lines.
- `src/modules/notifications/components/NotificationsScreen.tsx` — swap the three branches.
- `src/modules/notifications/constants/notification.constants.ts` —
  `NOTIFICATION_SKELETON_ROWS = 5`.
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Notifications.loading` new in all six; the
  empty/error keys already exist and keep their strings.
- `tests/e2e/notification-feed-states.spec.ts` — new.

## Depends on

- **261** — all three states render inside the one portal card, which 261 defines.

## Steps

1. Build the skeleton against the real row's measured geometry (screenshot both and diff the
   bounding boxes — settling must not shift the first row by more than 1px).
2. Recut empty + error inside the card.
3. Empty state must distinguish "no notifications at all" from "no notifications for this filter"
   once task 267 lands — leave the hook (`emptyVariant` prop) but do not implement the filter copy
   here.
4. Prove the error branch honestly: intercept the real request with `page.route` returning a 500
   **from the real URL** (allowed: this exercises the client's error path, not a faked success).
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 11 (`src/components/ui/*` untouched), 14, 15.
- `.claude/rules/tailwind.md` — `--animate-shimmer` from W0; animate transform/opacity only (the
  §I.3 substitute), never `background-position`; no arbitrary values.
- `.claude/rules/quality.md` — `role="status"` for the loading announcement, `aria-hidden` on the
  decorative skeleton, focus reachable retry button, ≥44px target.
- `.claude/rules/module-pattern.md`, `.claude/rules/i18n.md`, `.claude/rules/testing.md`,
  **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-feed-states.spec.ts` green against the running app:
  - **loading**: with the real request delayed via `page.route` (delay, then `route.continue()`),
    5 skeleton rows render inside the card, the skeleton's `animation-name` is non-`none`, and the
    first skeleton row's bounding box is within 1px of the first real row's after settle;
  - **reduced motion**: `emulateMedia({ reducedMotion: 'reduce' })` → skeleton `animation-name`
    is `none` and the block is still visible (a flat tint, not invisible);
  - **empty**: with the real API returning an empty list for a filter/page that genuinely has
    none, `emptyTitle` renders inside the card and the card's `border-radius` is still `24px`;
  - **error**: a routed 500 renders the `errorTitle` alert inside the card; clicking `retry`
    issues a real new `GET /api/notifications` (assert via `waitForRequest`) and, unrouted, the
    feed recovers to real rows.
- `notification-feed.spec.ts` + `notification-mutation-error.spec.ts` still green.
- 375px + 1280px: no horizontal scroll in any of the three states.
- axe zero serious/critical in all three states (run the scan in each).
- Six catalogs key-identical (+1 key each).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `w-[`, `animate-[`.

## Assumptions

- W0 emitted `--animate-shimmer` as the transform-based substitute described in
  `04-ds-foundations.md` §I.3. If W0 shipped the literal `background-position` keyframe, use it and
  raise the rule conflict in Evidence rather than authoring a second keyframe here.

## Evidence

<!-- filled in as the task runs -->
