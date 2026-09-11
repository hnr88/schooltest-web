# Bugs

### BUG-001 — Buttons are too small and don't follow the design (GLOBAL)
- **Reported:** 2026-09-11 by operator
- **Scope:** GLOBAL — every page, not just ops. Worst offenders: dropdown menu items (row actions menus, select dropdowns).
- **Symptom:** Rendered buttons are visibly smaller than the design's buttons (design default ≈ 40px tall with `padding 10px 18px`; dropdown/menu items too cramped to click comfortably).
- **Expected:** Buttons match the design system sizes above (default padding `10px 18px`, small `7px 13px`, large `13px 26px`); dropdown menu items sized to match (comfortable touch targets, not micro rows).
- **Status:** FIXED (2026-09-11)

### BUG-002 — Modals are too small (GLOBAL) — invite admin, import, all of them
- **Reported:** 2026-09-11 by operator
- **Scope:** GLOBAL — every modal in the application. Invite admin modal called out first, "and other modals"; later extended: "the modal GLOBALLY has to be wider" (e.g. the school-admin import modal is a small sheet).
- **Symptom:** Modal dialogs render too small/cramped compared to the design (design: `width 540–560px`, `radius 24px`, header/body padding `22–28px`; current implementation: `max-w 520px`, `p-4`).
- **Expected:** Modals sized generously per the design everywhere — wider, comfortable padding, content width, and spacing.
- **Status:** FIXED (2026-09-11)

### BUG-003 — Input heights are inconsistent across the application
- **Reported:** 2026-09-11 by operator
- **Scope:** GLOBAL — "some inputs are super small and the other ones are taller".
- **Symptom:** Input fields render at different heights depending on the page/component instead of one shared size.
- **Expected:** All inputs/selects/textareas share the design's sizing (`padding 10px 13px`, ~41px tall) and look the same across the application.
- **Status:** FIXED (2026-09-11)

### BUG-004 — Ops schools page doesn't follow the new design at all (old design mixed with new)
- **Reported:** 2026-09-11 by operator
- **Scope:** Ops portal main schools page (`schooltest-web` ops module) — layout/structure, not functionality.
- **Symptom:** Current page is "an old design mixed with the new one" — not even close to the new Ops Portal design. The new design (`mvp/ops/designs/Ops Portal.dc.html`) has: a totally new data-grid card (`radius 24px`, roomy rows with avatar squircle + status pill + row actions menu); a separate pill search bar in the header (44px, rounded-full, next to the "Create school" pill button); a separate status-tabs row (pill tabs with count badges); a separate filters row (pill selects for state/sector/plan + "Clear filters" + right-aligned count + "Sort:" pill select); and very little text (short captions/labels only).
- **Expected:** Rebuild the page to follow the new design 1:1 — data grid, filters, search, tabs exactly as designed — while KEEPING all current functionality (the wiring stays, the presentation changes).
- **Ruling (operator, 2026-09-11):** Follow the design 100% exactly. Where the design shows an arrow/fewer columns and our functionality needs 8 columns, ADD the 8 columns but IN the design's style — design visual language wins, functionality fits inside it. Only the LEFT sidebar is correct today; everything on the right side (main content) is a mix of old design and must be rebuilt per the new design.
- **Status:** FIXED (2026-09-11)

### BUG-005 — Clicking a data-grid row must open the detail page (GLOBAL)
- **Reported:** 2026-09-11 by operator
- **Scope:** GLOBAL — every data grid, every entity: schools, teachers, students, everyone with a detail page.
- **Symptom:** Clicking a row does nothing; navigation to the detail page is buried in the row-actions menu instead of being the row's main action.
- **Expected:** Clicking anywhere on a row navigates to that entity's detail page, as the row's primary action — schools → school detail, teachers → teacher detail, students → student detail, and so on. Row-actions menu stays for secondary actions but is not the only way in.
- **Status:** FIXED (2026-09-11)

### BUG-006 — School detail page (and edit) totally different from design; back button missing
- **Reported:** 2026-09-11 by operator
- **Scope:** Ops school detail page + edit flow.
- **Symptom:** The implemented detail page doesn't match the design's detail screen. The design (`Ops Portal.dc.html` :202–233) has: a "← Schools" back link at the top; a 76px crest avatar; 30px school name + status pill; meta line (region · plan · created); header actions "Edit school" (44px white pill) + primary status action (44px navy pill) + "More actions" round 44px menu button (236px dropdown); status banner (`radius 20px`); tabbed tables below. The edit flow is also totally different from the design's edit.
- **Expected:** Follow the design file exactly — same back link, same header composition, same buttons/menus, same edit flow — keeping the existing functionality.
- **Status:** FIXED (2026-09-11)

