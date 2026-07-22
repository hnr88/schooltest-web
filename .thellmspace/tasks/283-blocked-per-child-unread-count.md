---
id: 283
title: BLOCKED — a per-child unread notification count cannot be derived; the feed deliberately withholds the child id
layer: frontend
kind: verify
slice: The design's per-child unread badge on the notifications surface
target: src/modules/notifications/components/NotificationFeedHeader.tsx (global count only), src/modules/notifications/schemas/notification.schema.ts (no studentDocumentId), .qa/CONTRACTS.md#blocked (B-8)
contract: n/a — BLOCKED by .qa/CONTRACTS.md B-8
design: .qa/design/screens/portal--notifications.html L7; .qa/design/spec/03-portal-forms.md#7-data-inventory
status: BLOCKED
depends_on: [266]
---

## Objective

Record why the notifications surface shows ONE global unread number and never a per-child one, and
plant an assertion that fails if someone later derives a per-child count from the wrong data.

## Contract

n/a. The governing entry is `.qa/CONTRACTS.md:522`:

> | **B-8** | Per-child unread notification count | `portal--notifications.html` | `unread-count`
> is a single global scalar and the feed deliberately withholds `studentDocumentId` (gap **G13**). |

## Design source (what is being refused)

`portal--notifications.html` L7 renders `2 unread` as a page-level subtitle — that one IS servable
and task 261/266 ship it from the real `meta.unreadCount`. What is NOT servable is any breakdown of
that number per child, which the design's wider composition implies (the children surfaces show
per-child activity, and `03-portal-forms.md` §7.1 lists the notification metric as "count of
`read === false`" with no child dimension).

The data facts:

- `C-NOTIF-LIST` returns `meta.unreadCount` — a single integer for the whole account
  (`schemas/notification.schema.ts:41`, `z.number().int().min(0)`).
- A notification row carries `eventType`, `category`, `title`, `body`, `priority`, `readAt`,
  `linkUrl`, `createdAt`, `updatedAt` — and **no student/child relation**
  (`schemas/notification.schema.ts:12-23`). The schema is a `z.strictObject`, so a child id could
  not even arrive unnoticed.
- `.qa/intake/api-inventory.md` gap **G13** records that the feed withholds `studentDocumentId`
  deliberately.

Three tempting fakes, all forbidden:

1. **Parsing `linkUrl`** for a `documentId` segment. A link is a navigation target, not a
   relation — it is null on many rows, points at non-child routes on others, and
   `notification-dead-link.spec.ts` exists precisely because links can be stale or malformed.
2. **String-matching the child's name in `title`/`body`.** Server-composed prose is not a foreign
   key, and it breaks in five of the six locales.
3. **Filtering by `category === 'children'`** and calling it a per-child count. That is a count of
   a category, across all children — a different number wearing the right label.

## Files

No source file is created. The deliverable is:

- `tests/e2e/no-per-child-unread.spec.ts` — a negative assertion spec;
- this file, `status: BLOCKED`, with the B-8 quote in Evidence.

## Depends on

- **266** — the global unread count must already be shipped and correct before the per-child
  refusal is meaningful; 266 is the honest half of the same metric.

## Steps

1. Prove the absence at the source and paste it:
   - `grep -n "studentDocumentId\|student\|childDocumentId" src/modules/notifications/schemas/notification.schema.ts`
     → no match;
   - the raw response: `curl -s -H "Authorization: Bearer <parent jwt>"
     "http://localhost:5500/api/notifications?page=1&pageSize=5" | python3 -m json.tool` — paste it
     and show no child relation on any item and a single scalar `meta.unreadCount`;
   - `psql -h 127.0.0.1 -p 5540 -c "\d notifications"` — show there is no student foreign key
     column (read-only).
2. Write `tests/e2e/no-per-child-unread.spec.ts`.
3. Leave the terminal state BLOCKED. Do not add a per-child badge, a "0" placeholder, or a
   tooltip explaining the missing number — the absence is the correct product state.

## Project rules

- `.qa/DECISIONS.md` **D-SCOPE-1** clause 4 — "'Do not invent' is absolute."
- `.qa/CONTRACTS.md` governing rules — "No composite scores"; the same principle applies to a
  count assembled from prose or from a link.
- `schooltest-web/CLAUDE.md` §0 law 1, law 5 (→ mark BLOCKED with the precise gap).
- `.claude/rules/testing.md`, **D-VERIFY-1**.

## Done criteria

This task is DONE-as-BLOCKED when:

- `tests/e2e/no-per-child-unread.spec.ts` is green and asserts, against the running app:
  - `/dashboard/notifications` renders exactly ONE unread count element, and its number equals
    `meta.unreadCount` from the real `GET /api/notifications` captured in the same test;
  - no element on `/dashboard/notifications`, `/dashboard/children` or `/dashboard` carries an
    unread count scoped to a child (assert no `[data-unread-for]`-style hook exists and that no
    child card contains a string matching `/\d+\s+unread/i`);
  - the notification list response contains no `student`/`child` key on any item (parse the real
    response in the test and assert the key set equals the schema's ten fields);
- the three absence proofs from step 1 are pasted into Evidence;
- `pnpm tsc --noEmit` + `pnpm lint` clean;
- `notification-feed.spec.ts` and the W9 feed specs still green;
- `status: BLOCKED` stands in this file's frontmatter with the B-8 quote below.

## Assumptions

- If a later backend wave adds a `student` relation to `notifications` AND exposes a per-child
  unread aggregate, this task is superseded by a new build task. Until then the single global
  number is the whole truth.

## Evidence

**BLOCKED — `.qa/CONTRACTS.md:522` (B-8):** "`unread-count` is a single global scalar and the feed
deliberately withholds `studentDocumentId` (gap **G13**)."

<!-- absence proofs + spec output filled in as the task runs -->
