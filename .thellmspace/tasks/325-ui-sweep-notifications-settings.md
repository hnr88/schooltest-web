---
id: 325
title: UI sweep notifications and settings — feed, mark-read, all four settings tabs and push at 375 and 1280
layer: ui
kind: verify
slice: `/[locale]/dashboard/notifications` and `/[locale]/dashboard/settings` (tabs account, search, notifications, children)
target: src/modules/notifications/**, src/modules/settings/**, src/modules/auth/components/ChangePasswordForm.tsx, new spec tests/e2e/sweep-notifications-settings.spec.ts
contract: n/a for presentation; writes through `PUT /api/notifications/:documentId/read`, `POST /api/notifications/read-all`, `PUT /api/notification-preferences/me`, `PUT /api/search-preferences/me`, `POST|DELETE /api/push-subscriptions`, `POST /api/auth/change-password`
design: .qa/design/screens/portal--notifications.html, .qa/design/screens/portal--settings.html, .qa/design/spec/03-portal-forms.md
status: TODO
depends_on: ["320"]
---

## Objective

Sweep every interactive control in the notification feed and all four settings tabs at 375px and
1280px. This surface is almost entirely writes, so every control must be proven with a real
`2xx`, a visible update, a reload that keeps the change, and a real Postgres row. It also carries
the mission's one known pre-existing red (the SMS opt-out persistence defect, fixed by W9) and the
**B-8** refusal.

## Contract

Quoted from `.qa/intake/api-inventory.md`:

- **`GET /api/notifications` (#14)** — `page` ≥1 (default 1), `pageSize` 1..100 (default 20),
  `read` must be the literal `"true"`/`"false"` else `400 'read must be "true" or "false"'`,
  `category` ∈ `account, security, children, testActivity, testResults` else `400`,
  `eventType` free-form `$eq`. Success `200` with `meta.pagination` **and** `meta.unreadCount`
  (the caller's TOTAL unread, independent of filters). Rows are exactly the ten-key whitelist —
  `emailSent*/smsSent*/pushSent*/smsBlockedReason/data/user` are NEVER exposed.
- **`PUT /api/notifications/:documentId/read` (#17)** — unknown ⇒ `404 "Notification not found"`;
  foreign ⇒ `403 "This notification does not belong to you"`; already-read returns its ORIGINAL
  `readAt` with no re-write. Success `200` BARE `{ data: { documentId, readAt } }`.
  **DB effect:** conditional UPDATE of one `notifications.read_at`.
- **`POST /api/notifications/read-all` (#16)** — capped at **100 per call**; success `200` BARE
  `{ data: { updated: <int> } }`; zero unread ⇒ `{ data: { updated: 0 } }`, never a 404.
- **`GET|PUT /api/notification-preferences/me` (#18/#19)** — FLAT JSON (no `{ data }` envelope).
  Writable whitelist: `emailEnabled, smsEnabled, inAppEnabled, pushEnabled, children,
  testActivity, testResults` + `digestFrequency ∈ immediate|daily|weekly|off`.
  `account` and `security` are deliberately **absent from the whitelist** (structurally
  non-suppressible). Unknown keys are silently IGNORED (not a 400). Success `200` BARE
  `{ data: NotificationPreferenceView }` — no `meta`. Errors `400 "<field> must be a boolean"` /
  `"digestFrequency must be one of: …"`; `403`. **DB effect:** one `notification_preferences` row.
- **`GET /api/push-subscriptions/vapid-public-key` (#20)** — `200 { data: { publicKey: string|null } }`;
  `null` honestly reports unconfigured VAPID.
- **`POST /api/push-subscriptions` (#21)** — STRICT body `endpoint` 1..2048, `keys.{p256dh,auth}`
  1..255, optional `expirationTime`, `userAgent`; upsert **by the globally-unique `endpoint`**;
  a row owned by ANOTHER user ⇒ `403 "You cannot manage this push subscription"` — never
  reassigned, owner never disclosed. `200 { data: { documentId, endpoint } }`.
- **`DELETE /api/push-subscriptions` (#22)** — `{ endpoint }` in the DELETE body (or `?endpoint=`);
  deletes at most one row matched by BOTH endpoint AND caller; `200 { data: { deleted: 0|1 } }`,
  idempotent.
- **`POST /api/auth/change-password` (#25)** — parent-only grant; stock behaviour (400 on wrong
  current password or an unchanged new password); on 200 it fires a `security_password_changed`
  notification. **DB effect:** UPDATE `up_users.password` + INSERT one `notifications` row.
- **`GET|PUT /api/search-preferences/me` (#12/#13)** — STRICT partial; unknown key ⇒ `400`.

**BLOCKED, quoted verbatim from `.qa/CONTRACTS.md` § BLOCKED:**

> **B-8** | Per-child unread notification count | `portal--notifications.html` | `unread-count`
> is a single global scalar and the feed deliberately withholds `studentDocumentId` (gap **G13**).

**Pre-existing red owned by W9** (`.qa/PLAN.md` regression baseline):
`notification-preference-controls.spec.ts:75` — after writing both opt-outs off and reloading,
the "Text messages" switch still reports `aria-checked="true"`. This sweep must confirm it is
**green** and must not mask it.

## Design source

`.qa/design/screens/portal--notifications.html` + `portal--settings.html`, digested in
`.qa/design/spec/03-portal-forms.md`:

- Switch (`04-ds-foundations.md#5.7`): track `width:40px; height:22px; border-radius:999px;
  transition: background .18s`; knob `width:18px; height:18px; border-radius:50%;
  background:#FFFFFF; box-shadow:0 1px 3px rgba(14,35,80,.25); transform: translateX(18px)
  when on; transition: transform .18s`. → authored at `var(--duration-switch, 180ms)
  var(--ease-out-quart)` for both.
- Tabs (`05-ds-components.md:246`): `padding:0 2px 12px; font-size:14px; font-weight:600;
  border-bottom:2px solid; transition: color .15s`; active border `--color-primary`.
- Feed row: base card shell `border:1px solid #E3E8F0` → `--color-border`,
  `border-radius:16px` → `--radius-panel`, `padding:22px`; unread dot `#2563EB` →
  `--color-primary`; timestamp `#9AA6B8` → `--color-muted-foreground-soft`, `12.5px`.
