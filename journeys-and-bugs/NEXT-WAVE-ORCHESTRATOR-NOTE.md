# ORCHESTRATOR NOTE — NEXT WAVE (read me first when the current fleet ends)

## What just ran (do not repeat blindly — verify their reports first)
8 click-test lanes were launched covering: ops schools list journeys, ops admins/teachers
tabs, ops classes/students tabs, school-admin full journeys, dialogs/dropdowns both portals,
filter/sort/tab URL stress, read-only/offline/error states, console-error sweep.
Their reports + commits land in `schooltest-web` on `staging` (commit-per-lane cadence).

## NEXT WAVE — 8 NEW agents: "design journeys" (not button smokes)
Derive USER JOURNEYS FROM THE DESIGN FILES and test the product against the design's own
scenarios, not just our e2e list. Design sources:
- /home/hnr/Code/schooltest/mvp/claude-design/Ops Portal.dc.html
  (scenario switcher in the design :863-880 + script :887+ defines: happy, loading, empty,
   loadError, slow, flaky, offline, restricted, expired — TEST THESE AS STATES)
- /home/hnr/Code/schooltest/mvp/claude-design/School Admin Portal.dc.html
- /home/hnr/Code/schooltest/mvp/claude-design/SchoolTest Design System.dc.html

### Wave-2 lanes (launch all 8, background, commit+push per lane when done)
1. OPS design-state: loading — every ops list/tab in its loading state matches design
   skeletons (:110-124 list, :254-278 detail, :299-319 tables); no layout jump on load.
2. OPS design-state: empty + no-matches — empty schools list, empty tabs, no-match search;
   design :188-195 / :412-415 empty cards; CTA works from the empty state.
3. OPS design-state: loadError + slow — intercept API → error cards (:126-138, :243-252);
   Try again recovers; slow latency → skeletons then data; flaky (2 fails then success).
4. OPS design-state: offline + restricted + expired — offline banner + retry (:51-58),
   read-only restricted (:60-66, ops_support), session expired overlay (:851-861) and
   recovery. Compare banner/overlay pixels to the design.
5. SCHOOL-ADMIN design journeys — the design's own task flows A→Z: add class → assign
   teachers → import students → view drill-down; invite teacher → assign classes →
   deactivate; add student → move class → archive. Verify UI positions match the design
   view at every step (not just that they work).
6. OPS design journeys — create school → invite admin (owner invitation note :600-603) →
   onboarding → activate → suspend → undo → archive → restore, asserting the design's
   screen at each step; plus Status page link and recalculate seats from the ⋯ menu.
7. CROSS-portal data honesty — every count everywhere (pills, tab badges, stats strips,
   "N students" lines, pager totals) must equal the API numbers (curl with
   X-Ops-Portal-Version: 1). One mismatch = bug. Cover both demo schools + seeded school.
8. PIXEL DELTA SWEEP — the residual list from wave 1: dropdown 218→224px/:412 radius 16,
   row padding 18→16px/:382, teachers tab internal-jargon note (C-TCH copy) removal,
   Teachers h1 24px→30/500 (school-admin :540), teacher detail h1 28/500 + 4th stat tile
   decision, crest 76px/radius-20 on ops detail, SA home Teachers panel (design :166-184
   two-up grid) — fix or write an explicit deviation note in journeys-and-bugs.

### Rules for wave 2 (same as wave 1)
- Live stack: web :3002, API :5500 — NEVER restart servers or run builds.
- src/components/ui/* READ-ONLY. Extend via src/modules/design-system.
- Fix in the owning module; directory core + ops core coordinate via reports if contested.
- Hard-reload before each session (stale bundle caused dead buttons before).
- Capture console errors + failed network on every step; click → observable outcome.
- pnpm tsc --noEmit (ignore tests/e2e/ops-portal/settings-read.spec.ts, tests/e2e/proofs/)
  + targeted eslint on touched files.
- Commit + push each lane to origin/staging when green; append journeys to
  schooltest-web/journeys-and-bugs/journeys.md in the same commit.

## Fixtures (local DB, seeded — re-run `node scripts/seed-demo-school.mjs` if wiped)
- Demo School A  y71h16mmldmxfecnao4diqd0 — 1 admin, 19-20 teachers, 19-20 classes, 172 students
- Demo School B  f7td6tkqh3qtw5rsa4oa4n0v — 1 admin, 1-2 teachers, 1 class, 20 students
- Seeded Demo School 20260911 zb6j30274xnde80mrdqjxxhr — 2 admins, 4 teachers, 3 classes, 12 students
- State Probe NSW(pilot) / VIC(suspended) / QLD(archived) / WA(submitted) — 1 admin each
- Logins: admin@schooltest.local / Admin1234! ; schooladmin-a@schooltest.local /
  Schooladmin1234! ; opssupport@schooltest.local / SupWvEStNXzqs6rljOl5YOSm!7 ;
  seeded staff: Demo!Passw0rd (see scripts/seed-demo-school.mjs output)

## Known gaps (server-side, do NOT burn time re-testing as frontend bugs)
- active/trial portal status unreachable via API (needs onboarding_status=complete; no
  route writes it) → status pills Active/Trial legitimately show 0.
- classes-list student_count vs roster endpoint disagreement (data-level).
- bulk roster DELETE with multiple ids → 500 (single id works).
- POST /api/students with school relation 403s for ops token (use CSV import instead).
- DELETE school refuses while it holds classes/users (by design).
