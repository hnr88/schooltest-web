---
id: 261
title: Recut the notifications page to the portal shell — 820px column, 30px title, live unread subtitle, single 24px feed card
layer: ui
kind: implement
slice: Notifications feed page chrome (header + unread subtitle + mark-all slot + the one feed card)
target: src/modules/notifications/components/NotificationsScreen.tsx, src/modules/notifications/constants/notification.constants.ts, src/app/globals.css, src/i18n/messages/*.json, tests/e2e/notifications-portal-shell.spec.ts
contract: C-NOTIF-LIST (.qa/CONTRACTS.md:190-191)
design: .qa/design/screens/portal--notifications.html L3-L11, L36-L38; .qa/design/spec/03-portal-forms.md#51-notification-feed--portal-canonical
status: TODO
depends_on: [001, 004, 005, 006, 007, 008, 010, 011, 013, 035, 110]
---

## Objective

`/[locale]/dashboard/notifications` currently renders a shadcn `Card` with a `CardHeader`/
`CardTitle`/`CardDescription` and a 4-column-wide `main` (`NotificationsScreen.tsx:34-63`). The
design is a **measure-capped 820px single column**: a 30px title, a live "N unread" subtitle, a
text-only "Mark all as read" action on the header baseline, and exactly ONE white 24px-radius card
holding the whole feed. Deliver that chrome, keep every existing data behaviour, and emit the two
portal `@theme` tokens the rest of W9 builds on.

## Contract

`.qa/CONTRACTS.md:190-191`:

> `C-NOTIF-LIST`: `GET /api/notifications?page=&pageSize=&read=&category=` → owner-scoped
> `{ data, meta: { pagination, unreadCount } }`; no token or foreign data leaks.

Behaviour to preserve exactly:

- `useNotificationsQuery({ page, pageSize: NOTIFICATION_FEED_PAGE_SIZE })`
  (`queries/use-notifications.query.ts:24-32`, key `['notifications','list',params]`,
  `staleTime: 0`, `retry: false`). Do not add a second fetch, do not change the key.
- `meta.unreadCount` drives the subtitle; `meta.pagination` drives task 269.
- `useNotificationActions()` (`hooks/use-notification-actions.ts`) stays the only mutation entry.
- The route file `src/app/[locale]/dashboard/notifications/page.tsx` and its `generateMetadata`
  are untouched.

## Design source

`.qa/design/screens/portal--notifications.html`:

| Element | Design (line) | Build with |
|---|---|---|
| Column | `display:flex; flex-direction:column; gap:22px; padding:8px 4px 8px 8px; max-width:820px` (L3) | `flex flex-col gap-5.5 max-w-portal` + page padding `px-4 py-6 sm:px-6 lg:px-8` (the shell owns the outer gutter — keep the existing values) |
| Header row | `display:flex; align-items:flex-end; justify-content:space-between; gap:16px` (L4) | `flex flex-wrap items-end justify-between gap-4` |
| `h1` | `30px / 500 / -0.02em / #0E2350` (L6) | `text-portal-h1 font-medium text-navy-900` |
| Subtitle | `margin:6px 0 0; 14px / #7C8698` — literal `2 unread` (L7) | `mt-1.5 text-sm text-portal-muted` |
| Mark-all action | `background:transparent; color:#2563EB; 13.5px / 600; border:none; padding:8px 4px` (L9) | slot only here — task 266 builds the control |
| Feed card | `background:#FFFFFF; border-radius:24px; padding:6px 28px; box-shadow:0 1px 2px rgba(14,35,80,.04)` (L11) | `bg-card rounded-3xl px-7 py-1.5 shadow-sm` |
| Trailing spacer | `<div style="padding:6px 0 14px">` (L36) | `pt-1.5 pb-3.5` on the card's last child |

Token mapping (`.qa/design/spec/03-portal-forms.md` §1.2 + `04-ds-foundations.md#TAILWIND-V4-MAPPING`):
`#0E2350` → `--color-navy-900`, `#2563EB` → `--color-primary`, `#FFFFFF` → `--color-card`,
`#7C8698` → `--color-portal-muted`, `#9AA6B8` → `--color-portal-faint`,
`#EEF1F6` → `--color-portal-line`.

Two `@theme` entries this task emits in `src/app/globals.css` if W0 has not already
(both are tokens, NOT arbitrary values — `.claude/rules/tailwind.md:13` bans `max-w-[820px]` and
`text-[30px]`):

```
--text-portal-h1: 1.875rem;                 /* 30px  — portal--notifications.html L6 */
--text-portal-h1--line-height: 1.2;
--text-portal-h1--letter-spacing: -0.02em;
--container-portal: 51.25rem;               /* 820px — portal--notifications.html L3 */
```

Type steps already in `globals.css` that match the portal dialect and must be reused, never
re-declared: `text-lede` 14.5px, `text-body-sm` 13.5px, `text-caption` 13px, `text-meta` 12.5px,
`text-overline` 11.5px, `text-micro` 11px, `tracking-overline` .06em.

Motion (`.qa/DECISIONS.md` **D-DESIGN-3**; the export has none for this screen —
`03-portal-forms.md` §A.4): the page keeps its current entrance —
`animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out-expo` with
`motion-reduce:animate-none`. The unread subtitle re-renders on count change; give it
`transition-opacity duration-150 ease-out-quart motion-reduce:transition-none` only — never a
layout-affecting transition (`.claude/rules/tailwind.md:19`).

## Files

- `src/app/globals.css` — the two `@theme` entries above (skip any W0 already emitted).
- `src/modules/notifications/components/NotificationsScreen.tsx` — replace the `Card` /
  `CardHeader` / `CardTitle` / `CardDescription` chrome with the portal column + card; keep the
  query, the actions hook, the `data-surface="notification-feed"` hook and the state branches
  (tasks 270/269 recut their contents). Must stay ≤120 lines — if it does not, extract the header
  into `components/NotificationFeedHeader.tsx`.
- `src/modules/notifications/constants/notification.constants.ts` — add
  `NOTIFICATION_CARD_CLASS` / `NOTIFICATION_COLUMN_CLASS` if the class strings repeat.
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Notifications.recentTitle` and
  `Notifications.feedDescription` lose their card slots. Do NOT delete the keys in this task
  (`notification-feed.spec.ts` may select on them); confirm by grep first, and only delete from
  all six catalogs together if nothing references them.
