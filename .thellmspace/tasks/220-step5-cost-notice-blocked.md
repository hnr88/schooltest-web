---
id: 220
title: BLOCKED — step 5's per-child cost notice has no pricing, plan or invoice data source
layer: ui
kind: build
slice: Wizard step 5 cost notice panel (`Adding a third child costs A$9/month … next invoice A$45 on 12 Aug`)
target: src/modules/student-wizard/components/StepReview.tsx (panel deliberately NOT rendered)
contract: .qa/CONTRACTS.md — BLOCKED table entry **B-7**
design: .qa/design/screens/portal--add-child-multi-step.html:131-134, .qa/design/spec/03-portal-forms.md#28-step-5--review--confirm
status: BLOCKED
depends_on: [219]
---

## Objective
Record, rather than fake, the one element of step 5 that cannot be built: the design's large info
panel that prices the child being added and projects the next invoice.

## Contract
`.qa/CONTRACTS.md`, BLOCKED table, quoted verbatim:

> | **B-7** | `Family plan covers up to 4`, all billing/credits/invoices | `portal--billing.html`,
> `app--buy-credits/checkout/receipt/auto-top-up` | No payment, credit, invoice, plan or subscription
> content-type exists and no payment provider is configured. |

And `.qa/DECISIONS.md` **D-SCOPE-2**, out-of-scope list:

> Billing / credits / checkout / receipts / auto-top-up … There is NO payment, credit, invoice or
> subscription content-type in the Strapi API and no payment provider is configured anywhere in the
> repo. Per the no-invention rule these are BLOCKED-NO-API, not built with placeholder numbers.

## Design source
`portal--add-child-multi-step.html:131-134` — `PortalInfoPanel` (large variant: `gap:11px;
border-radius:14px; padding:15px 18px; font-size:13px; color:#3D4A5C; line-height:1.55; icon 16×16`),
copy with the price bolded via `<b style="color:#0E2350">`:

> Adding a third child costs **A$9/month** on your Family plan. Your next invoice will be A$45 on 12 Aug.

`03-portal-forms.md` §7.1 breaks that one sentence into FOUR computed metrics, none of which has a
source:

| Visible value | Format | Must be computed from |
|---|---|---|
| `a third` | English ordinal word | count of existing children + 1 |
| `A$9/month` | `A$` + integer + `/month` | plan per-child rate at the next tier |
| `A$45` | `A$` + integer | current MRR + the new child's rate |
| `12 Aug` | `D MMM` | billing anchor day + next cycle |

§ UNKNOWNS 7 adds that even inside the design the pricing is inconsistent: the wizard says a third
child costs `A$9/month` while Billing says `2 children · A$18 each` — "no pricing rule, tier table or
discount logic appears anywhere in the export."

## Files
None are created. `StepReview` renders the summary table (task 219) and, on failure, the error alert
(task 222) — and nothing else. The `PortalInfoPanel` `lg` variant built in task 217 is left available
for the surfaces that do have data.

## Depends on
219 — the review screen this panel would have sat under.

## Steps
1. Confirm, by grep against the running API's content-types, that no `plan`, `subscription`,
   `invoice`, `price` or `credit` content-type exists (the evidence for B-7).
2. Do not render the panel. Do not add placeholder currency anywhere.
3. Record the finding in this file's Evidence section and leave the task at `status: BLOCKED`.

## Project rules
`.qa/DECISIONS.md` D-SCOPE-1 rule 4 ("A design screen with no data behind it is not to be faked") ·
D-SCOPE-2 (billing is out of scope, BLOCKED-NO-API) · `CLAUDE.md` §0 law 5 (when in doubt, mark
BLOCKED with the precise gap) · `.qa/PLAN.md` finding 3.

## Done criteria
Terminal state is **BLOCKED**. Provable by:
- A grep over `schooltest-api/src/api/**/content-types/**/schema.json` returning no plan, price,
  invoice, subscription or credit type (paste the command and its empty output as Evidence).
- A Playwright assertion on step 5 that the page contains **no** `A$` string and no element matching
  the cost-notice copy — the regression guard that keeps a future task from quietly adding a fake
  number.
- No new i18n keys for pricing copy in any of the six catalogs.

## Assumptions
If a billing surface is ever added to the API, this task is superseded by a new one against the real
contract; it is not "unblocked" by inventing a rate card.

## Evidence
