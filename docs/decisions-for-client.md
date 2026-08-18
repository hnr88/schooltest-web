# Decisions for the client (⚠️ flags collected per rule 41)

Open decisions taken with a stated default while building. Each entry names
the alternative, why the default was chosen, and what reversing it costs.

---

## D-W1 · Teacher rail: Reports stays — the rail is four entries, not three

⚠️ flag — B3's resolution. Fixing B3 (the sidebar fed `buildNavSections` a list
pre-filtered to `group === 'primary'`, dropping the teacher's three `teach`
entries before render) unmasked a product contradiction that the bug had been
hiding: three e2e specs asserted a teacher rail of exactly Dashboard · Test
sessions · Results, while the nav definition and the repo owner's own upstream
fix say Reports belongs too.

**Default taken (Lane B, 2026-08-18, endorsed by the orchestrator's evidence
hand-off):** teachers keep Reports. The teacher rail is FOUR entries in TWO
sections — Manage: Reports; Teach: Dashboard, Test sessions, Results.

**Why:**
1. Upstream commit `5c0841e` (repo owner, 2026-08-12) fixes the identical bug
   and states the intended outcome explicitly: *"Rail per role after this:
   teacher = Reports + Dashboard/Test sessions/Results."* This is the owner's
   own statement of the post-fix product.
2. The nav item itself (`nav.constants.ts`, E11-01) is role-scoped to teachers
   precisely so it renders for them — its comment explains the scoping exists
   to avoid a dead link for parents. It was designed as a teacher rail entry.
3. The three-item assertions were never green under the current nav constants:
   before the B3 fix a teacher saw ONLY Reports (trio dropped, Reports
   present), so both the count-of-three and the reports-count-zero assertions
   failed. They described an intended state no code ever implemented.
4. The alternative makes the E11-01 report surface unreachable by navigation —
   a teacher would have to know and type `/dashboard/reports`.

**Alternative:** cap the rail at three — remove `TEACHER_ROLE_TYPE` from the
reports item (or add `hiddenForRoles: ['teacher']`) and amend the specs back.

**Reversal cost:** small and one-directional — one line in
`nav.constants.ts`, plus reverting the spec amendments in
`teacher-sidebar.spec.ts`, `teacher-auth-sidebar.spec.ts`,
`teacher-report.spec.ts` (the D-W1 hunks are commented as such). The E11-01
routes keep answering either way; only their rail presence changes.

**Reconciliation note:** the local B3 fix and upstream `5c0841e` were
functionally identical but textually different (local introduced
`RAIL_NAV_ITEMS`; upstream passes `NAV_ITEMS` and lets `buildNavSections`
restrict to `NAV_GROUP_ORDER`). `AppSidebar.tsx` now matches `origin/staging`
byte-for-byte so the eventual merge is clean; `PRIMARY_NAV_ITEMS` (the footgun
list) stays deleted locally. The regression test that would have caught the
original bug cheaply now exists: `teacher-sidebar.spec.ts` →
"the rail pipeline hands buildNavSections every teach entry (B3 regression)"
runs the sidebar's exact derivation against the real constants, browser-free.
