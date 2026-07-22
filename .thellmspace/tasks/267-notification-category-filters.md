---
id: 267
title: Add the category + unread filter chips over the real ?category= and ?read= query parameters
layer: integration
kind: implement
slice: Filtering the feed — pill chip row, URL-synced state, real server-side filtering, empty-per-filter state
target: src/modules/notifications/components/NotificationFeedFilters.tsx, src/modules/notifications/hooks/use-notification-feed-filters.ts, src/modules/notifications/constants/notification.constants.ts, src/modules/notifications/components/NotificationsScreen.tsx, src/i18n/messages/*.json, tests/e2e/notification-filters.spec.ts
contract: C-NOTIF-LIST (.qa/CONTRACTS.md:190-191)
design: .qa/design/screens/portal--settings.html L19-L23 (Pill chip primitive); .qa/design/spec/03-portal-forms.md#14-shared-portal-primitives (PortalChip Pill) + #51 (feed)
status: TODO
depends_on: [013, 032, 261, 264]
---

## Objective

`GET /api/notifications` already accepts `read` and `category`, and the client schema already
validates them (`schemas/notification.schema.ts:26-31`), but **no UI reaches them** — the feed
always requests page/pageSize only. Expose them as a chip row above the feed card, synced to the
URL so a filtered feed is linkable and survives reload.

## Contract

`.qa/CONTRACTS.md:190-191`:

> `C-NOTIF-LIST`: `GET /api/notifications?page=&pageSize=&read=&category=` → owner-scoped
> `{ data, meta: { pagination, unreadCount } }`; no token or foreign data leaks.

`notificationListParamsSchema` (`schemas/notification.schema.ts:26-31`):
`page: int>=1`, `pageSize: int 1..100`, `read?: boolean`, `category?: 'account'|'security'|
'children'|'testActivity'|'testResults'`. The params are a `z.strictObject` — an unknown key
throws before the request, which is the guard rail this task must not break.

`meta.unreadCount` is **global**, not per filter — it must keep driving the header subtitle
unchanged when a filter is applied (a filtered view must not appear to change the unread total).

## Design source

The portal notification screen has **no filter row** — `03-portal-forms.md` §5.1 states it
explicitly ("There is no per-notification mute, no filter and no category tab in the portal feed").
This control is therefore an **authored addition** over a real API capability, and it is built from
the design's own vocabulary, inventing no new visual language: the `PortalChip` **Pill** variant
used by Settings → Language (`portal--settings.html` L21):

```
height:42px; padding:0 18px; border-radius:999px;
font-size:13.5px; font-weight:500; cursor:pointer;
selected   : background #0E2350 ; color #FFFFFF ; border 1.5px solid #0E2350
unselected : background #FFFFFF ; color #3D4A5C ; border 1.5px solid #D8DFEA
row        : display:flex; gap:8px; flex-wrap:wrap
```

Build with: `h-10.5 px-4.5 rounded-full text-body-sm font-medium border-1.5` +
selected `bg-navy-900 text-card border-navy-900` / unselected
`bg-card text-portal-fg border-portal-input`; row `flex flex-wrap gap-2`.
42px height already clears the 44px target rule when the pseudo-target
`after:-inset-y-0.5` is added — do that rather than growing the visual box.

Chips (7): `all` (no params), `unread` (`read: false`), then one per category —
`account`, `security`, `children`, `testActivity`, `testResults`. `all` and `unread` are mutually
exclusive with each other and combinable with a category, exactly as the API allows both params
at once.

A11y: the design's chips are `<button>` with no `aria-pressed` and no grouping
(`03-portal-forms.md` ACCESSIBILITY GAPS). Fix it: wrap the row in
`<div role="group" aria-label={t('filters.label')}>`, each chip a real `<button type="button">`
with `aria-pressed`, and a visible `focus-visible:ring-2 focus-visible:ring-ring`.

Motion: the design declares none on chips (§A.4). Author
`transition-colors duration-150 ease-out-quart motion-reduce:transition-none`; the feed card
re-renders with `animate-in fade-in-0 duration-150 ease-out-quart motion-reduce:animate-none` when
the filter changes.

## Files

- `src/modules/notifications/hooks/use-notification-feed-filters.ts` — new. Reads/writes
  `?category=` and `?unread=` with `useSearchParams` + `router.replace` from `@/i18n/navigation`,
  exactly the pattern in `settings/hooks/use-settings-tab-sync.ts`. Returns
  `{ category, unreadOnly, setCategory, setUnreadOnly, params }` where `params` is the validated
  `NotificationListParams`. Resets `page` to 1 on any filter change.
- `src/modules/notifications/components/NotificationFeedFilters.tsx` — new, ≤120 lines.
- `src/modules/notifications/constants/notification.constants.ts` — `NOTIFICATION_FILTER_CONFIG`
  (value + labelKey per chip) and the chip class constants.
- `src/modules/notifications/components/NotificationsScreen.tsx` — pass the filtered params into
  `useNotificationsQuery`; mount the filter row between the header and the card.
- `src/app/[locale]/dashboard/notifications/page.tsx` — wrap `NotificationsScreen` in `<Suspense>`
  (Next 16 requires a Suspense boundary around `useSearchParams`; `settings/page.tsx` already does
  exactly this).
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Notifications.filters.label`,
  `filters.all`, `filters.unread`, `filters.emptyTitle`, `filters.emptyDescription`,
  `filters.clear`. Category labels reuse the existing `Notifications.categories.*`.
- `tests/e2e/notification-filters.spec.ts` — new.

## Depends on

- **261** — the column and card the row sits above.
- **264** — grouping must already collapse to Today/Earlier, otherwise a filtered result set
  re-renders a different number of headings and the assertions are unstable.

## Steps

1. Confirm the server really filters: `curl -H "Authorization: Bearer <parent jwt>"
   "http://localhost:5500/api/notifications?page=1&pageSize=20&category=children"` and record the
   response `meta.pagination.total` vs unfiltered. If the server ignores a parameter, STOP and mark
   the task BLOCKED with the evidence — do not filter client-side and call it done.
2. Build the hook (URL is the state; no Zustand store for this).
3. Build the chip row.
4. Wire the query; keep the `['notifications','list',params]` key shape so each filter is its own
   cache entry.
5. Empty-per-filter state: when a filter yields zero rows, render the empty state from task 270
   with `filters.emptyTitle` / `filters.emptyDescription` and a `filters.clear` action — never the
   global "You're all caught up".
6. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §5 pitfall 3 (`searchParams` is async in Next 16 — this is a Client
  Component using `useSearchParams`, which needs a Suspense boundary), law 9, law 14, law 15.
- `.claude/rules/state-data.md` — URL is the state source; query keys start with the resource name;
  request params validated by the existing Zod schema before the call.
- `.claude/rules/module-pattern.md` — hook in `hooks/`, config in `constants/`, component ≤120
  lines, no business logic in the component.
- `.claude/rules/quality.md` — `role="group"`, `aria-pressed`, visible focus, ≥44px targets.
- `.claude/rules/i18n.md`, `.claude/rules/tailwind.md`, `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-filters.spec.ts` green against the running app:
  - clicking `Children` issues `GET /api/notifications?...&category=children` (assert the actual
    request URL via `waitForRequest`) and **every** rendered row's category meta equals Children;
  - the URL becomes `?category=children`; `page.reload()` restores the same filtered view and the
    same request;
  - clicking `Unread` issues `read=false` and every rendered row is `data-read="false"`;
  - both together issue both params in one request;
  - the header unread subtitle is unchanged by filtering (it reads the global `meta.unreadCount`);
  - a filter with no matches renders `filters.emptyTitle`, and `filters.clear` returns to `All`
    and to a bare URL;
  - `aria-pressed` is `true` on exactly the active chips; keyboard `Tab`+`Enter` operates them and
    the focus ring is visible.
- `notification-feed.spec.ts`, `notification-dead-link.spec.ts`, `notification-api-security.spec.ts`
  still green.
- Motion: chip colour transition `150ms`; `0s` under reduced motion.
- 375px + 1280px: the chip row wraps (`flex-wrap`) and never causes horizontal page scroll; each
  chip target ≥44px tall at 375px.
- axe zero serious/critical.
- Six catalogs key-identical (+6 keys each).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `w-[`, `<div onClick`.

## Assumptions

- The filter row is an authored addition (the design has no filter) built only from the design's
  own Pill chip. It is recorded here so a critic does not read it as invention: the capability is
  real (`C-NOTIF-LIST` params), only the affordance is new.
- `?unread=` is the URL name for `read=false` because "unread" is the user-facing concept; the
  request parameter stays the contract's `read`.

## Evidence

<!-- filled in as the task runs -->
