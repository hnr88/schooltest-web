---
id: 121
title: Notification bell — the design's 44px white circle, keeping the real unread count
layer: ui
kind: build
slice: The shell's notification affordance in the top row (button skin + unread indicator)
target: src/modules/notifications/components/NotificationBell.tsx
contract: n/a for the skin; the unread count comes from the existing `GET /api/notifications` meta
design: .qa/design/screens/portal--main.html:17-20, .qa/design/spec/01-portal-dashboard.md#2-dashboard--top-bar-greeting-row
status: TODO
depends_on: ["118"]
---

## Objective

Re-skin the bell to the design's floating 44px white circle with the 18px bell glyph and the
7px unread pip, WITHOUT downgrading the real unread count the app already computes and announces.

## Contract

The skin is design-only. The data is existing and unchanged: `useNotificationsQuery({page:1,
pageSize: NOTIFICATION_PREVIEW_PAGE_SIZE})` → `meta.unreadCount` (real rows in Postgres, parent-scoped).

`.qa/design/spec/01-portal-dashboard.md` §2, verbatim (`portal--main.html:17-20`):

```
Notification button: width:44px; height:44px; border-radius:999px; background:#FFFFFF;
border:none; display:grid; place-items:center; cursor:pointer; position:relative;
box-shadow:0 1px 2px rgba(14,35,80,.05). Handler goNotifs.
Bell SVG 18×18, stroke:#3D4A5C, stroke-width:1.8.
Unread dot: position:absolute; top:10px; right:11px; width:7px; height:7px;
border-radius:999px; background:#2563EB; border:1.5px solid #fff. Always rendered — no
conditional in the markup.
```

**PRESERVED BEHAVIOUR:** the trigger keeps `data-slot="notification-bell"`, its
`Notifications.bellLabel` accessible name, and the popover preview panel with
`useNotificationActions()` mark-read wiring — `tests/e2e/notification-feed.spec.ts`,
`notification-dead-link.spec.ts` and `notification-mutation-error.spec.ts` all drive it. The
`CountBadge` with `Notifications.unreadCount` aria stays.

## Design source

| Property | Design value | Token / utility |
|---|---|---|
| size | `44×44` | `size-11` (already ships) |
| radius | `999px` | `rounded-full` (was `rounded-lg`) |
| surface | `#FFFFFF` | `bg-card` (was transparent) |
| shadow | `0 1px 2px rgba(14,35,80,.05)` | `--shadow-pill` (task 110) → `shadow-pill` |
| border | none | no border |
| glyph | 18×18, stroke-width 1.8 | `size-4.5` + `strokeWidth={1.8}` (was `size-5`) |
| glyph ink | `#3D4A5C` | **9.00:1** on white ✓ — no token exists for it; use `--color-body` (`#475569`, 7.58:1), the nearest published ink. Record the substitution. |
| unread pip | 7px, `#2563EB`, 1.5px white ring, at `top:10 right:11` | see below |

**Deviation, recorded and justified:** the design draws a BARE DOT with no number and no
conditional. The app already surfaces the real count and announces it
(`Notifications.unreadCount`, an ICU plural). A dot carries strictly less information and would
delete a working, accessible feature, so the **`CountBadge` stays**; it is restyled to sit at the
design's pip position (`-top-1 -right-1` today → keep, since a numeric badge cannot fit at
`top:10 right:11` inside a 44px circle) and keeps its `#DC2626`-family destructive fill. The
design's "always rendered" pip is NOT copied: the app renders the indicator only when
`unreadCount > 0`, which is correct behaviour and what the specs assert.

Motion: `transition-shadow duration-200 ease-out-expo motion-reduce:transition-none`, hover →
`--shadow-md`. When `unreadCount` transitions 0 → n, the badge enters with the design system's
`st-pop-in` (180ms, `--ease-out-quart`) → `animate-pop-in motion-reduce:animate-none`.

## Files

- `src/modules/notifications/components/NotificationBell.tsx` — the `PopoverTrigger` class string,
  the `Bell` icon size/stroke, and the `CountBadge` className. The popover content's classes,
  the query, the actions hook and the preview panel are untouched.

## Depends on

- **118** — the bell only reads as a floating white circle once the white bar behind it is gone.

## Steps

1. Read the three notification e2e specs first and list every selector they use against this
   component; none may change.
2. Apply the geometry table to the trigger: `size-11 rounded-full bg-card shadow-pill` +
   `hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
   transition-shadow duration-200 ease-out-expo motion-reduce:transition-none`.
3. `Bell` → `className="size-4.5" strokeWidth={1.8}`, ink `text-body`.
4. Add `animate-pop-in motion-reduce:animate-none` to the `CountBadge`.
5. `pnpm tsc --noEmit && pnpm lint`.
6. Extend `tests/e2e/notification-feed.spec.ts`'s existing first test (do not add a file) with a
   skin leg: the trigger computes `width/height: 44px`, `border-radius` ≥ 22px, `box-shadow`
   non-`none`, `border-width: 0px`; the bell `<svg>` is 18×18.

## Project rules

- `.claude/rules/module-pattern.md` — this component belongs to `notifications`, not `shell`; edit
  it in place, do not fork a shell copy.
- `.claude/rules/quality.md` — the count badge's aria text is the accessible announcement; never
  replace it with a decorative dot.
- `.claude/rules/tailwind.md` — no arbitrary values; exponential easing.
- `CLAUDE.md` §0 law 3 — the popover/mark-read wiring is functional behaviour: preserve it exactly.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/notification-feed.spec.ts tests/e2e/notification-dead-link.spec.ts tests/e2e/notification-mutation-error.spec.ts tests/e2e/shell.spec.ts tests/e2e/shell-a11y.spec.ts`
  ALL green.
- **Real-data proof:** with the seeded parent, the badge's rendered number equals the live
  `meta.unreadCount` from `GET /api/notifications` (assert against a direct API request in the same
  test), and after marking one notification read the number decrements and SURVIVES a page reload
  (the row changed in Postgres, not just in cache).
- New skin legs pass (44px circle, shadow, no border, 18px glyph).
- Motion: badge `animation-name` non-`none` when it appears; `none` under reduced motion; trigger
  transition `0.2s` → `0s` under reduced motion.
- 375px: the bell is visible in the row, target ≥44×44, popover opens within the viewport with no
  horizontal scroll.
- axe serious/critical = 0 at 1280 + 375 with the popover both closed and open.
- No new strings → six catalogs unchanged.

## Assumptions

- `--color-body` (`#475569`) substitutes the design's untokenised `#3D4A5C`; both clear AA on white
  (7.58:1 vs 9.00:1) and the design's hex exists in no token file (`01-portal-dashboard.md` §0
  marks it "—").

## Evidence

_(filled in as the task runs)_
