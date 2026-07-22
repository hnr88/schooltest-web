---
id: 336
title: API security — notifications, notification preferences and push subscriptions refuse every unauthorized and forged request
layer: security
kind: verify
slice: Endpoints #14-#22 — the notification feed, its counters, the preference row and the push-subscription surface
target: tests/e2e/api-security-notifications-push.spec.ts (new); schooltest-api notification/push handlers only if a refusal is missing
contract: n/a (existing surface — the contracts are the code, per D-CONTRACT-1)
design: n/a
status: TODO
depends_on: []
---

## Objective

Prove with real HTTP requests that the notification and push surface refuses the wrong caller,
never lets one user read, mark, mutate or hijack another user's rows, never exposes the
deliberately-withheld fields, and never returns an enabled control backed by an unconfigured
VAPID key.

## Contract

Quoted from `.qa/intake/api-inventory.md`:

- **#14 `GET /api/notifications`** — grant held by **all four app roles**;
  `assertNotificationCaller` re-asserts; `403 ForbiddenError "Only a signed-in parent, teacher,
  student or admin can access notifications"`. Query is read straight off `ctx.query` (NOT
  Strapi `filters[]` syntax): `page` ≥1 (default 1), `pageSize` 1..**100** (default **20**),
  `read` must be the literal `"true"`/`"false"` else `400 'read must be "true" or "false"'`,
  `category` ∈ `account, security, children, testActivity, testResults` else
  `400 "category must be one of: …"`, `eventType` free-form `$eq`.
  **Server-forced owner filter** `{ user: { documentId: { $eq: caller.documentId } } }` on every
  query — callers never supply an owner. Each row is EXACTLY the ten-key whitelist
  (`documentId, eventType, category, title, body, priority, readAt, linkUrl, createdAt,
  updatedAt`) with the numeric `id` explicitly dropped;
  `emailSent/emailSentAt/smsSent/smsSentAt/pushSent/pushSentAt/smsBlockedReason/data/user` are
  **NEVER exposed**. `meta.unreadCount` is the caller's TOTAL unread, independent of filters.
- **#15 `GET /api/notifications/unread-count`** — BARE `{ data: { count } }`, **no `meta`**.
- **#16 `POST /api/notifications/read-all`** — capped at **100 per call**; BARE
  `{ data: { updated } }`; zero unread ⇒ `{ updated: 0 }`, never a 404.
- **#17 `PUT /api/notifications/:documentId/read`** — unknown ⇒
  `404 NotFoundError "Notification not found"`; foreign ⇒ `403` with `name: 'ForbiddenError'`
  and message `"This notification does not belong to you"`; already-read returns its ORIGINAL
  `readAt` with no re-write; BARE `{ data: { documentId, readAt } }`.
- **#18/#19 `GET|PUT /api/notification-preferences/me`** — all four app roles; target ALWAYS
  `ctx.state.user`; PUT body is FLAT JSON (no `{ data }` envelope) with the writable whitelist
  `emailEnabled, smsEnabled, inAppEnabled, pushEnabled, children, testActivity, testResults` +
  `digestFrequency ∈ immediate|daily|weekly|off`. **`account` and `security` are deliberately
  absent from the whitelist** (structurally non-suppressible). Unknown keys (`user`, `id`,
  `documentId`, …) are **silently IGNORED**, not a 400. Errors
  `400 "<field> must be a boolean"` / `"digestFrequency must be one of: …"`. Success is BARE
  `{ data: … }` with no `meta`; the `user` relation is never returned.
- **#20 `GET /api/push-subscriptions/vapid-public-key`** — BARE
  `{ data: { publicKey: string|null } }`; `null` **honestly** reports unconfigured VAPID.
- **#21 `POST /api/push-subscriptions`** — STRICT body (unknown key ⇒
  `400 "invalid push subscription"`): `endpoint` 1..2048 trimmed, `keys: { p256dh: 1..255,
  auth: 1..255 }` strict, `expirationTime?` int|null, `userAgent?` 1..1000 (falls back to the
  request header). Upsert **by the globally-unique `endpoint`**: a row owned by ANOTHER user ⇒
  `403 ForbiddenError "You cannot manage this push subscription"` — **never reassigned, owner
  never disclosed**. BARE `{ data: { documentId, endpoint } }`.