- Alert dismiss button (`04-ds-foundations.md:472`): `width:26px; height:26px;
  border-radius:7px; color:#94A3B8`, hover `background:#F1F5F9; color:#475569`,
  `aria-label="Dismiss"` — **the 26px box must be padded to a ≥44×44 hit area** (task 331).
- Toast: `st-toast-in` 250ms — `from { opacity:0; transform:translateY(12px) }`, bottom-right
  `right:24px; bottom:24px`, auto-dismiss 4000ms.
- Motion: switches 180ms, tabs 150ms, feed rows enter with `st-fade-in` 180ms, toast 250ms;
  all with a `prefers-reduced-motion: reduce` variant collapsing to `0.01ms` and no translate.

## Files

- `tests/e2e/sweep-notifications-settings.spec.ts` (new)
- Fix-in-place authority: `src/modules/notifications/**`, `src/modules/settings/**`,
  `src/modules/auth/components/ChangePasswordForm.tsx`,
  `src/app/[locale]/dashboard/{notifications,settings}/**`
- `src/i18n/messages/{en,zh,ko,ms,vi,th}.json` if a string is missing
- Never `src/components/ui/**`

## Depends on

- **320** — the shell wraps both routes (and the topbar bell is the feed's entry point).
- Wave gate (prose): **all of W9 (Notifications + settings, ids 260-283)** must be DONE —
  including the SMS opt-out persistence fix.

## Steps

1. Log in with `loginAsParent`; open `/dashboard/notifications` at 1280×800. Capture
   `GET /api/notifications` → `200`; assert the rendered row count === `data.length` and the
   bell badge === `meta.unreadCount`.
2. **Mark-read write proof:** click an unread row's mark-read control, assert
   `PUT /api/notifications/<documentId>/read` → `200` with a real `readAt`, the row's unread dot
   disappears, the badge decrements to the new `meta.unreadCount`, then **reload** and assert it
   is still read. Prove with `runSql`: `select read_at from notifications where document_id = …`
   is non-null.
3. **Mark-all write proof:** click "mark all read", assert `POST /api/notifications/read-all` →
   `200 { data: { updated: n } }` where `n` matches the number of previously-unread rows; assert
   the badge reaches 0; reload; assert still 0; prove with a `count(*) where read_at is null`
   SQL read scoped to this parent.
4. Pagination + filters: assert the pager sends real `page`/`pageSize`, and that a category
   filter sends one of the five valid values. Live negatives via `request.get` with the parent
   JWT: `?read=yes` → `400 'read must be "true" or "false"'`; `?category=bogus` → `400`.
5. **B-8 refusal proof:** assert no per-child unread count is rendered anywhere in the feed or
   on the bell — the only count shown is the single global `meta.unreadCount`. Assert no feed
   row exposes `studentDocumentId`, `emailSent`, `smsSent`, `pushSent`, `smsBlockedReason` or
   `data` (the ten-key whitelist is the whole surface).
6. Settings — **account tab**: change password with the seeded credentials, assert
   `POST /api/auth/change-password` → `200`, a translated toast, then sign out and prove the old
   password is dead and the new one works; **restore the seeded password in the same run**
   (the existing `tests/e2e/change-password.spec.ts` already does this — do not break it).
   Assert the `security_password_changed` notification row appears.
7. Settings — **search tab**: covered end-to-end by task 324 step 8; here assert only that the
   tab renders, is URL-addressable (`?tab=search`), and is keyboard-operable
   (`role="tab"`/`aria-selected`, arrow-key roving, `Home`/`End`).
8. Settings — **notifications tab**: for **each** of the seven writable booleans and
   `digestFrequency`, toggle it, assert `PUT /api/notification-preferences/me` sends the FLAT
   key (no `{ data }` envelope), returns `200`, the control reflects the response, **reload**,
   and the control still reflects it. Prove one of them with a direct
   `notification_preferences` SQL read.
   **Explicitly assert the W9 fix:** set both `smsEnabled` and `pushEnabled` to off, reload, and
   assert the "Text messages" switch reports `aria-checked="false"` — the exact assertion that is
   red at the baseline (`notification-preference-controls.spec.ts:75`).
   Assert `account` and `security` render as **locked** (non-suppressible) with a translated
   explanation and no request fired when clicked.
9. Settings — **push**: assert `GET /api/push-subscriptions/vapid-public-key` is called and that
   a `null` `publicKey` yields a disabled control with a translated explanation and **no**
   enabled no-op (the existing `push-subscription-security.spec.ts` guarantee). When a key is
   configured, subscribe → `POST /api/push-subscriptions` `200`, reload → still subscribed →
   `push_subscriptions` SQL row exists for this user; unsubscribe → `DELETE` `200
   { data: { deleted: 1 } }` → row gone → a second unsubscribe returns `{ deleted: 0 }`
   (idempotent), not an error.
10. Settings — **children tab**: assert the child rows come from the real `GET /api/my/students`
    and each management control lands on its contracted route.
11. Error paths: intercept `PUT /api/notification-preferences/me` with the real
    `400 "<field> must be a boolean"` envelope and assert a translated message with the control
    reverting to its server state (no stuck optimistic value) — this is the existing
    `notification-mutation-error.spec.ts` behaviour; keep it green. `watchErrors(page)` empty.
12. Repeat 1-10 at **375×812**: no horizontal scroll, every control ≥44×44 (including the 26px
    dismiss button's padded hit area), the tab rail scrolls without clipping, switches remain
    operable by keyboard (`Space` toggles).
13. Motion: measure switch (180ms), tab (150ms), row entrance (180ms) and toast (250ms);
    re-measure under `reducedMotion: 'reduce'` (`<= 0.02s`) with the end state intact.

## Project rules

- `schooltest-web/CLAUDE.md` §0 laws 1, 3, 4, 8, 9, 11, 12, 14; §5 pitfalls 6, 10, 11, 17.
- `.claude/rules/state-data.md` — always invalidate or `setQueryData` after a successful
  mutation; mutations in `queries/*.mutation.ts`; Zustand with selectors only.
- `.claude/rules/quality.md` — switches must be real `role="switch"` with `aria-checked` and a
  programmatic label (`use-switch-described-by.ts` already exists — reuse it, do not recreate).
- `.claude/rules/tailwind.md`, `.claude/rules/i18n.md`, `.claude/rules/testing.md`, D-VERIFY-1.
- `.qa/CONTRACTS.md` B-8 — binding refusal.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/sweep-notifications-settings.spec.ts` passes at 375×812
  and 1280×800.
- Every write control proven with: a real `2xx`, a visible update, a full reload that keeps it,
  and at least one direct SQL read per table touched (`notifications`, `notification_preferences`,
  `search_preferences`, `push_subscriptions`, `up_users`). Every fixture restored.
- The W9 SMS opt-out assertion is **green**: both opt-outs off → reload → "Text messages"
  reports `aria-checked="false"`.
- Live negatives proven: `?read=yes` → 400, `?category=bogus` → 400, unsubscribe twice →
  `{deleted:1}` then `{deleted:0}`.
- B-8 refusal asserted: zero per-child unread count; zero withheld field rendered.
- `account`/`security` proven locked with no request fired.
- All pre-existing notification/settings specs (`notification-feed`, `notification-preferences`,
  `notification-preference-controls`, `notification-mutation-error`, `notification-dead-link`,
  `notification-api-security`, `push-subscription`, `push-subscription-security`,
  `settings-tabs`, `change-password`) still pass in the same run.
- No horizontal scroll at 375; every control ≥44×44; `watchErrors(page)` empty.
- Motion measured 150-200ms (switch 180ms, toast 250ms is the design's own value and is
  exempt as an enter-only animation, documented in the spec file); `<= 0.02s` under
  `reducedMotion: 'reduce'`.
- All six locale catalogs key-identical if any string changed.
- Zero banned-pattern grep hits.

## Assumptions

- The seeded parent has ≥1 unread notification at the start of the run; if not, the sweep
  triggers one honestly by creating and cleaning up a child (which fires `student_created`)
  rather than inserting a row directly.
- VAPID may be unconfigured in this environment; step 9's subscribe/unsubscribe branch then
  asserts the honest `publicKey: null` disabled path instead, and records that in Evidence —
  it is never faked.

## Evidence

<!-- filled in as the task runs -->
