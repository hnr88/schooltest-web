---
id: 262
title: Rebuild the notification row to the design — 40px glyph tile, hairline rows, and the unread/read tile+dot state pair
layer: ui
kind: implement
slice: One notification row: glyph tile, title/body/time stack, unread dot, hairline, and the read⇄unread state transition
target: src/modules/notifications/components/NotificationFeedItem.tsx, src/modules/notifications/components/NotificationFeedList.tsx, src/modules/notifications/lib/notification-display.ts, src/modules/notifications/constants/notification.constants.ts, tests/e2e/notification-row.spec.ts
contract: C-NOTIF-LIST (.qa/CONTRACTS.md:190-191)
design: .qa/design/screens/portal--notifications.html L14-L22; .qa/design/spec/03-portal-forms.md#51-notification-feed--portal-canonical (row + row states)
status: TODO
depends_on: [001, 006, 007, 010, 013, 261]
---

## Objective

`NotificationFeedItem.tsx` currently draws a bordered rounded tile per notification with a
category chip line and an inline "Mark as read" button. The design draws **flat hairline-separated
rows inside one card**: a 40×40 semantic glyph tile, a three-line text stack, and an 8px dot that
stays in the layout as a transparent spacer when read. Rebuild the row to that, keeping every
piece of real data the row carries today.

## Contract

`.qa/CONTRACTS.md:190-191` — `C-NOTIF-LIST` items are the fields validated by
`schemas/notification.schema.ts:12-23`: `documentId`, `eventType`, `category` (one of `account`,
`security`, `children`, `testActivity`, `testResults`), `title`, `body: string|null`, `priority`,
`readAt: iso|null`, `linkUrl: string|null`, `createdAt`, `updatedAt`.

Preserve: `data-slot="notification-item"`, `data-notification-id`, `data-read` (used by
`notification-feed.spec.ts`); `isUnread = notification.readAt === null`; the `sr-only`
`t('unread')` announcement; the category label `t('categories.<category>')`.

## Design source

`.qa/design/screens/portal--notifications.html` L14-L22 — copy these values:

```
row   : display:flex; align-items:flex-start; gap:16px; padding:17px 0;
        border-bottom:1px solid #EEF1F6
glyph : width:40px; height:40px; border-radius:12px; display:grid; place-items:center;
        flex:none; font-size:13px; font-weight:700; background:<iconBg>; color:<iconFg>
body  : flex:1; min-width:0
  title : font-size:14.5px; font-weight:600; color:#0E2350
  text  : font-size:13px;   color:#7C8698; margin-top:2px; line-height:1.5
  time  : font-size:12px;   color:#9AA6B8; margin-top:5px
dot   : width:8px; height:8px; border-radius:999px; background:<dot>;
        flex:none; margin-top:6px
```

Row states (`03-portal-forms.md` §5.1 "Row states"):

| State | `iconBg` | `iconFg` | `dot` |
|---|---|---|---|
| unread | `#0E2350` `bg-navy-900` | `#FFFFFF` `text-card` | `#2563EB` `bg-primary` |
| read | `#EEF1F6` `bg-portal-line` | `#0E2350` `text-navy-900` | `transparent` |

> "The read state keeps the 8px dot in the layout as a **transparent spacer** … Do not
> `display:none` it." (`03-portal-forms.md` §5.1)

Utilities: `flex items-start gap-4 py-4.25 border-b border-portal-line last:border-b-0`
(17px → `py-4.25`; the design keeps the last hairline and follows it with the card's
`pt-1.5 pb-3.5` spacer from task 261 — reproduce the design, i.e. keep `border-b` on the last row
and let the spacer follow); glyph `size-10 rounded-xl grid place-items-center shrink-0 text-caption
font-bold`; title `text-lede font-semibold text-navy-900`; body `mt-0.5 text-caption leading-normal
text-portal-muted` (13px `text-caption`, line-height 1.5); time `mt-1.25 text-xs text-portal-faint`;
dot `size-2 rounded-full shrink-0 mt-1.5`.

**The glyph is a 1-2 character text token, not an icon** (`03-portal-forms.md` §5.1: `B1`, `!`,
`A`, `$`, `5`). `UNKNOWNS 11` records that the design states no rule mapping a notification to its
glyph. Do **not** invent per-notification glyphs from body text. The honest mapping is the one
piece of real data the row has: `category`. Keep `NotificationCategoryIcon` (lucide, `size-5`,
`aria-hidden`) inside the 40×40 tile and drop `getNotificationTileClass`'s five-colour palette in
favour of the design's two-state pair above — the tile's meaning is now read/unread, and the
category is already stated in words by the meta line. Record this decision in Evidence.

