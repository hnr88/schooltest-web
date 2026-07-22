---
id: 271
title: Rebuild the topbar bell popover to the app dropdown panel — 420px, semantic icon tiles, NEW count badge, unread tint
layer: ui
kind: implement
slice: The notification dropdown anchored to the top bar (bell trigger, count badge, 5-row preview, footer link)
target: src/modules/notifications/components/NotificationBell.tsx, src/modules/notifications/components/NotificationPreviewPanel.tsx, src/modules/notifications/components/NotificationPreviewList.tsx, src/modules/notifications/components/NotificationPreviewItem.tsx, src/modules/notifications/lib/notification-display.ts, src/i18n/messages/*.json, tests/e2e/notification-bell-popover.spec.ts
contract: C-NOTIF-LIST, C-NOTIF-READ, C-NOTIF-READ-ALL (.qa/CONTRACTS.md:190-194)
design: .qa/design/screens/app--notifications.html L12-L45; .qa/design/spec/03-portal-forms.md#52-notification-panel--app-variant-app--notificationshtml
status: TODO
depends_on: [031, 047, 121, 262, 263]
---

## Objective

The bell popover is the ONE surface where the design's **app** dialect is canonical — the portal
export has no dropdown at all, and `app--notifications.html` is a complete, fully-specified panel.
Rebuild `NotificationBell` + its preview components to that panel, keeping the existing popover
behaviour (open/close, mark-read-on-activate, view-all navigation) intact.

## Contract

`.qa/CONTRACTS.md:190-194` — the popover reads `C-NOTIF-LIST` with
`pageSize: NOTIFICATION_PREVIEW_PAGE_SIZE` (5, `constants/notification.constants.ts:1`), marks one
read with `C-NOTIF-READ` and all with `C-NOTIF-READ-ALL`. No new endpoint.

Preserve: `handleActivate` (`NotificationBell.tsx:33-36`) — activating an unread item marks it read
and closes the popover if it has a link; `data-slot="notification-bell"` and
`data-slot="notification-popover"`; the `viewAll` footer link to `/dashboard/notifications`.

## Design source

`.qa/design/screens/app--notifications.html` — copy these values
(`03-portal-forms.md` §5.2 resolves them):

```
panel  : position:absolute; top:60px; right:96px; width:420px; background:#FFFFFF;
         border:1px solid #E3E8F0; border-radius:16px;
         box-shadow:0 20px 48px rgba(14,35,80,.18); overflow:hidden          (L12)
header : padding:18px 22px; border-bottom:1px solid #E3E8F0; flex; between   (L13-16)
  h3     : 16.5px / 700 / #0E2350                      -> "Notifications"
  badge  : 11.5px / 700 / #fff on #DC2626; padding:2px 8px; border-radius:999px -> "4 NEW"
  action : 13px / 600 / #2563EB (hover #1D4ED8)        -> "Mark all read"
row    : display:flex; gap:14px; padding:14px 22px; align-items:flex-start    (L17-21)
  unread -> background:#EFF5FF; border-bottom:1px solid #E3E8F0
  read   -> no background;      border-bottom:1px solid #F1F5F9 (last: none)
  tile : 38×38; border-radius:11px; grid place-items:center; flex:none;
         svg 17×17; fill:none; stroke-width:2; linecap/linejoin:round
  text : 14px; line-height:1.45; unread #0E2350 (with <strong>) | read #475569
  time : 12.5px; #94A3B8
  dot  : 9×9; border-radius:99px; #2563EB; margin-top:5px   (unread ONLY — omitted when read)
footer : padding:14px 22px; border-top:1px solid #E3E8F0; text-align:center;
         a 13.5px / 600                                  -> "View all notifications"  (L45)
```

Utilities: panel `w-105 rounded-2xl border border-border shadow-xl` (420px = `w-105`);
header `px-5.5 py-4.5 border-b border-border`; title `text-panel-title font-bold text-navy-900`
(17px token ≈ the design's 16.5px — record the 0.5px delta, do not add a one-off step);
badge `text-overline font-bold text-destructive-foreground bg-destructive px-2 py-0.5 rounded-full`;
row `gap-3.5 px-5.5 py-3.5`, unread `bg-secondary` (`#EFF5FF`), read `bg-transparent`;
tile `size-9.5 rounded-xl` (11px ≈ `rounded-xl` 12px — record the 1px delta);
text `text-sm leading-snug`, unread `text-navy-900`, read `text-body`;
time `text-meta text-portal-muted` (the design's `#94A3B8` is 2.6:1 on white and FAILS AA —
re-ink to `--color-portal-muted` `#7C8698`, the same correction `settings.constants.ts` documents);
dot `size-2.25 rounded-full bg-primary mt-1.25`.

**Semantic tile tint** (`03-portal-forms.md` §5.2 table + "The icon tile tint is semantic"):

| Category (real API value) | tile bg | stroke | lucide icon |
|---|---|---|---|
| `testResults` | `#DBEAFE` `bg-brand-100` | `#2563EB` `text-primary` | line chart |
| `testActivity` | `#FEF3C7` `bg-warning-soft` | `#D97706` `text-warning` | clock |
| `children` | `#F0FDF4` `bg-success-soft` | `#16A34A` `text-success` | check |
| `security` | `#FEF2F2` `bg-destructive-soft` | `#DC2626` `text-destructive` | alert triangle |
| `account` | `#F0FDFA` `bg-accent-50` | `#0D9488` `text-accent-600` | circle-plus |
| any, when read | `#F1F5F9` `bg-muted` | `#64748B` `text-muted-foreground` | (its own icon) |

That mapping is a real derivation from the row's `category` field — it is NOT the invented glyph
of `UNKNOWNS 11`. Keep the lucide set already imported in `NotificationCategoryIcon.tsx`; only the
tint table moves to the design's semantic pairs.

The `4 NEW` badge is count-driven (`03-portal-forms.md` §5.2: "uppercase literal, count-driven") —
render `t('newBadge', { count })` and hide it entirely at 0.

Motion: the popover already animates via the W1 popover primitive; keep
`duration-200 ease-out-expo motion-reduce:animate-none`. Row background transitions read⇄unread
with `transition-colors duration-200 ease-out-quart motion-reduce:transition-none`.

## Files

- `src/modules/notifications/components/NotificationBell.tsx` — panel box, header, badge, footer.
- `src/modules/notifications/components/NotificationPreviewPanel.tsx` — its three states in the
  panel dialect (reuse the skeleton geometry idea from task 270, at row scale).
- `src/modules/notifications/components/NotificationPreviewList.tsx` /
  `NotificationPreviewItem.tsx` — the row above, with the task 263 timestamp and the task 268 link.
- `src/modules/notifications/lib/notification-display.ts` — add
  `getNotificationTileTint(category, isRead)` returning the pair from the table (pure).
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Notifications.newBadge`
  (`{count, plural, other {# NEW}}`) new in all six.
- `tests/e2e/notification-bell-popover.spec.ts` — new.

## Depends on

- **262** — the shared read/unread semantics and `data-read` hook.
- **263** — the three-tier timestamp the preview row prints.
- **031** — the count-badge primitive the `NEW` badge and the trigger's unread bubble use.
- **047** — the Popover primitive (14px radius surface, focus trap, Escape) this panel is built on.
- **121** — W4 owns the bell **trigger** (the design's 44px white circle in the top row) and the
  real unread count on it. This task owns the **panel** only; do not restyle the trigger here.

## Steps

1. Read `notification-feed.spec.ts` for any bell selectors and keep them.
2. Rebuild the panel and header; the trigger stays a 44px button with `aria-label={t('bellLabel')}`
   and the existing `CountBadge`.
3. Rebuild the row with the semantic tint table.
4. Keep `handleActivate` semantics exactly.
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 11 (wrap, never edit `src/components/ui/*`), 14, 15.
- `.claude/rules/quality.md` — the popover traps focus and closes on Escape (W1 primitive
  behaviour — assert it), ≥44px trigger, visible focus, alt/aria on every icon.
- `.claude/rules/tailwind.md` — tokens only; colour transitions are the §I.1 exception; no
  arbitrary values (`w-105` and `size-9.5` are v4 dynamic-scale utilities).
- `.claude/rules/module-pattern.md` — tint table is a pure helper in `lib/`; components ≤120 lines.
- `.claude/rules/i18n.md`, `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-bell-popover.spec.ts` green against the running app:
  - opening the bell renders a panel whose computed `width` is `420px`, `border-radius` `16px`,
    and whose `box-shadow` equals the resolved `--shadow-xl`;
  - with ≥1 unread, the `NEW` badge shows the real `meta.unreadCount` from the same response;
    with 0 unread the badge is absent from the DOM;
  - an unread row's `background-color` equals the resolved `--color-secondary` (`#EFF5FF`) and a
    read row's is transparent;
  - the tile tint for a `testResults` row equals `--color-brand-100`, and for a read row equals
    `--color-muted` — asserted against the row's REAL category from the API response;
  - activating an unread row issues the real `PUT /api/notifications/:id/read` (200) and, after
    `page.reload()`, that row is read in the feed too;
  - `Escape` closes the popover and focus returns to the bell trigger;
  - the footer link navigates to `/en/dashboard/notifications`.
- `notification-feed.spec.ts` still green.
- Motion: panel `animation-name` non-`none` on open, `none` under reduced motion.
- 375px + 1280px: at 375px the panel is width-capped to the viewport minus the gutter and does not
  cause horizontal scroll (assert `scrollWidth <= clientWidth` with the panel open).
- axe zero serious/critical with the popover OPEN.
- Six catalogs key-identical (+1 key each).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `w-[`, `p-[`.

## Assumptions

- The topbar and the bell trigger are owned by W4 task **121**; this task changes only the panel.
  The design's absolute anchor (`top:60px; right:96px`) is expressed as
  `align="end" sideOffset={8}` on the W1 popover, never as absolute coordinates.
- 17px `text-panel-title` for a 16.5px design value and `rounded-xl` (12px) for an 11px radius are
  deliberate 0.5px/1px token snaps per `04-ds-foundations.md` §J(b); both are recorded, not hidden.

## Evidence

<!-- filled in as the task runs -->