- `tests/e2e/notifications-portal-shell.spec.ts` — new.

## Depends on

- **001** light OKLCH colours — `--color-navy-900`, `--color-card`, and the portal neutral ramp
  (`#7C8698` / `#9AA6B8` / `#EEF1F6`). Use the names W0 actually emitted; never invent a token.
- **004** spacing scale, including the design's off-4pt steps (22 / 26 / 28px).
- **005** + **006** type steps — the 14px body step and the chrome steps (`text-lede` 14.5,
  `text-caption` 13, `text-meta` 12.5, `text-overline` 11.5).
- **007** radius scale (24px card), **008** shadow scale (`--shadow-sm`).
- **010** easing/duration tokens, **011** `st-fade-in` + the reduced-motion variant,
  **013** the focus-ring foundation.
- **035** the card shell family — the portal card is a variant of it, not a second card.
- **110** the portal shell frame (24px gutter, 1600px cap) that this column sits inside.

## Steps

1. Grep for consumers of `Notifications.recentTitle` / `feedDescription` in `src/` and `tests/`.
2. Emit the two `@theme` tokens (or confirm W0 already did, and record which names won).
3. Rebuild the screen chrome to the table above. `<main>` keeps `data-surface="notification-feed"`.
4. The subtitle renders `t('unreadCount', { count: unreadCount })` — the existing ICU plural key
   already produces `No unread notifications` / `# unread notification` / `# unread notifications`.
   The design's literal `2 unread` is that same metric (`03-portal-forms.md` §7.1) — keep the
   plural-correct key, do not hardcode the design's English.
5. Keep the `Bell` pill only if it survives at 375px; the design has no pill — remove it and let
   the subtitle carry the count (record the removal in Evidence).
6. Write the spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 8 (`'use client'` only where needed — this screen already
  needs it), law 11 (never edit `src/components/ui/*`), law 14, law 15.
- `.claude/rules/tailwind.md` — OKLCH `@theme` tokens only, **no arbitrary values**
  (`max-w-[820px]`, `text-[30px]`, `p-[17px]` are failures); 4pt-derived spacing utilities
  (`gap-5.5` = 22px, `px-7` = 28px, `py-1.5` = 6px are v4 dynamic-scale utilities, not arbitrary);
  animate transform/opacity only; exponential easings.
- `.claude/rules/module-pattern.md` — component ≤120 lines, file ≤200; class-string constants live
  in `constants/`, never inline duplicated.
- `.claude/rules/i18n.md`, `.claude/rules/quality.md` (one `<h1>`, semantic landmarks, visible
  focus), `.claude/rules/testing.md`, `.qa/DECISIONS.md` **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notifications-portal-shell.spec.ts` green against the running app, asserting on
  `/en/dashboard/notifications` as the seeded parent:
  - exactly one `h1`, with computed `font-size: 30px`, `font-weight: 500`,
    `letter-spacing: -0.6px` (= -0.02em at 30px) and the `--color-navy-900` colour;
  - the column element's computed `max-width` is `820px`;
  - the feed card's computed `border-radius` is `24px`, `padding` is `6px 28px`, and its
    `background-color` equals the resolved `--color-card`;
  - the subtitle text equals `t('unreadCount', { count })` for the real `meta.unreadCount`
    returned by `GET /api/notifications` in the same test (read via `page.waitForResponse`), i.e.
    the rendered number IS the API's number.
- `notification-feed.spec.ts`, `notification-dead-link.spec.ts` and `notification-api-security.spec.ts`
  still pass unchanged.
- Motion: the `main` has a non-`none` `animation-name` on load and `animation: none` under
  `page.emulateMedia({ reducedMotion: 'reduce' })`.
- 375px and 1280px: `document.documentElement.scrollWidth <= clientWidth` at both;
  at 375px the header wraps and the title never truncates.
- axe: zero serious/critical on the route at both widths.
- Six catalogs key-identical (assert with `tests/e2e/helpers/i18n.ts`); count unchanged at 1151
  unless a key was deleted from all six.
- Zero banned-pattern grep hits in the diff: `any`, `#[0-9a-fA-F]{3,6}`, `text-[`, `p-[`, `w-[`,
  `max-w-[`.

## Assumptions

- W0 names the portal neutrals `--color-portal-fg|muted|faint|input|line` as proposed in
  `.qa/design/spec/03-portal-forms.md` §1.2. If it chose other names, use W0's and record the
  mapping in Evidence.
- The portal card shadow is `0 1px 2px rgba(14,35,80,.04)` but `04-ds-foundations.md` §F
  standardises `--shadow-sm` at `/0.06`. Use `shadow-sm`; record the 0.02 alpha delta rather than
  adding a one-off shadow.

## Evidence

<!-- filled in as the task runs -->
