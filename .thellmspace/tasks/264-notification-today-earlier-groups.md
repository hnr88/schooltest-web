---
id: 264
title: Group the feed into the design's TODAY / EARLIER sections with the 12px uppercase group header
layer: ui
kind: implement
slice: Feed grouping + group header — two sections, not one per calendar day
target: src/modules/notifications/lib/notification-grouping.ts, src/modules/notifications/components/NotificationDayHeading.tsx, src/modules/notifications/components/NotificationFeedList.tsx, src/i18n/messages/*.json, tests/e2e/notification-groups.spec.ts
contract: C-NOTIF-LIST (.qa/CONTRACTS.md:190-191)
design: .qa/design/screens/portal--notifications.html L12, L24; .qa/design/spec/03-portal-forms.md#51-notification-feed--portal-canonical (group header)
status: TODO
depends_on: [006, 262]
---

## Objective

`groupNotificationsByDay` (`lib/notification-grouping.ts:20-45`) emits one group per calendar day,
rendered by `NotificationDayHeading` as `Today` / `Yesterday` / a medium date beside a `Separator`.
The design has exactly **two** groups — `Today` and `Earlier` — with an uppercase tracked eyebrow
and no separator rule. Recut the grouping and the header.

## Contract

`.qa/CONTRACTS.md:190-191` — `C-NOTIF-LIST` returns items ordered by the server; grouping is
purely client-side over `createdAt`. No request change.

## Design source

`.qa/design/screens/portal--notifications.html` L12 and L24 — the two headers are identical:

```
font-size:12px; font-weight:600; letter-spacing:.06em; text-transform:uppercase;
color:#9AA6B8; padding:20px 0 4px
```
Literals: `Today` (L12) and `Earlier` (L24). Only these two groups exist in the export.

Build with: `pt-5 pb-1 text-xs font-semibold tracking-overline uppercase text-portal-muted`
(`tracking-overline` = `.06em` already exists in `globals.css:63`). **Contrast:** the design's
`#9AA6B8` is 2.9:1 on white and fails WCAG AA for this 12px text; re-ink to
`--color-portal-muted` (`#7C8698`, 4.63:1) exactly as `settings.constants.ts` already documents
for `--muted-foreground`, and record the delta. No `Separator` — the design has none.

Group boundary (`03-portal-forms.md` `UNKNOWNS 12`: "The cutoff rule (midnight? rolling 24h?) is
not given"). Resolve it as **local calendar midnight**, which is what the existing
`startOfDay`/`getDayOffset` helpers already compute: `dayOffset === 0` → `Today`,
`dayOffset >= 1` → `Earlier`. Record the resolution. Do not add a third group.

Order: `Today` first, `Earlier` second; within a group the server order is preserved. A group with
zero items renders nothing at all (no empty header).

Motion: the group header is static. When a filter (task 267) empties a group, the section unmounts
— give the section `animate-in fade-in-0 duration-150 ease-out-quart motion-reduce:animate-none`
so it does not pop.

## Files

- `src/modules/notifications/lib/notification-grouping.ts` — replace `groupNotificationsByDay`
  with `groupNotificationsByRecency(notifications, now): NotificationRecencyGroup[]` where
  `key: 'today' | 'earlier'`. Keep `getDayOffset` and `startOfDay` (they are tested and reused);
  keep the file pure.
- `src/modules/notifications/components/NotificationDayHeading.tsx` — rename to
  `NotificationGroupHeading.tsx`, drop the `Separator` and the `Eyebrow` primitive if its ink or
  size does not match, render the exact type spec above.
- `src/modules/notifications/components/NotificationFeedList.tsx` — iterate the two groups.
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Notifications.earlier` is NEW; `Notifications.today`
  exists; `Notifications.yesterday` becomes unused — delete it from all six only after grepping
  `src/` and `tests/` for it.
- `tests/e2e/notification-groups.spec.ts` — new.
- `tests/unit/notification-grouping.test.ts` — update if it exists.

## Depends on

- **262** — rows must already be hairline rows inside the single card, otherwise the group header's
  `20px 0 4px` rhythm cannot be verified.

## Steps

1. Grep `Notifications.yesterday` and `groupNotificationsByDay` across `src/` and `tests/`.
2. Rewrite the grouping helper (pure, no `Intl`), preserving stable ordering.
3. Rebuild the heading component to the exact type spec.
4. Update the list; render nothing for an empty group.
5. i18n: add `earlier` to all six catalogs; remove `yesterday` from all six if unreferenced.
6. Spec.

## Project rules

- `.claude/rules/module-pattern.md` — grouping stays a pure helper in `lib/`; the component only
  renders.
- `.claude/rules/tailwind.md` — no arbitrary values; `tracking-overline` is the existing token.
- `.claude/rules/quality.md` — the group header is not a heading element unless it is a real
  section label: render `<h2 class="sr-only">`-free markup as a `<div role="presentation">`? No —
  use a real `<h2>` inside each `<section aria-labelledby>` so the feed is navigable by heading,
  and style it with the eyebrow type. One `<h1>` per page stays the page title.
- `.claude/rules/i18n.md` (six catalogs), `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean; `pnpm test --run` green.
- `tests/e2e/notification-groups.spec.ts` green against the running app:
  - at most two group headings exist, and their texts are exactly `t('today')` and `t('earlier')`;
  - a notification created during the test (real domain event, as `notification-feed.spec.ts:100`)
    appears under `Today`, and after `page.reload()` it is still under `Today`;
  - every row whose `<time datetime>` parses to a date before local midnight sits under `Earlier`
    — computed from the real API response inside the test;
  - the heading's computed `font-size` = `12px`, `letter-spacing` = `0.72px` (.06em at 12px),
    `text-transform` = `uppercase`, `padding` = `20px 0px 4px`;
  - no `Separator` element inside the feed card.
- `notification-feed.spec.ts` still green (it asserts on a real notification appearing in the feed).
- Motion: the section's `animation-name` is non-`none` on mount, `none` under reduced motion.
- 375px + 1280px: no horizontal scroll; the header stays on one line at 375px.
- axe zero serious/critical; heading order valid (h1 → h2).
- Six catalogs key-identical (+1 `earlier`, −1 `yesterday` if removed — the totals must match
  across all six).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`.

## Assumptions

- Local calendar midnight is the Today/Earlier boundary (spec `UNKNOWNS 12` is open). The user's
  browser timezone is the reference, as it already is in `getDayOffset`.

## Evidence

<!-- filled in as the task runs -->
