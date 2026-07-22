---
id: 282
title: BLOCKED — the portal Billing screen and every plan/credit/invoice surface has no data model to build against
layer: frontend
kind: verify
slice: portal--billing (plan card, payment method, invoices) + the settings/nav entry points that would link to it
target: src/modules/settings/components/SettingsTabs.tsx (no billing tab), src/modules/shell/constants/nav.constants.ts (no billing item), .qa/CONTRACTS.md#blocked (B-7)
contract: n/a — BLOCKED by .qa/CONTRACTS.md B-7
design: .qa/design/screens/portal--billing.html; .qa/design/spec/03-portal-forms.md#6-billing-portal
status: BLOCKED
depends_on: [116, 272]
---

## Objective

Record, visibly and permanently, that the design's Billing surface is refused rather than faked,
and make sure no W9 surface grows a link, tab or teaser pointing at it.

## Contract

n/a. The governing entry is `.qa/CONTRACTS.md:521`:

> | **B-7** | `Family plan covers up to 4`, all billing/credits/invoices | `portal--billing.html`,
> `app--buy-credits/checkout/receipt/auto-top-up` | No payment, credit, invoice, plan or
> subscription content-type exists and no payment provider is configured. |

and `.qa/DECISIONS.md` **D-SCOPE-2**:

> OUT — recorded, not silently dropped: Billing / credits / checkout / receipts / auto-top-up …
> There is NO payment, credit, invoice or subscription content-type in the Strapi API and no
> payment provider is configured anywhere in the repo. Per the no-invention rule these are
> BLOCKED-NO-API, not built with placeholder numbers.

## Design source (what is being refused, in full)

`.qa/design/spec/03-portal-forms.md` §6 + §7.1 — every one of these is a computed money value with
no source:

| Design element | Value in the export | Would require |
|---|---|---|
| Billing header | `Family plan · next invoice A$36 on 12 August` | a subscription + billing anchor |
| Plan card price | `A$36` `/ month` | a plan rate table |
| Plan composition | `2 children · A$18 each · unlimited practice & reports` | per-child pricing |
| Plan actions | `Change plan`, `Pause` | a subscription state machine |
| Payment method | `Visa ending 4242`, `Expires 09/27`, `Default` | a PSP token |
| Invoices | four `A$36.00`/`A$18.00` rows, `Paid 12 Jul · Visa ··4242` | an invoice ledger |
| Wizard step 5 notice | `Adding a third child costs A$9/month … next invoice will be A$45 on 12 Aug` | tiered pricing + proration |
| Settings (app variant) | `Delete account … Removes all children, results and **credits**` | a credit balance |

None of these exist. `.qa/intake/api-inventory.md` lists no payment, plan, invoice, credit or
subscription endpoint, and no provider key exists in any `.env`.

## Files

No source file is created. This task's deliverable is:

- a **negative assertion spec**, `tests/e2e/billing-not-offered.spec.ts`, that fails the day
  someone adds a fake billing surface;
- the confirmation that `src/modules/shell/constants/nav.constants.ts` still has exactly four nav
  items (`/dashboard`, `/dashboard/children`, `/dashboard/search`, `/dashboard/settings` —
  `.qa/intake/web-inventory.md:64`) and `SETTINGS_TABS` still has exactly four tabs;
- this file, with `status: BLOCKED` and the quoted reason.

## Depends on

- **272** — the settings shell, which is where a billing tab would most plausibly be added by
  mistake.
- **116** — W4 already owns the rail's Billing nav entry as its own BLOCKED task. This task does
  NOT duplicate it: 116 refuses the sidebar entry, 282 refuses the screen, the settings tab and any
  currency string on a W9 surface. The negative spec here asserts both are still absent.

## Steps

1. Confirm the absence at the source, and paste the proof:
   - `ls schooltest-api/src/api | grep -iE 'invoice|payment|plan|subscription|credit'` → empty;
   - `grep -riE 'stripe|paypal|braintree|adyen|payment_intent' schooltest-api/src schooltest-web/src`
     → empty;
   - `psql -h 127.0.0.1 -p 5540 -c "\dt" | grep -iE 'invoice|payment|plan|credit'` → empty.
2. Write `tests/e2e/billing-not-offered.spec.ts`.
3. Set this task's terminal state to BLOCKED with the B-7 quote in Evidence. Do NOT build a
   placeholder screen, a "coming soon" billing page, or a disabled nav item — an entry point to
   nothing is still a claim that the feature exists.

## Project rules

- `.qa/DECISIONS.md` **D-SCOPE-1** clause 4: "'Do not invent' is absolute. A design screen with no
  data behind it is not to be faked."
- `schooltest-web/CLAUDE.md` §0 law 1 and law 5 (in this unattended run, "when in doubt" becomes
  "mark BLOCKED with the precise gap" — `.qa/RULES.md`).
- `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

This task is DONE-as-BLOCKED when:

- `tests/e2e/billing-not-offered.spec.ts` is green and asserts, against the running app:
  - `/en/dashboard/billing` does not resolve to a billing screen (404/not-found is correct);
  - the sidebar nav renders exactly four items and none matches `/billing|plan|invoice|credit/i`;
  - the settings tab list has exactly four tabs and none matches the same pattern;
  - no page in `/dashboard`, `/dashboard/children`, `/dashboard/settings`,
    `/dashboard/notifications` contains a currency string matching `/A\$\s?\d/`;
- the three absence proofs from step 1 are pasted into Evidence;
- `pnpm tsc --noEmit` + `pnpm lint` clean;
- the six catalogs contain no billing keys (grep `billing|invoice|plan|credit` across all six and
  paste the result);
- `status: BLOCKED` stands in this file's frontmatter with the B-7 quote below.

## Assumptions

- If a payment content-type is ever added, this task is superseded by a new one that builds the
  design's billing screens against it. Until then the refusal is the deliverable.

## Evidence

**BLOCKED — `.qa/CONTRACTS.md:521` (B-7):** "No payment, credit, invoice, plan or subscription
content-type exists and no payment provider is configured."

<!-- absence proofs + spec output filled in as the task runs -->
