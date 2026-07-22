---
id: 081
title: BLOCKED — no content-type backs billing/credits or a per-child unread notification count (B-7, B-8)
layer: backend
kind: verify
slice: The two metrics whose backing content-type does not exist — refused, with the gap named
target: no file is created — this task's product is the recorded refusal and the substitute instruction for W9
contract: n/a — BLOCKED rows B-7, B-8 of the .qa/CONTRACTS.md addendum
design: .qa/design/screens/portal--billing.html · app--buy-credits.html · app--checkout.html · app--receipt.html · app--auto-top-up.html · portal--notifications.html
status: BLOCKED
depends_on: []
---

## Objective

Two more design metrics have no backing content-type at all. One (billing) is already out of scope;
the other (per-child unread count) sits squarely inside the parent portal and would otherwise be
"solved" by string-parsing a URL. Refuse both in writing, name the gap, and specify the substitute.

## Contract

`.qa/CONTRACTS.md` → **BLOCKED**, quoted verbatim:

| id | Design metric | Slice | Why blocked |
|---|---|---|---|
| **B-7** | `Family plan covers up to 4`, all billing/credits/invoices | `portal--billing.html`, `app--buy-credits/checkout/receipt/auto-top-up` | No payment, credit, invoice, plan or subscription content-type exists and no payment provider is configured. |
| **B-8** | Per-child unread notification count | `portal--notifications.html` | `unread-count` is a single global scalar and the feed deliberately withholds `studentDocumentId` (gap **G13**). |

Corroborating gap, `.qa/intake/api-inventory.md`:

> **G13 — No per-child unread-notification count.** `unread-count` is a single global scalar
> (`services/notification.ts:128-132`) and the feed's `data` payload (which holds
> `studentDocumentId`) is deliberately NOT exposed (`NOTIFICATION_LIST_FIELDS`,
> `services/notification.ts:15-18`). Attributing a notification to a child requires string-parsing
> `linkUrl` (`/dashboard/children/<documentId>`, `format-event.ts:32-35`) — fragile, and `linkUrl`
> is `null` for account/security events on some paths.

Scope note, `.qa/DECISIONS.md` **D-SCOPE-2**: billing / credits / checkout / receipts /
auto-top-up are OUT of mission — "There is NO payment, credit, invoice or subscription
content-type in the Strapi API and no payment provider is configured anywhere in the repo. Per the
no-invention rule these are BLOCKED-NO-API, not built with placeholder numbers."

**Terminal state: BLOCKED.**

## Design source

- **B-7** — `portal--billing.html` (Parent Portal billing screen), plus `app--buy-credits.html`,
  `app--checkout.html`, `app--payment-success.html`, `app--payment-failed.html`,
  `app--receipt.html`, `app--not-enough-credits.html`, `app--auto-top-up.html`. Also the
  `Test credits` `12` tile and the `12 credits` pill in `app--parent-overview.html:11-12,20`, and
  the credit-ledger rows `−1 / +10 / −1` at `:83-85`
  (`.qa/design/spec/01-portal-dashboard.md` §10.1). None is servable.
- **B-8** — `portal--notifications.html`. The dashboard's own bell
  (`.qa/design/spec/01-portal-dashboard.md` §10 row 12) is a **boolean blue dot with no number**,
  and that IS servable today: `GET /api/notifications` → `meta.unreadCount`, or
  `GET /api/notifications/unread-count` → `data.count`
  (`.qa/intake/api-inventory.md` §14/§15). What is blocked is the **per-child** breakdown.

## Files

None. This task creates no source file.

## Depends on

Nothing.

## Steps

1. Re-verify B-7 against code:
   - `ls schooltest-api/src/api/` — confirm no `payment`, `credit`, `invoice`, `plan`,
     `subscription`, `order` or `ledger` api folder;
   - `grep -rniE "stripe|paypal|braintree|payment|invoice|credit_balance"
     schooltest-api/src schooltest-api/config schooltest-api/.env.example` — expect nothing that
     configures a provider;
   - `select table_name from information_schema.tables where table_schema='public' and
     (table_name like '%payment%' or table_name like '%credit%' or table_name like '%invoice%'
      or table_name like '%subscription%')` — expect 0 rows.
