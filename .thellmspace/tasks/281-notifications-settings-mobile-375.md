---
id: 281
title: Compose notifications and settings at 375px — the mobile rules the design never wrote
layer: ui
kind: implement
slice: The 375px composition of the notification feed, the bell panel and the four settings surfaces
target: src/modules/notifications/components/*, src/modules/settings/components/*, src/modules/notifications/constants/notification.constants.ts, tests/e2e/notifications-settings-mobile.spec.ts
contract: C-NOTIF-LIST, C-PREF-GET, C-PREF-UPDATE (.qa/CONTRACTS.md:190-196)
design: .qa/design/spec/03-portal-forms.md#responsive; .qa/design/screens/portal--notifications.html L3; .qa/design/screens/portal--settings.html L3; .qa/design/screens/app--notifications.html L12
status: TODO
depends_on: [125, 267, 270, 271, 279, 280]
---

## Objective

`03-portal-forms.md` RESPONSIVE is explicit: "**There is not a single `@media` query in either
source export** … All breakpoints are an engineering decision." This task makes that decision once,
for both W9 surfaces, and proves it — instead of leaving each earlier task to guess.

## Contract

`.qa/CONTRACTS.md:190-196` — no request changes. Everything here is layout; every data path already
proved by tasks 261-280 must still hold at 375px (the same assertions, re-run narrow).

## Design source

What the export actually gives us (`03-portal-forms.md` RESPONSIVE table):

| Surface | Rule present in the design | Consequence at 375px |
|---|---|---|
| Settings + Notifications columns | `max-width:820px` (L3 both) | already measure-capped; only the gutter and the row internals need decisions |
| Text blocks in rows | `flex:1; min-width:0` (notif L16, settings L29) | truncation/wrapping already enabled — keep it |
| Rows | `gap:16px` between text and trailing control | keeps badges off the text when narrow — keep it |
| Chip rows | `display:flex; flex-wrap:wrap` (settings L19) | the export's ONLY narrow-width tolerance — the filter chips (267) and language chips (274) inherit it |
| App notification panel | fixed `width:420px` (app L12) | **must** be capped to the viewport on mobile |
| Portal shell | `max-width:1600px; height:100vh`, `main` owns `overflow-y:auto` | the page never scrolls at page level |

The authored decisions (record all of them):

1. **Page gutter**: `px-4` at <640px, `px-6` at ≥640px, `px-8` at ≥1024px (the existing screens
   already use this ladder — keep it, do not invent a new one).
2. **Card gutter**: the portal card's `px-7` (28px) drops to `px-4.5` (18px) below `sm` so a 375px
   viewport keeps ≥311px of measure. The card radius stays 24px.
3. **Feed row**: stays a single row — glyph tile (40px) + text + dot fits 375px
   (`375 − 32 gutter − 36 card padding − 40 tile − 16 gap − 8 dot − 16 gap = 227px` of text
   measure). Title wraps to at most 3 lines; body clamps to 2 lines with `line-clamp-2`.
4. **Feed header**: the mark-all action wraps under the title block (`flex-wrap` + `items-end`);
   it must not shrink below a 44px target.
5. **Filter chips (267)**: wrap; the row never scrolls horizontally.
6. **Bell panel (271)**: `w-105` becomes `w-[min(...)]`-free via
   `w-full max-w-105 sm:w-105` plus the popover's collision padding, so at 375px it is the
   viewport minus the 16px gutter each side.
7. **Settings tab strip (272)**: scrolls horizontally INSIDE itself (`overflow-x-auto`), never the
   page — the behaviour `notification-preferences.spec.ts:161-164` already asserts.
8. **Preference two-column grid (279)**: collapses to one column below `lg` — already the case;
   verify the push card and the digest card are not orphaned mid-column.
9. **Account card (273)**: avatar + name row stays horizontal; the ghost action moves to its own
   line below at <480px.
10. **Toggle rows (276/277)**: label wraps, the 46×27 switch never shrinks (`shrink-0`).

Motion at 375px is identical — no motion is disabled for width, only for
`prefers-reduced-motion`.

## Files

- Touch only the class strings of the components listed in `target`; **no logic, no props, no
  queries** change in this task. If a layout fix needs a prop, it belongs to the task that owns
  that component.
- `src/modules/notifications/constants/notification.constants.ts` /
  `src/modules/settings/constants/settings.constants.ts` — hold any shared responsive class string.
- `tests/e2e/notifications-settings-mobile.spec.ts` — new.

## Depends on

- **267, 270, 271, 279, 280** — the terminal surfaces of both halves of the wave. Composing before
  they land would be re-work.
- **125** — W4's "shell at 375" pass. The frame, top row and mobile drawer are W4's; this task
  composes only what is INSIDE the main column. If the page scrolls horizontally because of the
  frame, that is a 125 defect, not this one — report it, do not patch it here.

## Steps

1. Screenshot every W9 surface at 375×800 BEFORE any change into `.qa/screenshots/w9-mobile-before/`.
2. Apply the ten decisions above.
3. Screenshot after; diff and record what changed.
4. Re-run every W9 spec with `page.setViewportSize({ width: 375, height: 800 })` added where it is
   not already there.
5. Check the two existing mobile assertions still pass:
   `notification-feed.spec.ts:212` ("notification feed stays usable at a mobile viewport") and
   `notification-preferences.spec.ts:158-167`.

## Project rules

- `.claude/rules/tailwind.md` — mobile-first utilities, no arbitrary values, no `@media` in CSS
  files (use Tailwind variants), 4pt-derived spacing.
- `.claude/rules/quality.md` — ≥44px targets at every width; no content clipped; no horizontal
  page scroll; visible focus at 375px too.
- `schooltest-web/CLAUDE.md` §0 law 1 (this task changes layout only), law 14, law 15.
- `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notifications-settings-mobile.spec.ts` green at **375×800** for
  `/dashboard/notifications` and all four `/dashboard/settings` tabs:
  - `document.documentElement.scrollWidth <= clientWidth` on every surface, including with the
    bell popover OPEN and with a select listbox open;
  - every interactive element's bounding box is ≥44×44 (enumerate
    `button, a, [role=switch], [role=tab], [role=radio], select, input` and assert);
  - the feed row's text column is ≥200px wide and the dot/tile do not overlap it;
  - the bell panel's width ≤ `viewport − 32px`;
  - the settings tab strip's own `scrollWidth > clientWidth` while the page's does not (i.e. it
    scrolls internally);
  - one real interaction still works narrow: mark a notification read and reload — it stays read;
    and toggle one preference, save, reload — it persists (both against the real API).
- The full W9 spec set plus `notification-feed.spec.ts`, `notification-preferences.spec.ts`,
  `notification-preference-controls.spec.ts`, `settings-tabs.spec.ts`, `push-subscription.spec.ts`
  all green.
- axe zero serious/critical at 375px on all five surfaces.
- Screenshots written to `.qa/screenshots/` for every surface at 375 and 1280.
- Six catalogs key-identical (no string changes expected).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `w-[`, `@media`.

## Assumptions

- 375px is the mission's narrow target (`.qa/PLAN.md` definition of done: "correct at 375px and
  1280px"); no intermediate breakpoint is specified, so the Tailwind `sm`/`lg` ladder already in
  use is kept rather than a new one being invented.

## Evidence

<!-- filled in as the task runs -->