Motion (`03-portal-forms.md` §A.4 lists the read transition as NOT in the design, so it is
authored per `.qa/DECISIONS.md` **D-DESIGN-3**):
- tile: `transition-colors duration-200 ease-out-quart` (the §I.1 documented colour exception);
- dot: `transition-[transform,opacity] duration-200 ease-out-quart`, unread `scale-100 opacity-100`,
  read `scale-0 opacity-100` with `bg-transparent` — the box keeps its 8px slot either way;
- both carry `motion-reduce:transition-none`.

## Files

- `src/modules/notifications/components/NotificationFeedItem.tsx` — rebuild. ≤120 lines.
- `src/modules/notifications/components/NotificationFeedList.tsx` — the list is now a plain `<ul>`
  with no per-row gap (`flex flex-col`, hairlines do the separating); the day sections keep their
  structure for task 264.
- `src/modules/notifications/lib/notification-display.ts` — replace `CATEGORY_TILE_CLASSES` with
  `getNotificationTileClass(isUnread: boolean)`; keep the file a pure helper (no JSX).
- `src/modules/notifications/constants/notification.constants.ts` — row class constants if reused.
- `tests/e2e/notification-row.spec.ts` — new.

## Depends on

- **261** — the row lives inside the 24px card with `px-7`; the hairline must run edge-to-edge
  inside that padding, which only holds once 261 has set the card's box.

## Steps

1. Read `tests/e2e/notification-feed.spec.ts` first and list every selector it uses against a row
   (`data-slot`, `data-read`, `data-notification-id`, the mark-read button, the `sr-only` text).
   Those are contract for this task.
2. Rebuild the row markup to the table above; keep `<li><article>` semantics and the `min-w-0`
   on the text column so long titles wrap instead of pushing the dot out.
3. Swap the tile palette to the two-state pair; delete the dead category palette.
4. Wire the motion + reduced-motion variants.
5. Keep the mark-read affordance where it is for now — task 265 owns its final form.
6. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 3, 11, 14, 15.
- `.claude/rules/tailwind.md` — no arbitrary values; animate transform/opacity (the tile's
  `background-color` transition is the §I.1 documented exception); exponential easing.
- `.claude/rules/module-pattern.md` — pure helpers in `lib/`, class constants in `constants/`,
  component ≤120 lines.
- `.claude/rules/quality.md` — never `<div onClick>`; the row's interactive parts stay real
  `<button>`/`<a>`; 4.5:1 body contrast (`#7C8698` on `#FFFFFF` is 4.63:1 — passes; `#9AA6B8` on
  white is 2.9:1 and **fails**, so the 12px timestamp must be re-inked to `--color-portal-muted`
  (`#7C8698`) and the delta recorded, exactly as `settings.constants.ts` already does for
  `--muted-foreground`).
- `.claude/rules/i18n.md`, `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-row.spec.ts` green, asserting against a real feed row:
  - glyph tile computed `width`/`height` = `40px`, `border-radius` = `12px`;
  - an unread row's tile `background-color` equals the resolved `--color-navy-900` and its dot
    equals `--color-primary`;
  - a read row's tile equals `--color-portal-line` and its dot has `opacity`/`transform` scaled to
    0 **while still occupying an 8px box** (`boundingBox().width === 8`);
  - row computed `padding-top`/`padding-bottom` = `17px` and `border-bottom-width` = `1px`;
  - title computed `font-size` = `14.5px`, `font-weight` = `600`.
- `notification-feed.spec.ts` (both tests, including the mobile one) still green unchanged.
- Motion: toggling a row to read animates the tile colour over `200ms`; with
  `emulateMedia({ reducedMotion: 'reduce' })` the computed `transition-duration` is `0s`/`0.01ms`.
- 375px + 1280px: no horizontal page scroll; at 375px a 60-character title wraps to at most 3
  lines and the dot stays on the first line.
- axe zero serious/critical on the route.
- Six catalogs key-identical.
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `w-[`, `<div onClick`.

## Assumptions

- W0 emitted `--color-portal-line` (`#EEF1F6`) and `--color-portal-muted` (`#7C8698`). If it kept
  only the existing `--color-divider` (`oklch(0.9595 0.008 253.85)`, `#EEF2F7`), use that and
  record the 1-unit delta rather than hardcoding a hex.
- The design's per-item glyph literals (`B1`, `!`, `$`) are not derivable from the API (spec
  `UNKNOWNS 11`); the category icon is the honest substitute and is NOT a design deviation to be
  "fixed" later by fabricating glyphs.

## Evidence

<!-- filled in as the task runs -->
