---
id: 151
title: BLOCKED — the teacher-authored "Note from school" with named author and Reply has no data source
layer: ui
kind: build
slice: Design §6.1 as literally drawn
target: (none — nothing is built)
contract: n/a — no content-type, no endpoint
design: .qa/design/screens/portal--main.html:89-97 · .qa/design/spec/01-portal-dashboard.md#6.1
status: BLOCKED
depends_on: ["150"]
---

## Objective
Record that the design's teacher note — a quoted message with a named author, their role and school,
and a Reply action — cannot be built, and that **150** ships the card shell with truthful content
instead. Nothing here is implemented.

## Contract
There is no contract to quote, and that is the finding. Evidence:

1. **No note/message/comment content-type exists.** `.qa/intake/api-inventory.md` enumerates every
   endpoint a logged-in parent can reach (26 of them, §1/§2). None returns teacher-authored prose.
   The only per-parent text stream is `notification` (`title`, `body`), which is
   system-generated from `src/services/notifications/format-event.ts`, not written by a person.
2. **The author block is unreachable.** `.qa/intake/api-inventory.md` **G11 — No class / teacher
   context for a child**: "`student.class` and `student.teacher` relations exist
   (`student/schema.json:36-46`) but no [parent-reachable endpoint returns them]". So "Ms. Alvarez",
   "EAL/D coordinator" and "Riverside College" have no source — not the name, not the role, not the
   school.
3. **Reply has no target.** §3.2 of the api-inventory lists what a parent is not granted; there is
   no message-create, no reply, no thread endpoint of any kind. The design itself binds no handler
   to Reply (spec §6.1: "action **'Reply'** … no handler bound").

## Design source (recorded for whoever unblocks it)
`portal--main.html:89-97`, spec §6.1:
- Eyebrow **"Note from school"** — `12.5px / 600 / .06em / uppercase / #9AA6B8`
- Body quote — `16.5px / 450 / line-height 1.6 / #0E2350 / margin-top:14px`, curly double quotes
  part of the string:
  > "Emma volunteered to present in front of the class this week — a big step. Ten minutes of
  > speaking practice at home before Friday would set her up beautifully."
- Author footer — avatar `38×38 / radius 999px / #EEF1F6 / #0E2350 / 600 / 13px`, glyph `A`;
  name **"Ms. Alvarez"** `13.5px / 600 / #0E2350`; role **"EAL/D coordinator · Riverside College"**
  `12px / 400 / #7C8698`; action **"Reply"** `13px / 600 / #2563EB`.

## What must NOT happen
- No hardcoded teacher name, role or school anywhere in the codebase or the locale catalogs.
- No mapping of a system notification onto a fake human author (e.g. inventing "SchoolTest" as the
  author avatar with a Reply button that does nothing).
- No non-functional Reply button. `.qa/DECISIONS.md` D-SCOPE-1: "Only add design that is
  functional."

## Unblocking condition
A `teacher-note` (or equivalent) content-type with `author`, `student`, `body`, `published_at`; a
parent-reachable read endpoint with the standard ownership rule (foreign child ⇒ 404); a `C-*`
contract entry; and a grant in `schooltest-api/src/bootstrap/permissions-actions.ts`. Reply
additionally needs a write endpoint and a moderation story. All of that is new product scope.

## Files
none

## Depends on
- **150** — the honest card that occupies this slot, so the refusal does not leave a hole.

## Steps
none — terminal.

## Project rules
- `.qa/DECISIONS.md` **D-SCOPE-1** clause 4 — "'Do not invent' is absolute."
- `.qa/CONTRACTS.md` governing rules — every shape is defined once, from real data.

## Done criteria
BLOCKED, with the refusal provable:
- `grep -rniE "Alvarez|EAL/D coordinator|volunteered to present" src/ tests/ src/i18n/messages/`
  returns zero hits.
- No element on `/dashboard` has an accessible name matching `/^Reply$/`.
- `[data-slot="dashboard-school-note"]` renders 150's "Latest update" card, not this one.

## Assumptions
none

## Evidence
Blocking evidence, quoted from `.qa/intake/api-inventory.md` G11: "`student.class` and
`student.teacher` relations exist (`student/schema.json:36-46`) but no [parent-reachable endpoint
returns them]." No note/message content-type appears anywhere in the 26-endpoint parent surface.
Design corroboration, `.qa/design/spec/01-portal-dashboard.md` §6.1: the Reply action has
"no handler bound".
