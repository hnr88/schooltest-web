---
id: 269
title: Recut feed pagination to the portal dialect over the real server pagination meta
layer: ui
kind: implement
slice: Feed pagination — page summary + prev/next, driven by meta.pagination, URL-synced
target: src/modules/notifications/components/NotificationFeedPagination.tsx, src/modules/notifications/hooks/use-notification-feed-filters.ts, src/modules/notifications/components/NotificationsScreen.tsx, src/i18n/messages/*.json, tests/e2e/notification-pagination.spec.ts
contract: C-NOTIF-LIST (.qa/CONTRACTS.md:190-191)
design: .qa/design/spec/05-ds-components.md (pagination) + .qa/design/screens/portal--notifications.html L36 (card foot); .qa/design/spec/03-portal-forms.md#14-shared-portal-primitives (PortalGhostButton)
status: TODO
depends_on: [041, 261]
---

## Objective

`NotificationFeedPagination.tsx` renders two 44px outline buttons and a "Page X of Y" line inside
the card body. Recut it to the portal dialect — ghost pill buttons on the card's foot strip — and
move page state into the URL so a deep-linked page survives reload, keeping the real
`meta.pagination` as the only source of page truth.

## Contract

`.qa/CONTRACTS.md:190-191` — `meta.pagination` is validated by
`schemas/notification.schema.ts:35-40`: `{ page, pageSize, pageCount, total }`, all non-negative
ints, `pageSize <= 100`. `NOTIFICATION_FEED_PAGE_SIZE = 20`
(`constants/notification.constants.ts:2`) stays.

Rules that must hold: `page` is clamped to `1..max(pageCount,1)`; a request for a page beyond
`pageCount` must not be issued; `pageCount === 0` (no rows at all) renders no pagination.

## Design source

The portal notification card has no pagination in the export (the feed is 5 static rows), so the
control is built from the design's own primitives, inventing nothing:

`PortalGhostButton` (`03-portal-forms.md` §1.4):
```
background:#FFFFFF; color:#0E2350; font-size:13px; font-weight:600;
padding:10px 18px; border-radius:999px; border:1px solid #D8DFEA; cursor:pointer;
:hover -> border-color:#0E2350
```
→ `bg-card text-navy-900 text-caption font-semibold px-4.5 py-2.5 rounded-full border border-portal-input hover:border-navy-900`.

Page summary line: the card-foot meta dialect — `12.5px / #7C8698`
(`03-portal-forms.md` §6.3 invoice meta) → `text-meta text-portal-muted`.

Strip: sits on the card's trailing spacer (`portal--notifications.html` L36,
`padding:6px 0 14px`) with a `1px solid #EEF1F6` top hairline —
`mt-0 border-t border-portal-line pt-3.5 pb-3.5 flex items-center justify-between gap-4`.

Disabled: `disabled:text-portal-faint disabled:border-portal-line disabled:cursor-not-allowed`
(`04-ds-foundations.md` `UNKNOWNS 4` — no disabled state in the export; authored, recorded).

Motion: `transition-colors duration-150 ease-out-quart motion-reduce:transition-none` on the border
colour (§A.2 hover intent + the shared 150ms). The card body re-renders on page change with
`animate-in fade-in-0 duration-150 ease-out-quart motion-reduce:animate-none` — never a slide, so
scroll position is not fought.

## Files

- `src/modules/notifications/components/NotificationFeedPagination.tsx` — recut. Keep the
  `<nav aria-label={t('paginationLabel')}>` landmark and the `pageSummary` ICU key.
- `src/modules/notifications/hooks/use-notification-feed-filters.ts` — extend with `page` in the
  URL (`?page=`), clamped, reset to 1 whenever a filter changes (task 267 owns the filter half; if
  267 has not landed, create the hook here with page only and 267 extends it).
- `src/modules/notifications/components/NotificationsScreen.tsx` — drop the local `useState(1)`.
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Notifications.pageSummary`, `previous`, `next`,
  `paginationLabel` already exist; add `Notifications.pageRange`
  (`Showing {from}-{to} of {total}`) and use `meta.pagination.total` — a real number the API
  returns, never an estimate.
- `tests/e2e/notification-pagination.spec.ts` — new.

## Depends on

- **261** — the card box and its trailing spacer, which the strip attaches to.

## Steps

1. Confirm the seeded parent actually has >20 notifications; if not, create enough real ones in the
   spec through real domain events, or (allowed, read-only) count them first:
   `psql -h 127.0.0.1 -p 5540 -c "select count(*) from notifications;"`. Never insert rows directly
   to make a test pass.
2. Move `page` into the URL via the shared hook; clamp on read.
3. Recut the control; keep `nav` + `aria-label` + `aria-disabled` semantics.
4. Ensure `pageCount <= 1` renders nothing (current behaviour, preserved).
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §5 pitfall 3 (Suspense boundary around `useSearchParams`), law 14, 15.
- `.claude/rules/state-data.md` — one query hook, array key including the page, no duplicate fetch.
- `.claude/rules/quality.md` — nav landmark, ≥44px targets, visible focus, disabled announced.
- `.claude/rules/tailwind.md`, `.claude/rules/i18n.md`, `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-pagination.spec.ts` green against the running app:
  - with `total > 20`, `Next` issues `GET /api/notifications?page=2&pageSize=20` (assert the real
    request URL) and the first row's `data-notification-id` differs from page 1's;
  - the URL becomes `?page=2`; `page.reload()` restores page 2 and re-issues the same request;
  - on the last page `Next` is disabled; on page 1 `Previous` is disabled — both still rendered;
  - `pageRange` text equals the arithmetic of the REAL `meta.pagination` returned in the same test
    (`from = (page-1)*pageSize+1`, `to = min(page*pageSize, total)`);
  - computed style: button `border-radius` `9999px`, `font-size` `13px`, `border-width` `1px`;
    strip has a `1px` top border in `--color-portal-line`.
- `notification-feed.spec.ts` still green.
- Motion: border-colour transition `150ms`, `0s` reduced; page change fades, never slides.
- 375px + 1280px: at 375px the summary and the buttons stack without horizontal scroll and each
  button target is ≥44px.
- axe zero serious/critical.
- Six catalogs key-identical (+1 key each).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `w-[`.

## Assumptions

- If the seeded dataset has ≤20 notifications on every run, the pagination path cannot be proved
  with real data. In that case the spec must first generate >20 real notifications through real
  domain events; if that is impossible inside a test budget, mark the task BLOCKED with the row
  count rather than asserting against a mocked response.

## Evidence

<!-- filled in as the task runs -->
