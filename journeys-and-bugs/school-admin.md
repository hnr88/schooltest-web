# School Admin Portal — Journeys & Bugs

Working log for the School Admin page. New issues get appended as the operator reports them; fixed ones get a status update with the commit. Bugs go in `bugs.md`, journeys in `journeys.md` — same ### style as ops.

Design source of truth:
- `mvp/school-admin/designs/School Admin Portal.dc.html`
- `mvp/_shared-designs/SchoolTest Design System.dc.html` (global components)

---

## Bugs

Full log lives in `bugs.md` (canonical, numbered). The school-admin entries:

### BUG-009 — School admin page doesn't follow its design: green buttons, small sheet modal
- **Reported:** 2026-09-11 by operator
- **Scope:** School admin portal — buttons app-wide on that surface, and its modals (import modal called out).
- **Symptom:** Buttons render GREEN — nobody asked for green; the design's primary is navy (`#0E2350`). The import modal is a small sheet with those green buttons. The surface is a mix, not the design.
- **Expected:** Follow `mvp/school-admin/designs/School Admin Portal.dc.html` exactly — navy primary pill buttons per the design system, correct modal sizing, no invented colors.
- **Status:** OPEN

### BUG-010 — Student import flow broken end-to-end: stale template, unclear validation, all rows fail in preview
- **Reported:** 2026-09-11 by operator
- **Scope:** School admin student import — the whole flow: CSV template → upload → preview → import.
- **Symptom:** The CSV loads into the preview, but ALL 21 rows come back with errors (21 issues = one per row, same causes): required information missing or bad. The example/template doesn't contain all the must-have information, so the rules are not obvious: date of birth must be a real date, year level must be a whole number 7–12, and so on.
- **Expected:** End-to-end fix (no partial steps): the downloadable template is up to date and carries every required column with the rules made obvious; the preview validates against exactly those rules with per-row, per-column messages; a correct file imports cleanly.
- **Status:** OPEN

### BUG-011 — Edit class modal: small, ugly, not enough functionality
- **Reported:** 2026-09-11 by operator
- **Scope:** Edit class modal (school admin, same pattern as the ops class-form modal).
- **Symptom:** "Similar" to the import modal — small and ugly, and it is missing functionality the design draws.
- **Expected:** Rebuild per the design's class-form modal (`Ops Portal.dc.html:661-707`: 560px wide, radius 24px, header 22/28px padding, fields class name + year level select + class-teacher radio picker + test window select, 48px inputs, footer error slot + Cancel/CTA 44px pills) — correct size, correct look, complete functionality.
- **Status:** OPEN

### BUG-012 — Student detail page (school admin): no edit at all, design less than 10% followed
- **Reported:** 2026-09-11 by operator
- **Scope:** School admin student detail page.
- **Symptom:** School admin cannot edit a student — there is NO edit button. The page itself doesn't follow the design "not even 10%".
- **Expected:** Follow the School Admin Portal design exactly for the student detail page, and student editing must work (edit affordance + working save), keeping all current data/functionality.
- **Status:** OPEN

## Journeys

(none logged yet)