### BUG-007 — Data grid list must fit the screen: max-height + inline scroll + sticky column header
- **Reported:** 2026-09-11 by operator
- **Scope:** GLOBAL — all data-grid lists (ops and everywhere else).
- **Symptom:** Lists grow with their content and push the page longer instead of scrolling internally; while scrolling, the column header row scrolls out of view so you can't tell which column you're looking at.
- **Expected:** The list gets a maximum height so it fits the screen, scrolls inline (internal scroll inside the grid card), and the header row stays sticky at the top of the grid while the rows scroll under it — you always see which column you're looking at.
- **Status:** FIXED (2026-09-11)

### BUG-008 — Happy AND unhappy paths from the design file must be implemented exactly as drawn
- **Reported:** 2026-09-11 by operator
- **Scope:** Ops portal (design: `mvp/ops/designs/Ops Portal.dc.html`, scenario set: happy, loading, empty, loadError, slow, flaky, offline, restricted, expired).
- **Symptom:** The design draws every state — loading skeletons, "Couldn't load schools" error card with Try again/Status page, empty states with CTA, "You're offline" banner with Retry connection, "Read-only session" banner, "Your session expired" overlay with Sign in again, pill toasts with optional action, inline field errors — and the current page doesn't render them as designed.
- **Expected:** Check ALL happy and unhappy paths in the design file and implement each exactly as drawn, keeping current functionality.
- **Status:** FIXED (2026-09-11)

### BUG-009 — School admin page doesn't follow its design: green buttons, small sheet modal
- **Reported:** 2026-09-11 by operator
- **Scope:** School admin portal — buttons app-wide on that surface, and its modals (import modal called out).
- **Symptom:** Buttons render GREEN — nobody asked for green; the design's primary is navy (`#0E2350`). The import modal is a small sheet with those green buttons. The surface is a mix, not the design.
- **Expected:** Follow `mvp/school-admin/designs/School Admin Portal.dc.html` exactly — navy primary pill buttons per the design system, correct modal sizing, no invented colors.
- **Status:** FIXED (2026-09-11)

### BUG-010 — Student import flow broken end-to-end: stale template, unclear validation, all rows fail in preview
- **Reported:** 2026-09-11 by operator
- **Scope:** School admin student import — the whole flow: CSV template → upload → preview → import.
- **Symptom:** The CSV loads into the preview, but ALL 21 rows come back with errors (21 issues = one per row, same causes): required information missing or bad. The example/template doesn't contain all the must-have information, so the rules are not obvious: date of birth must be a real date, year level must be a whole number 7–12, and so on.
- **Expected:** End-to-end fix (no partial steps): the downloadable template is up to date and carries every required column with the rules made obvious; the preview validates against exactly those rules with per-row, per-column messages; a correct file imports cleanly.
- **Status:** FIXED (2026-09-11)

### BUG-011 — Edit class modal: small, ugly, not enough functionality
- **Reported:** 2026-09-11 by operator
- **Scope:** Edit class modal (school admin, same pattern as the ops class-form modal).
- **Symptom:** "Similar" to the import modal — small and ugly, and it is missing functionality the design draws.
- **Expected:** Rebuild per the design's class-form modal (`Ops Portal.dc.html:661-707`: 560px wide, radius 24px, header 22/28px padding, fields Full name-class name + year level select + class-teacher radio picker + test window select, 48px inputs, footer error slot + Cancel/CTA 44px pills) — correct size, correct look, complete functionality.
- **Status:** FIXED (2026-09-11)

### BUG-012 — Student detail page (school admin): no edit at all, design less than 10% followed
- **Reported:** 2026-09-11 by operator
- **Scope:** School admin student detail page.
- **Symptom:** School admin cannot edit a student — there is NO edit button. The page itself doesn't follow the design "not even 10%".
- **Expected:** Follow the School Admin Portal design exactly for the student detail page, and student editing must work (edit affordance + working save), keeping all current data/functionality.
- **Status:** FIXED (2026-09-11)
