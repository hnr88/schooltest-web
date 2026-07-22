---
id: 116
title: Rail "Billing" nav entry — BLOCKED (B-7, no billing surface exists to link to)
layer: ui
kind: build
slice: The design's fourth rail destination, "Billing", in the Account group
target: src/modules/shell/constants/nav.constants.ts (NOT edited — see terminal state), src/modules/shell/types/shell.types.ts
contract: .qa/CONTRACTS.md → BLOCKED table B-7
design: .qa/design/screens/portal--detached-sidebar.html:18-20, .qa/design/spec/01-portal-dashboard.md#12-detached-sidebar--portal--detached-sidebarhtml231
status: BLOCKED
depends_on: ["113"]
---

## Objective

The detached sidebar's Account group holds **two** items — Billing and Settings. This task exists
to record, in the open, that Billing is deliberately NOT shipped, and to fix the rail at the four
links the app can honestly reach. Its terminal state is **BLOCKED**.

## Contract

`.qa/CONTRACTS.md` → BLOCKED table, row **B-7**, quoted verbatim:

> | **B-7** | `Family plan covers up to 4`, all billing/credits/invoices | `portal--billing.html`,
> `app--buy-credits/checkout/receipt/auto-top-up` | No payment, credit, invoice, plan or
> subscription content-type exists and no payment provider is configured. |

and `.qa/DECISIONS.md` **D-SCOPE-2** (OUT of scope, recorded not silently dropped):

> Billing / credits / checkout / receipts / auto-top-up (`portal--billing`, `app--buy-credits`,
> `app--checkout`, `app--payment-*`, `app--receipt`, `app--not-enough-credits`, `app--auto-top-up`).
> There is NO payment, credit, invoice or subscription content-type in the Strapi API and no
> payment provider is configured anywhere in the repo. Per the no-invention rule these are
> BLOCKED-NO-API, not built with placeholder numbers.

`D-SCOPE-1` binding reading §4: "A design screen with no data behind it is not to be faked."

## Design source

`portal--detached-sidebar.html:18-20`:

```html
<div onClick="{{ goBilling }}" style="display:flex;align-items:center;gap:12px;padding:11px 14px;
     border-radius:12px;font-size:14.5px;cursor:pointer;font-weight:{{ navBilling.w }};
     background:{{ navBilling.bg }};color:{{ navBilling.fg }}">
  <svg width="18" height="18" …><rect x="2" y="5" width="20" height="14" rx="3"></rect>
  <path d="M2 10h20"></path></svg>Billing
</div>
```
Handler `goBilling` → `Parent Portal.dc.html:1024`. Nav-item spec identical to task 114/115.
The screen it would route to is `portal--billing.html` (60 lines) — every value on it is a plan
name, a card brand, an invoice row or a price.

## Files

**None are created or modified.** Specifically:

- `src/modules/shell/constants/nav.constants.ts` — `NAV_ITEMS` stays at the four entries
  (`overview`, `myChildren`, `search`, `settings`). No `billing` entry, no `/dashboard/billing`
  href, no `CreditCard` icon import.
- `src/modules/shell/types/shell.types.ts` — `NavLabelKey` gains **no** `'billing'` member.
- `src/i18n/messages/*.json` — **no** `Shell.nav.billing` key in any of the six catalogs. Shipping
  the string without the destination is exactly the dead-link failure this rule exists to prevent.

## Depends on

- **113** — the Account group is where the entry would go; that structure must exist before this
  refusal is meaningful (and before a verifier can see the group holds Settings alone).

## Steps

1. Confirm the block against the live system, do not take it on trust:
   - `rg -n "billing|invoice|subscription|credit|payment" schooltest-api/src/api --files-with-matches`
     → expect zero content-types.
   - `psql -h 127.0.0.1 -p 5540 -c "\dt"` → expect no billing/invoice/subscription/credit table.
   - `rg -n "stripe|paddle|braintree|razorpay" schooltest-api schooltest-web --files-with-matches`
     → expect zero.
2. Record the three outputs in Evidence below.
3. Set this task's status to BLOCKED in `.qa/fragments/w4.json` (it ships BLOCKED — no flip to
   DONE is possible without a payment content-type).
4. Prove the refusal is clean in the running app: no rail link, no route, no catalog key.

## Project rules

- `.claude/rules/i18n.md` — a key that exists in six catalogs and renders nowhere is dead weight;
  a key that renders a link to a 404 is worse. Add neither.
- `schooltest-web/CLAUDE.md` §0 law 1 and §8 — do exactly what is asked, no hallucinated surfaces.
- Mission rule: "No invention. … Never author a task that fabricates a number."

## Done criteria

This task is DONE-as-BLOCKED when all of the following are observably true against the running app:

- `rg -n "billing" src/modules/shell` returns zero hits.
- `rg -n "\"billing\"" src/i18n/messages/*.json` returns zero hits across all six catalogs.
- `pnpm exec playwright test tests/e2e/shell.spec.ts` green with `aside.locator('nav a')` counting
  exactly **4** links — i.e. the design's fifth destination is verifiably absent, not accidentally
  half-built.
- A Playwright leg asserts `page.goto('/dashboard/billing')` renders the app's real not-found
  heading (`Common.notFoundTitle`) and does NOT bounce the authenticated session to `/sign-in` —
  the same shape the existing spec uses for missing routes.
- The three verification commands from Steps §1 are pasted into Evidence with their real output.

## Assumptions

- If a payment/subscription content-type is ever added to `schooltest-api`, this task is superseded
  by a NEW task in a later mission — it is not reopened by editing this file.

## Evidence

**Terminal state: BLOCKED — `.qa/CONTRACTS.md` B-7.**
Reason, verbatim: "No payment, credit, invoice, plan or subscription content-type exists and no
payment provider is configured."

_(builder appends: the three command outputs, the 4-link e2e assertion output, and the
`/dashboard/billing` not-found reading)_
