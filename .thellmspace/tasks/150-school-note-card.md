---
id: 150
title: Build the "Latest update" card in the design's note-card shell, fed by the real notification feed
layer: frontend
kind: wire
slice: The left cell of the second dashboard grid (design §6.1's container), with real data
target: src/modules/dashboard/components/DashboardSchoolNote.tsx
contract: existing GET /api/notifications (api-inventory #14)
design: .qa/design/screens/portal--main.html:89-97 · .qa/design/spec/01-portal-dashboard.md#6.1
status: TODO
depends_on: ["131"]
---

## Objective
The design's "Note from school" card is a teacher-authored note that does not exist in this system
(see the BLOCKED task **151**). The card's *container* is a good home for the one message stream a
parent really has: their notification feed. This task ships that card — same shell, same rhythm,
truthful content and a truthful heading.

## Contract
`GET /api/notifications` (`.qa/intake/api-inventory.md` #14), already wired in this app by
`useNotificationsQuery` (`src/modules/notifications/queries/use-notifications.query.ts`) and parsed
by `notificationListResponseSchema`. **Reuse that hook — do not add a second one.**
- Params here: `{ page: 1, pageSize: 1 }` — the newest item only. No `category` filter, so the card
  never mislabels the provenance of what it shows.
- Row shape (the ten-key whitelist): `documentId, eventType, category, title, body|null, priority,
  readAt|null, linkUrl|null, createdAt, updatedAt`.
- Errors: `400` (bad `read`/`category` — not sent here) · `403` · `429`. Ownership is server-forced:
  `{ user: { documentId: { $eq: caller.documentId } } }`.
- Persistence effect: none. **This card does not mark anything read** — reading the dashboard must
  not silently clear a parent's unread badge.

## Design source — the shell is followed exactly, the content is honest
- Container (`portal--main.html:89`): `background:#FFFFFF; border-radius:24px; padding:28px 30px;
  box-shadow:0 1px 2px rgba(14,35,80,.04); display:flex; flex-direction:column`
  → `flex flex-col rounded-portal bg-card p-8 shadow-sm`. `data-slot="dashboard-school-note"`.
- Eyebrow (`:90`): `12.5px / 600 / .06em / uppercase / #9AA6B8`
  → `text-meta font-semibold uppercase tracking-overline text-slate-400`.
  Copy: **`Dashboard.note.eyebrow` = "Latest update"**, NOT "Note from school" — the item may be an
  account or security notification, and labelling it as coming from a school would be false.
- Body (`:91`): `16.5px / 450 / line-height 1.6 / #0E2350 / margin-top:14px / flex:1`
  → `mt-3.5 flex-1 text-panel-title font-normal text-navy-900`.
  `--text-panel-title` = 1.0625rem (17px) vs 16.5px (0.5px delta); its line-height is 1.35 vs 1.6 —
  add `leading-relaxed` (1.625) which is the nearest standard step. `font-weight:450` needs the
  variable font; Google Sans variable is loaded via `next/font/local` in
  `src/app/[locale]/layout.tsx` — use `font-normal` (400) rather than an arbitrary 450.
  Content = the notification's `title`; when `body` is non-null render it under the title at
  `text-caption text-muted-foreground`. **No curly quotes are wrapped around it** — the design's
  quotation marks belong to a human quote; a system notification is not a quotation.
- Footer (`:92`): `flex items-center gap-3 mt-5 pt-4.5 border-t border-divider`
  (design `gap:12px; margin-top:20px; padding-top:18px; border-top:1px solid #EEF1F6`).
  - The design's `38×38` avatar with the author's initial has no author to show. Replace with the
    existing `NotificationCategoryIcon` shape: a `size-9.5 rounded-full bg-surface-well grid
    place-items-center` tile holding the lucide icon for `category`
    (`account | security | children | testActivity | testResults`). `aria-hidden`.
  - Name slot → the category label, `text-body-sm font-semibold text-navy-900`, from
    `Notifications.category.*` (existing keys — reuse, do not duplicate).
  - Role slot → the relative time from `createdAt`, `text-xs text-muted-foreground`, via next-intl
    `useFormatter().relativeTime(createdAt)`.
  - Action `Reply` (`13px / 600 / #2563EB`, no handler bound in the design) → a real
    `<Link href={linkUrl}>` labelled `Dashboard.note.view` = "View →", rendered **only when
    `linkUrl` is non-null**. Same `text-caption font-semibold text-blue-600` styling plus
    `focus-visible:ring-2 focus-visible:ring-ring`.
- **Empty** (`meta.pagination.total === 0`): eyebrow stays, body renders
  `Dashboard.note.empty` = "No updates yet." in `text-muted-foreground`, footer omitted.
- **Loading**: `h-5 w-full` + `h-5 w-3/4` `shimmer-sweep` bars in the body, real eyebrow,
  `aria-busy="true"`.
- **Error**: this card owns a SEPARATE request from the household one, so it must fail alone —
  render the design-system `Alert variant="error"` inside the card with a retry `Button` bound to
  `refetch()`. A failing notification feed must not take the dashboard down.
- Motion: card entrance is 156's; the "View" link gets
  `transition-colors duration-150 ease-out-expo motion-reduce:transition-none`.
- 375px: card is full width in the collapsed grid; `p-6`; footer wraps.

## Files
- CREATE `src/modules/dashboard/components/DashboardSchoolNote.tsx` (≤120 lines).
- EDIT `DashboardScreen` — mount as the note grid's only cell (see 152: the second cell is BLOCKED,
  so the `auto-fit` grid collapses to one full-width column — that is correct, not a bug).
- i18n: `Dashboard.note.eyebrow`, `.view`, `.empty`, `.error`.

## Depends on
- **131** — `rounded-portal` and the note grid.

## Steps
1. Reuse `useNotificationsQuery({ page: 1, pageSize: 1 })`; confirm the query key differs from the
   bell's so neither clobbers the other's cache.
2. Build the card with the four states.
3. Reuse `NotificationCategoryIcon` and `Notifications.category.*` from `@/modules/notifications`
   via its barrel — if `NotificationCategoryIcon` is not exported, export it rather than copying it.

## Project rules
- `.claude/rules/module-pattern.md` — cross-module import through the barrel ONLY; never reach into
  `@/modules/notifications/components/…`.
- `.claude/rules/state-data.md` — one hook per query; reuse before adding.
- `.claude/rules/i18n.md` — reuse `Notifications.category.*`; add no duplicate keys.
- `.claude/rules/quality.md` — link, not `div onClick`; visible focus.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright against live data: `GET /api/notifications?page=1&pageSize=1` returns 200; the card's
  body text equals `data[0].title` from that live response, and the footer's category label equals
  the `Notifications.category.<data[0].category>` string. Hardcoded expected text is a fail.
- Persistence/no-side-effect proof: note `meta.unreadCount` before loading `/dashboard`, reload, and
  assert `GET /api/notifications/unread-count` is unchanged — the card must not mark anything read.
  Confirm with `psql` on `127.0.0.1:5540` that `read_at` on that row is unchanged.
- `linkUrl` present ⇒ the "View" link's `href` equals it and navigating lands on that route;
  `linkUrl: null` stub ⇒ no link renders.
- Empty stub (`data: []`, `total: 0`) ⇒ the empty copy renders and no footer.
- Error stub (500 on `/api/notifications` only) ⇒ the card shows the Alert AND the hero, chart and
  children sections are still rendered — isolation proven.
- axe clean; 375px no overflow; six catalogs key-identical; zero banned-pattern hits.

## Assumptions
- `useNotificationsQuery` accepts `{ page, pageSize }`; if its params schema differs, use its real
  shape rather than changing the hook.

## Evidence
<filled in as the task runs>
