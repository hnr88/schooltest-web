# Journeys

Click-tested end-to-end journeys. Status: ✅ verified (proof linked) / 🔄 fleet testing in progress.

## Ops portal

- ✅ **Schools directory** — search → filter (state/sector/plan/onboarding) → sort → Clear → paginate → status pills → open school. Proof: tests/proofs/schools/ (25 shots), tests/e2e/proofs/schools-list-surface.proof.spec.ts (7/7).
- ✅ **Create → edit → archive school** — create modal (9 design fields), edit suburb (API-verified), typed-name archive confirm, pills update. Proof: tests/proofs/schools/, schools-create-edit-archive.proof.spec.ts.
- ✅ **Lifecycle suspend → undo** — overflow menu → typed confirm → status change → undo toast → restored; suspend endpoint proven via API. Proof: tests/proofs/detail/07-09*.png.
- ✅ **Admins & invitations** — invite → pending row + API JSON → resend (expiry moves) → revoke (row leaves) → make owner round-trip → block/unblock → scoped CSV export. Proof: tests/proofs/admins/ (14 shots), admins-invites.proof.spec.ts (7/7).
- ✅ **Classes** — create/edit (rename API-verified), assign teacher (API-verified, reverted), archive/restore, row → class detail. Proof: tests/proofs/class/01-05*.png, class-page.proof.spec.ts (6/6).
- ✅ **Student import** — template download → CSV → preview (2 parsed) → commit (Idempotency-Key) → roster shows probes (UI + API JSON) → export CSV → cleanup. Proof: tests/proofs/class/06-07*, roster API dump.
- ✅ **Students tab pagination** — 172 students → 25/page, page 2 clean. Proof: tests/proofs/ops-tabs-populated/a-students-page2.png.

## School-admin portal

- ✅ **Full walkthrough** — home → classes list → class detail → students → drill-down → teachers → teacher detail → account; add/edit/delete class, assign teachers, move students, invite/revoke teacher; all dialogs round-trip and reverted. Proof: tests/proofs/sa-acceptance/ (14 shots), sa-acceptance.proof.spec.ts (14/14).

## Fleet-verified (8 click-test lanes, all green)

- ✅ Ops list deep journeys — bulk suspend/archive now confirm + undo (were silent 400s);
  guaranteed-400 Activate removed for pending/trial; Clear-filters race fixed. Proof: gui-test-screenshots/.
- ✅ Ops admins/teachers — invite/resend/revoke/owner/block/export all API-proven; teacher
  count role-filter fixed; bulk empty-target false errors fixed.
- ✅ Ops classes/students — undo-import offer fixed; import select React error fixed; row
  click → profile wired; move/deactivate/reactivate round-trips.
- ✅ School-admin journeys — P0: add-teacher PATCH storm (68,262 requests) fixed; 17
  journeys pass incl. account, switcher, sign out.
- ✅ Dialogs/dropdowns both portals — typed-name rule unified; window-select error wipe fixed;
  zero dead items; cancel paths API-verified write-free.
- ✅ Filters/URL/tabs stress — 32/32; App Router swallow/revert race fixed (optimistic
  pendingState); rapid tab desync 9/21 → 0/15 probes.
- ✅ Read-only/offline/error — create-school write gate added (ops_support could POST!);
  dead Retry after reconnect fixed (stale closure); expired/404/500 journeys pass.
- ✅ Console sweep — 24 routes, ~950 clicks, 24/24; resend-owner-invite 409 gated; logout
  403 storm (178 reqs) fixed; orphaned student links repaired.

## Known open items (server/product-owned)
- activate/trial unreachable by API (onboarding complete never written) — product decision.
- student profile endpoint leaks numeric class.id → strict schema rejects (all profiles 500-parse).
- PATCH /api/schools/:id returns 500 AFTER persisting (post-write validation).
- ops_support 403 on GET school detail vs capabilities read:true — role matrix decision.
- teacher needs-attention 400: crosswalk v3 vs active v4 (cross-repo).
- teacher/* module has UNCOMMITTED half-refactored drill-down/results code (4 tsc errors) — WIP, not ours.