- **#22 `DELETE /api/push-subscriptions`** — `{ endpoint }` in the DELETE **body** (enabled by
  `config/middlewares.ts:39-50`) or `?endpoint=`; deletes at most one row matched by BOTH
  `endpoint` AND the caller's `user.documentId` — a foreign or absent endpoint is
  **indistinguishable**; BARE `{ data: { deleted: 0|1 } }`, idempotent.
- **Global:** rate limit 120 req / 60 000 ms per IP ⇒ `429` + `Retry-After`.

**B-8** (`.qa/CONTRACTS.md`, verbatim): *"Per-child unread notification count | `unread-count` is
a single global scalar and the feed deliberately withholds `studentDocumentId` (gap G13)."* —
this task proves the withholding is real at the API boundary.

## Design source

n/a — security task.

## Files

- `tests/e2e/api-security-notifications-push.spec.ts` (new)
- Only if a refusal is missing: `schooltest-api/src/api/notification/**`,
  `schooltest-api/src/api/notification-preference/**`,
  `schooltest-api/src/api/push-subscription/**`, `schooltest-api/src/utils/notification-caller.ts`
- Never the Strapi admin UI

## Depends on

No intra-wave dependency. Wave gate (prose): run after **W9 (260-283)**, which owns this
surface's UI and the SMS opt-out persistence fix. The existing
`tests/e2e/notification-api-security.spec.ts` and `push-subscription-security.spec.ts` are the
baseline this task extends — they must stay green, and this spec must not duplicate them but
add the caller matrix and the cross-tenant probes they do not cover.

## Steps

1. Build the caller matrix against `http://localhost:5500`: **A** the seeded parent; **B** a
   throwaway second parent with its own notifications (created honestly by adding a child, which
   fires `student_created`); **C** no JWT; **D** a forged JWT (signature byte flipped, and one
   re-signed with a wrong secret); **E** an expired JWT.
2. For #14-#22 assert: A → the contracted `2xx`; C → `401`; D (both) → `401`, never 200, never
   500; E → `401`. For a non-app-role caller (if reachable) → `403` with the exact message.
3. **Owner-filter proof on #14:** as A, attempt to widen the scope —
   `?filters[user][documentId][$eq]=<B documentId>`, `?user=<B id>`, `?populate=user` — and
   assert every response still contains only A's rows and never a `user` member. Assert the
   ten-key whitelist exactly: for every returned row,
   `Object.keys(row).sort()` equals the contracted ten keys, and `id`,
   `emailSent`, `emailSentAt`, `smsSent`, `smsSentAt`, `pushSent`, `pushSentAt`,
   `smsBlockedReason`, `data`, `user`, `studentDocumentId` are all absent (**B-8 proof**).
4. **Query-validation proof on #14:** `?read=yes` → `400 'read must be "true" or "false"'`;
   `?read=1` → `400`; `?category=bogus` → `400 "category must be one of: …"`;
   `?pageSize=101` → clamped or `400` (assert what the code actually does and record it,
   D-CONTRACT-1); `?page=0` → default/clamp behaviour asserted.
5. **Counter integrity on #15:** assert `data.count` equals a direct
   `select count(*) from notifications where user_id = <A> and read_at is null` via `runSql`,
   and that it is unaffected by any `category`/`read` filter passed to #14.
6. **Cross-tenant mark-read on #17:** discover one of **B's** notification documentIds (as B),
   then as A `PUT /api/notifications/<B row>/read` and assert **`403`** with
   `error.name === 'ForbiddenError'` and the exact message `"This notification does not belong to
   you"`. Then read the row with `runSql` and assert its `read_at` is **still null** — the
   refusal must not have written. Also assert a nonexistent id → `404 "Notification not found"`,
   and that the two responses differ exactly as the contract says (403 vs 404 — this endpoint
   deliberately does NOT use the non-disclosure 404 pattern; assert it as-is and record the
   asymmetry against the `/my/*` reads).
7. **Idempotency on #17:** mark one of A's rows read twice and assert the second call returns
   the **original** `readAt` with no re-write (compare the SQL `read_at` before/after).
8. **Cap proof on #16:** assert `read-all` never reports `updated > 100` in one call, and that a
   caller with zero unread gets `{ updated: 0 }` and **not** a 404.
