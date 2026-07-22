---
id: 277
title: Recut the category toggles and give the non-suppressible account/security rows a truthful locked state
layer: ui
kind: implement
slice: Settings → Notifications → "Updates to receive" (3 switchable) + "Always-on" (2 locked, server-enforced)
target: src/modules/notifications/components/NotificationPreferenceToggleGroup.tsx, src/modules/notifications/components/NotificationPreferenceLockedGroup.tsx, src/modules/notifications/constants/notification-preferences.constants.ts, src/i18n/messages/*.json, tests/e2e/notification-category-toggles.spec.ts
contract: C-PREF-GET, C-PREF-UPDATE (.qa/CONTRACTS.md:195-196), C-NOTIF-EVENTS (.qa/CONTRACTS.md:198-210)
design: .qa/design/screens/portal--settings.html L25-L36; .qa/design/spec/03-portal-forms.md#section-3--notifications-l25-36
status: TODO
depends_on: [031, 276]
---

## Objective

Deliver the second toggle group (`children`, `testActivity`, `testResults`) in the portal row
dialect, and render `account` / `security` as a **locked** group whose lockedness is a real server
fact, not a UI decision.

## Contract

`.qa/CONTRACTS.md:195-196` + the server's own whitelist
(`schooltest-api/.../notification-preference/services/notification-preference.ts`):

> `UPDATABLE_BOOLEAN_FIELDS` … the 4 channel toggles + the 3 SUPPRESSIBLE category toggles.
> `account`/`security` are deliberately ABSENT — their exclusion structurally encodes
> non-suppressibility (locked `true`).

`.qa/CONTRACTS.md:198-210` (`C-NOTIF-EVENTS`) confirms the behaviour end to end:

> A suppressed in-app preference retains the audit row but marks it read; **account/security
> events remain non-suppressible**.

So `account` and `security` are returned by `C-PREF-GET` (they are in `READ_FIELDS`) but can never
be written. The UI must state that, and must never send them (the PUT payload is frozen at the
eight writable keys — `notification-preferences.spec.ts:139-142`).

## Design source

The portal settings card has exactly four toggle rows and **no locked state at all**
(`03-portal-forms.md` §4.1 Section 3). The locked group is therefore authored from the design's own
row vocabulary plus the design-system's badge:

- Group heading: reuse the card's `h2` type — `16px / 600 / #0E2350`
  (`portal--settings.html` L26) for "Updates to receive" and for "Always-on updates".
- Group separation: `03-portal-forms.md` §4.2 / the DS sheets separate grouped settings inside one
  panel with a hairline above and 12px of air — `mt-5 border-t border-portal-line pt-5`.
- Locked row: the same `flex items-center gap-4 py-4 border-b border-portal-line` row, with the
  switch replaced by a **static state chip** rather than a disabled switch, so no user can tab to a
  control that cannot act: `text-overline font-semibold text-navy-900 bg-portal-line px-2.75 py-1
  rounded-full` — the design's own status-pill geometry (`03-portal-forms.md` §6.3 invoice pill:
  `11.5px / 600 / #0E2350; background:#EEF1F6; padding:4px 11px; border-radius:999px`), label
  `Settings.notificationPreferences.alwaysOn` ("Always on").
- Each locked row keeps its existing title/description keys
  (`categories.security.*`, `categories.account.*`) and the group's existing callout
  (`alwaysOnTitle` / `alwaysOnDescription`), which is already linked to the rows by
  `describedById` in `NotificationPreferenceToggle`.

Switchable category rows: identical geometry to task 276's channel rows (46×27 portal switch,
16px rows, 1px `#EEF1F6` hairlines).

Motion: rows inherit the 180ms switch motion from 276. The locked chip is static; the group mounts
with `animate-in fade-in-0 duration-180 ease-out-quart motion-reduce:animate-none`.

## Files

- `src/modules/notifications/components/NotificationPreferenceToggleGroup.tsx` — group heading +
  hairline separation (`divided`).
- `src/modules/notifications/components/NotificationPreferenceLockedGroup.tsx` — rewrite to the
  locked-row + chip form; it already receives the real `preferences` object, so the chip renders
  only when the server actually returns `account === true` / `security === true` — if the server
  ever returns `false`, render the real value rather than the word "Always on".
- `src/modules/notifications/constants/notification-preferences.constants.ts` —
  `NOTIFICATION_LOCKED_CATEGORIES` order stays `security`, `account`.
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` — `Settings.notificationPreferences.alwaysOn`
  (chip label) new in all six.
- `tests/e2e/notification-category-toggles.spec.ts` — new.

## Depends on

- **276** — the portal switch geometry and the row/card rhythm.

## Steps

1. Read `notification-preference-controls.spec.ts:140+` ("non-suppressible categories render locked
   and deferred digests are unselectable") and enumerate exactly what it asserts about the locked
   rows. Those assertions are the contract.
2. Recut the switchable group.
3. Rewrite the locked group as static rows + chips driven by the real `preferences` values.
4. Prove the server enforcement, not just the UI: `PUT /api/notification-preferences/me` with
   `{ security: false }` and show the response still has `security: true`.
5. Spec.

## Project rules

- `schooltest-web/CLAUDE.md` §0 law 1 (no extra controls), law 3, law 14, law 15.
- `.claude/rules/quality.md` — a control that cannot act must not be focusable; the locked state
  must be announced in text, not by colour alone; AA contrast on the chip
  (`#0E2350` on `#EEF1F6` = 12.5:1).
- `.claude/rules/state-data.md` — the form still submits only the eight writable keys.
- `.claude/rules/tailwind.md`, `.claude/rules/i18n.md`, `.claude/rules/module-pattern.md`,
  `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/notification-category-toggles.spec.ts` green against the running app:
  - exactly three `role="switch"` controls in the "Updates to receive" group, and **zero**
    focusable controls in the always-on group (`Tab` from the last category switch reaches the
    save button, not a locked row);
  - each locked row shows the `alwaysOn` chip and its title/description text;
  - toggling `Test results` off, saving, and reloading shows `aria-checked="false"` and a direct
    `GET /api/notification-preferences/me` returns `testResults: false` — then restore in a
    `finally` on the isolated parent from task 260;
  - **server enforcement:** a direct `PUT` with `{ security: false, account: false }` returns 200
    with `security: true, account: true` in the body, and the reloaded UI still shows both chips;
  - the save request body still has exactly the eight writable keys.
- **`notification-preference-controls.spec.ts` (3 tests) and `notification-preferences.spec.ts`
  (3 tests) pass unchanged.**
- Motion: group mount animation present; `none` under reduced motion.
- 375px + 1280px: rows keep their label/right-element layout, no horizontal scroll.
- axe zero serious/critical on the notifications tab.
- Six catalogs key-identical (+1 key each).
- Zero banned-pattern grep hits: `any`, raw hex, `text-[`, `p-[`, `disabled` on a `role="switch"`
  that is presented as locked (use a chip, not a disabled switch).

## Assumptions

- `account`/`security` always come back `true` from the seeded environment. The UI renders the real
  value, so a hypothetical `false` shows as `false` rather than being overwritten with "Always on".

## Evidence

<!-- filled in as the task runs -->
