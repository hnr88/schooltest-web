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

## In fleet testing (8 lanes — appended here when green)

- 🔄 Ops list deep journeys (bulk suspend/archive + undo, row menu per item)
- 🔄 Ops admins/teachers journeys (resend/revoke/owner/block, manage teachers)
- 🔄 Ops classes/students journeys (window, move/deactivate/reactivate, import edge)
- 🔄 School-admin journeys (account edit, sign out, switcher A↔B, search overlay)
- 🔄 Every dialog/dropdown cancel + validation + error-slot path (both portals)
- 🔄 Filter/sort/tab URL round-trips + rapid tab race
- 🔄 Read-only (ops_support), offline retry, error cards, session expiry
- 🔄 Console-error + dead-button sweep, every route, both portals