9. **Preference isolation on #18/#19:** as A, `PUT { smsEnabled: false }`; as B, `GET` and assert
   B's row is untouched; read both rows with `runSql` and assert exactly one row per user.
   Send `{ user: <B id> }`, `{ id: 1 }`, `{ documentId: '<B row>' }` and assert they are
   **silently ignored** (`200`, B unchanged) — not a 400, matching the contract exactly.
   Send `{ account: false }` and `{ security: false }` and assert they are ignored and the
   returned `account`/`security` remain `true` (**structurally non-suppressible**).
   Send `{ smsEnabled: 'no' }` → `400 "smsEnabled must be a boolean"`;
   `{ digestFrequency: 'hourly' }` → `400 "digestFrequency must be one of: …"`.
   Restore A's original preferences.
10. **Push hijack proof on #21:** as A, subscribe a distinctive `endpoint`. As **B**, POST the
    **same** `endpoint` and assert `403 "You cannot manage this push subscription"`, that the
    body does **not** disclose A's identity, and — via `runSql` — that the row's `user_id` is
    **still A**. Then as B, `DELETE` that same endpoint and assert `{ deleted: 0 }` (a foreign
    endpoint is indistinguishable from an absent one) and that A's row still exists.
    Finally as A, `DELETE` it → `{ deleted: 1 }`; a second `DELETE` → `{ deleted: 0 }`.
11. **Strict-body proof on #21:** `{ endpoint: 'x', keys: { p256dh: 'a', auth: 'b' }, evil: 1 }`
    → `400 "invalid push subscription"` with `details.fields` naming `evil`; a 3000-char
    `endpoint` → `400`; missing `keys.auth` → `400`.
12. **VAPID honesty on #20:** assert the response is `{ data: { publicKey: <string|null> } }` and
    that the **private** VAPID key never appears in any response body or header. If `publicKey`
    is `null`, assert the web UI's subscribe control is disabled with a translated explanation
    (the existing `push-subscription-security.spec.ts` guarantee) — never an enabled no-op.
13. **Rate limit:** one serial test, last in the file, proving `429` + `Retry-After`, then
    waiting out the window.
14. Fix any missing refusal with a typed `@strapi/utils` error in the owning service; never
    relax a policy, never disclose an owner.

## Project rules

- `schooltest-api` rules (`.qa/RULES.md`): `strapi.documents()` only; `documentId` not numeric
  `id`; explicit `populate`, never `'*'`; typed errors from `@strapi/utils`; thin controllers,
  logic in services; document middleware must `return next()` on every path; grants in code
  under `src/bootstrap/`, **never the admin UI**; **never start/stop the API server**.
- `.qa/RULES.md` command policy — `psql` reads only; never drop or truncate a table.
- `.qa/DECISIONS.md` D-CONTRACT-1 (code is the contract), D31/D32 (notification preference
  interaction design and browser-push ownership) remain binding history.
- `.claude/rules/testing.md`, D-VERIFY-1.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `pnpm exec playwright test tests/e2e/api-security-notifications-push.spec.ts` passes with the
  full caller matrix (A, B, C, D×2, E) asserted against all nine endpoints, every status and
  every exact message string.
- The ten-key whitelist proven **per row** on #14, with `studentDocumentId`, `smsBlockedReason`,
  `data`, `user` and the numeric `id` proven absent — the **B-8** withholding is real at the API.
- Owner-filter widening attempts proven inert (three different injection shapes).
- Cross-tenant mark-read proven `403` **with no write** (SQL `read_at` still null).
- Idempotent mark-read proven (original `readAt` preserved).
- Preference isolation proven with a direct `notification_preferences` SQL read; unknown keys
  proven **silently ignored** (200, unchanged) exactly as contracted; `account`/`security`
  proven non-suppressible; both `400` validation messages proven verbatim.
- Push hijack proven `403` with the row's `user_id` unchanged and the owner not disclosed;
  foreign `DELETE` proven indistinguishable (`{ deleted: 0 }`); idempotent delete proven.
- The private VAPID key proven absent from every body and header.
- `429` + `Retry-After` proven, serially and last.
- `tests/e2e/notification-api-security.spec.ts`, `push-subscription.spec.ts` and
  `push-subscription-security.spec.ts` all still pass in the same run.
- Every fixture restored: A's preferences, A's push subscription removed, throwaway parent B and
  its child and notifications removed.
- Zero banned-pattern grep hits in the diff.

## Assumptions

- VAPID may be unconfigured in this environment; step 12 then asserts the honest `publicKey:
  null` branch and records it. Nothing is faked to make the subscribe path testable.
- Creating notifications for B is done honestly by exercising a real event
  (`student_created` via `POST /api/students`), never by inserting rows.

## Evidence

<!-- filled in as the task runs: the full matrix, per-row key sets, SQL reads, 429 headers -->
