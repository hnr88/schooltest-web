---
id: 263
title: Ship the design's three-tier notification timestamp — relative hours, weekday name, then D MMMM
layer: frontend
kind: implement
slice: The `2 hours ago` / `Monday` / `12 July` timestamp on every notification row and preview
target: src/modules/notifications/lib/notification-timestamp.ts, src/modules/notifications/components/NotificationFeedItem.tsx, src/modules/notifications/components/NotificationPreviewItem.tsx, src/i18n/messages/*.json, tests/e2e/notification-timestamp.spec.ts
contract: C-NOTIF-LIST (.qa/CONTRACTS.md:190-191)
design: .qa/design/screens/portal--notifications.html L19; .qa/design/spec/03-portal-forms.md#7-data-inventory (row timestamp)
status: TODO
depends_on: [262]
---

## Objective

The row currently prints `format.dateTime(createdAt, { dateStyle: 'medium', timeStyle: 'short' })`
— "12 Jul 2026, 09:14". The design prints a **three-tier relative timestamp**. Implement the tier
rule as a pure helper, render it in both the feed row and the bell preview row, and translate the
relative strings in all six catalogs.

## Contract

`.qa/CONTRACTS.md:190-191` — the only input is the item's `createdAt` (ISO 8601, validated by
`schemas/notification.schema.ts:22`). No new request, no new field, no server change.

## Design source

`.qa/design/spec/03-portal-forms.md` §7.1:

> | Notifications | row timestamp | `2 hours ago` / `Monday` / `12 July` | relative <7d → weekday
> <7d → `D MMMM` | `createdAt` vs now |

and §5.1:

> Timestamp formatting is **three-tier**: relative hours (`2 hours ago`) → weekday name
> (`Monday`) → absolute `D Month` (`12 July`).

Resolved tier rule (the design shows the three outputs; the boundaries are stated as `<7d` and are
made exact here so the helper is testable):

| Tier | Condition on `now - createdAt` | Output | Source example |
|---|---|---|---|
| 1 | `< 60 min` | `t('time.minutesAgo', { count })` — `5 minutes ago` | `app--notifications.html` row 1 |
| 2 | `< 24 h` **and** same calendar day or previous <24h | `t('time.hoursAgo', { count })` — `2 hours ago` | `portal--notifications.html` "Today" rows |
| 3 | `< 7 days` | weekday name via `format.dateTime(date, { weekday: 'long' })` — `Monday` | "Earlier" row 1 |
| 4 | otherwise | `format.dateTime(date, { day: 'numeric', month: 'long' })` — `12 July` | "Earlier" rows 2-3 |

Tier 4 drops the year, exactly as the design does. That is correct for the current year and
ambiguous across years — add a fifth tier `>= 365 days` → `{ day:'numeric', month:'long', year:
'numeric' }` and record it as the one authored addition (the design has no old-notification
example). Never invent an "in X" future branch: `createdAt` is server-set and never future; if it
is, fall through to tier 4 rather than printing a negative count.

Type/colour of the rendered element is owned by task 262 (`mt-1.25 text-xs text-portal-muted`).
The `<time dateTime={createdAt}>` element and its machine-readable attribute stay — the relative
string is the accessible label, the ISO value is the machine value.

Motion: none. This is a text swap.

## Files

- `src/modules/notifications/lib/notification-timestamp.ts` — new pure helper
  `getNotificationTimeTier(createdAt: string, now: Date): { tier: 'minutes'|'hours'|'weekday'|'date'|'dated'; count?: number }`.
  No `next-intl` import in `lib/` — it returns a tier + count, the component formats.
- `src/modules/notifications/components/NotificationFeedItem.tsx` — render via the helper +
  `useFormatter()` / `useTranslations('Notifications')`.
- `src/modules/notifications/components/NotificationPreviewItem.tsx` — same helper, same output
  (the bell popover shows `5 minutes ago` in `app--notifications.html` L17-21).
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — new keys under `Notifications.time`:
  `minutesAgo` (ICU plural), `hoursAgo` (ICU plural), `justNow`. Identical key shape in all six.
- `tests/unit/notification-timestamp.test.ts` — table-driven unit test of the tier boundaries
  (unit tests do NOT count as the proof — see D-VERIFY-1 — but the boundary maths deserves one).
- `tests/e2e/notification-timestamp.spec.ts` — new.

## Depends on

- **262** — the row's `<time>` element and its type/colour are defined there.

## Steps

1. Write the failing unit test first (`.claude/rules/testing.md` TDD): boundaries at 59 min,
   60 min, 23 h 59 m, 24 h, 6 d 23 h, 7 d, 364 d, 365 d.
2. Implement the helper as pure arithmetic on `Date` — no `Intl` inside `lib/`.
3. Render in both components with `useNow()` (already used by `NotificationFeedList`) so the
   relative value is stable inside a render pass and re-renders on the next-intl clock tick.
4. Add the six catalogs' keys with ICU plurals (`{count, plural, one {# minute ago} other {# minutes ago}}`
   shape in en; correct plural categories per locale — zh/ko/th/vi/ms are `other`-only, so their
   ICU must still declare `other` and must not carry an English `one` branch).
5. Spec.

## Project rules

- `.claude/rules/module-pattern.md` — pure utilities in `lib/`, no business logic in components,
  the component's only job is `t()` + `format`.
- `.claude/rules/i18n.md` — never hardcode a user-facing string; **all six catalogs identical in
  key shape**; ICU plurals for counts.
- `schooltest-web/CLAUDE.md` §5 pitfall 21 — `Date.now()` is non-deterministic; this renders in a
  Client Component (`'use client'` already present) so no `connection()` is needed, but do not
  call `new Date()` at module scope.
- `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean; `pnpm test --run` green including the new unit table.
- `tests/e2e/notification-timestamp.spec.ts` green against the running app:
  - reads the real `GET /api/notifications` response in the same test, takes each item's
    `createdAt`, computes the expected tier client-side from the SAME rule, and asserts the
    rendered `<time>` text matches — i.e. the assertion is derived from real server data, not from
    a hardcoded string;
  - asserts `<time>`'s `datetime` attribute still equals the raw ISO `createdAt`;
  - a notification created inside the test (trigger a real domain event exactly as
    `notification-feed.spec.ts:100` does — add a child) renders a tier-1/2 string
    (`minutes ago` / `hours ago`), never an absolute date.
- `notification-feed.spec.ts` and `notification-dead-link.spec.ts` still green.
- Six catalogs key-identical, +3 keys each (1151 → 1154); assert via `tests/e2e/helpers/i18n.ts`.
- 375px + 1280px unchanged (text-only change) — no horizontal scroll.
- axe zero serious/critical.
- Zero banned-pattern grep hits: `any`, hardcoded English in `.tsx`, `new Date()` at module scope.

## Assumptions

- `useNow()` from next-intl is already the clock source in this module
  (`NotificationFeedList.tsx:21`); reuse it rather than introducing a second time source.
- The `>= 365 days` year-bearing tier is an authored addition (the design has no example). It is
  recorded here, not silently added.

## Evidence

<!-- filled in as the task runs -->
