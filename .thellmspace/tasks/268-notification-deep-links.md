---
id: 268
title: Make the whole notification row its deep link, preserving every calm not-found path
layer: integration
kind: implement
slice: Notification deep links — full-row link target, locale-aware routing, and the existing dead-link behaviour kept intact
target: src/modules/notifications/components/NotificationFeedItem.tsx, src/modules/notifications/components/NotificationPreviewItem.tsx, src/modules/notifications/lib/notification-link.ts, tests/e2e/notification-deep-link.spec.ts
contract: C-NOTIF-LIST (.qa/CONTRACTS.md:190-191)
design: .qa/design/screens/portal--notifications.html L14-L22 (row is one target); .qa/design/spec/03-portal-forms.md#51
status: TODO
depends_on: [013, 262]
---

## Objective

Today only the title is a link and it carries a trailing `ArrowUpRight` glyph
(`NotificationFeedItem.tsx:57-66`) — the design's row has no arrow and reads as one target. Make
the row's title an overlay link that covers the row's text column, keep the mark-read dot outside
that overlay, and preserve **every** behaviour proved by `notification-dead-link.spec.ts` — that
spec is the contract for this task.

## Contract

`.qa/CONTRACTS.md:190-191` — `linkUrl` is `string|null` (`schemas/notification.schema.ts:21`).
The API sets it; the client never composes one.

Behaviour that must survive byte-for-byte (`tests/e2e/notification-dead-link.spec.ts`):

- a notification whose child was deleted lands on a **calm not-found**, never an error page;
- a malformed link degrades to the same calm not-found;
- injected API faults (the parametrised `fault` cases at `:205`) still surface as an **error**,
  never as "removed child";
- a non-parent account gets its own message, never "removed";
- **every** link shape present in the feed reaches a usable page (`:279`).

## Design source

`.qa/design/screens/portal--notifications.html` L14-L22: the row is
`display:flex; align-items:flex-start; gap:16px` with a title `14.5px / 600 / #0E2350`, body text
and time — and **no link chrome at all**: no arrow, no underline, no colour change. The design's
global rule is `a { color:#0E2350 } a:hover { color:#2563EB }`
(`03-portal-forms.md` §1.3), so the row title's only link affordance is the hover colour.

Build:
- title stays `text-lede font-semibold text-navy-900`; when `linkUrl !== null` it is a
  `<Link>` from `@/i18n/navigation` with
  `hover:text-primary transition-colors duration-150 ease-out-quart motion-reduce:transition-none`;
- **stretched target**: `after:absolute after:inset-0` on the link plus `relative` on the row's
  text column — so the whole text column is clickable while the mark-read dot (which sits outside
  that column, task 265) stays independently reachable;
- delete the `ArrowUpRight` import and its `size-4` glyph;
- `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-sm` on the link
  (PLAN finding 2 — the export authors no focus state; we do);
- a notification with `linkUrl === null` renders the title as plain text with **no** hover, no
  pointer cursor and no stretched overlay.

## Files

- `src/modules/notifications/lib/notification-link.ts` — new pure helper
  `getNotificationHref(linkUrl: string | null): string | null` that returns the value unchanged
  when it is a same-origin app path (`/…`) and `null` otherwise. It must NOT rewrite, prefix or
  "repair" a path — `notification-dead-link.spec.ts:158` requires a malformed link to still route
  and degrade calmly, so anything non-null and app-shaped is passed straight to `<Link>`.
- `src/modules/notifications/components/NotificationFeedItem.tsx` — stretched link + no arrow.
- `src/modules/notifications/components/NotificationPreviewItem.tsx` — same link treatment inside
  the bell popover (task 271 owns its chrome; the href semantics are shared here).
- `tests/e2e/notification-deep-link.spec.ts` — new (additive; `notification-dead-link.spec.ts` is
  NOT modified).

## Depends on

- **262** — the row's box, text column and dot slot.

## Steps

1. Read `tests/e2e/notification-dead-link.spec.ts` end to end and list every selector and every
   asserted destination. Run it before touching anything and record the green baseline.
2. Extract the href helper (pure, no `next-intl` import in `lib/`).
3. Convert the title to a stretched `<Link>`; keep the locale-aware `Link` from `@/i18n/navigation`
   (`.claude/rules/i18n.md`: never a bare `<a>` for internal nav).
4. Verify the dot is still independently clickable — a stretched overlay that swallows the dot is a
   failure of task 265, and the e2e must catch it.
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §5 pitfall 13 (`<Link>`, never `<a>` for internal nav), law 3, 14, 15.
- `.claude/rules/i18n.md` — locale-aware routing from `next-intl/navigation`.
- `.claude/rules/quality.md` — visible focus, no nested interactive elements (the dot button must
  not be inside the stretched link's box), ≥44px targets.
- `.claude/rules/module-pattern.md` — pure helper in `lib/`.
- `.claude/rules/tailwind.md`, `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-deep-link.spec.ts` green against the running app:
  - a row with a real `linkUrl` navigates on a click anywhere in its text column (click at the
    row's mid-height, 200px from the left edge) and lands on the same URL the API returned;
  - the navigation keeps the locale prefix (`/en/...`), i.e. `<Link>` not `<a>`;
  - clicking the mark-read dot does **not** navigate (assert `page.url()` unchanged);
  - a row with `linkUrl === null` has no `<a>` in its text column and clicking it does nothing;
  - keyboard: `Tab` reaches the link, its focus ring is visible, `Enter` navigates;
  - no `ArrowUpRight` svg remains inside a row.
- **`notification-dead-link.spec.ts` passes unchanged — all 5+ tests including the parametrised
  fault cases.** Paste the run.
- `notification-feed.spec.ts` and the bell coverage in `notification-feed.spec.ts` still green.
- Motion: title hover colour transitions over `150ms`; `0s` under reduced motion.
- 375px + 1280px: at 375px the stretched target does not overlap the dot (assert boxes disjoint).
- axe zero serious/critical, specifically no "nested interactive controls" violation.
- Six catalogs unchanged (no new strings) — assert the key count is still identical across all six.
- Zero banned-pattern grep hits: `any`, `<a href="/`, raw hex, `p-[`.

## Assumptions

- `linkUrl` values in the real data are app-relative paths. If the API ever returns an absolute
  URL, `getNotificationHref` returns `null` and the title renders as plain text rather than opening
  an unvetted external origin — record any absolute value actually observed.

## Evidence

<!-- filled in as the task runs -->