2. Re-verify B-8 against code:
   - read `schooltest-api/src/api/notification/services/notification.ts:15-18` and confirm
     `NOTIFICATION_LIST_FIELDS` is the ten-key whitelist with `data` excluded;
   - read `:128-132` and confirm `unreadCount` is one global scalar with no grouping;
   - `grep -rn "studentDocumentId" schooltest-api/src/services/notifications/` — confirm it lives
     only inside the withheld `data` json;
   - `select count(*) from notifications where link_url is null` — quantify how often the
     `linkUrl`-parsing workaround would fail outright, and paste the number.
3. Set the terminal state to BLOCKED and record the substitute instructions:
   - **B-7 / W-none:** the billing surfaces are not built at all. Not a skeleton, not a
     "coming soon" page. `.qa/DECISIONS.md` D-SCOPE-2 already places them out of scope; this task
     is the backend-side confirmation that no API could be written for them either.
   - **B-8 / W9:** the notifications surface renders the **global** unread count
     (`meta.unreadCount`) and the dashboard bell renders the boolean dot (§10 row 12 — the design
     itself shows no number there). Per-child badges are NOT rendered and are NOT approximated by
     parsing `linkUrl`. W9's task for that slot cites THIS task id.
   - Name the shape a future backend task would need, so it is a scoped ticket rather than a
     mystery: either expose `studentDocumentId` as an eleventh whitelisted field on
     `NOTIFICATION_LIST_FIELDS` (a deliberate widening of a privacy whitelist, requiring its own
     security review), or add a `GET /api/notifications/unread-count?groupBy=student` aggregate.
     **Neither is built in this mission** — recorded so the option is visible, not taken.

## Project rules

- `.qa/DECISIONS.md` **D-SCOPE-2** (billing out of scope, BLOCKED-NO-API) and **D-SCOPE-1(4)**
  ("'Do not invent' is absolute").
- `.qa/PLAN.md` finding 3 — BLOCKED metrics get the sanctioned vocabulary; nothing is faked.
- `schooltest-api/CLAUDE.md` §2 rule 1 (do exactly what is asked) and rule 24 (never assume schema
  fields) — in this unattended run, rule 24 becomes "mark BLOCKED with the precise gap"
  (`.qa/RULES.md` law 5).
- `.qa/RULES.md` [schooltest-api] — content-types are hand-authored `schema.json`; **never the
  admin Content-Type Builder**. Inventing a `credit` content-type to satisfy a design screen would
  violate both this and the no-invention rule.

## Done criteria

- Every probe in steps 1 and 2 is run and its actual output pasted into Evidence, including the
  `link_url is null` count.
- `status: BLOCKED` in this file's frontmatter and in `.qa/fragments/w2.json`.
- The W9 and W-none substitute instructions are recorded, unambiguous, and cite this task id.
- The future-work shape for a per-child count is named but explicitly NOT built.
- **Zero source files created or modified**; in particular
  `git diff schooltest-api/src/api/notification/` is EMPTY — the ten-key whitelist is not widened
  by this mission.
- `ls schooltest-api/src/api/ | grep -iE "payment|credit|invoice|plan|subscription"` returns
  nothing after this task, as before it.
- No i18n change. No UI → motion / 375px / axe **n/a**.
- Baseline regression untouched.

## Assumptions

- The global unread count remains fully servable and is NOT blocked — only the per-child
  breakdown is. W9 must not read this task as "notifications are blocked".
- If a payment content-type is discovered by step 1 (it should not be), this task reopens and the
  addendum's B-7 row is corrected per `.qa/DECISIONS.md` **D-CONTRACT-1**.

## Evidence

**Blocking rules, quoted from `.qa/CONTRACTS.md`:**

> **B-7** — `Family plan covers up to 4`, all billing/credits/invoices
> (`portal--billing.html`, `app--buy-credits/checkout/receipt/auto-top-up`): "No payment, credit,
> invoice, plan or subscription content-type exists and no payment provider is configured."
>
> **B-8** — Per-child unread notification count (`portal--notifications.html`): "`unread-count` is
> a single global scalar and the feed deliberately withholds `studentDocumentId` (gap **G13**)."

<!-- probe output and the W9 / W-none substitute instructions are appended here as the task runs -->
