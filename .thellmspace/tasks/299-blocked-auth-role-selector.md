---
id: 299
title: BLOCKED — the login Parent/School segmented control and the register role cards
layer: ui
kind: verify
slice: The design's two role selectors on the auth screens, refused with reason rather than built
target: src/modules/auth/components/SignInCard.tsx (login segmented control), src/modules/auth/components/SignUpCard.tsx (role cards) — NOT to be created
contract: n/a
design: .qa/design/screens/app--login.html:21-24 · .qa/design/screens/app--register.html:8-20 · .qa/design/spec/06-auth-states-landing.md#16-auth-screen-inventory--layout-comparison
status: BLOCKED
depends_on: [292, 294]
---

## Objective

Record, visibly and permanently, that the two role selectors the design draws on the auth screens
are **not built** in this mission, and why. This task exists so the omission is a decision with a
citation, not a gap someone later "fixes" by inventing a school portal.

## Contract

n/a. The blocking rule is a scope decision, not a data gap.

## Design source

Two controls, both fully specified in the design and both deliberately not implemented:

1. **Login role segmented control** (`app--login.html:21-24`, spec §1.1 item 2) — a 2-up switch,
   track `background:#F1F5F9; border-radius:10px; padding:4px`; active segment "Parent"
   `#FFFFFF` pill, `border-radius:8px`, `13.5px/600`, `#0E2350`, `box-shadow:0 1px 2px
   rgba(14,35,80,.08)`; inactive segment "School" `#64748B`.
2. **Register role cards** (`app--register.html:8-20`, spec §1.2 item 2) — `grid 1fr 1fr; gap:16px`;
   selected "I'm a parent" card `border:2px solid #2563EB`, `radius:14px`, `padding:22px`, tick
   badge `20×20` `#2563EB`, icon chip `40×40 r10 #EFF5FF` with lucide **users** `#2563EB`;
   unselected "I'm a school" card `1px #E3E8F0`, icon chip `#F0FDFA` with lucide **school**
   `#0D9488`, hover `border-color:#CBD5E1`.

## Blocking reason

`.qa/DECISIONS.md` **D-SCOPE-2 — In scope / out of scope**, quoted verbatim:

> OUT — recorded, not silently dropped:
> - The teacher/school portal screens (`app--school-overview`, `app--students`, `app--parents`,
>   `app--create-test`, `app--grading`, `app--class-detail`, `app--live-monitor`, …). Root
>   `.qa/HANDOFF.md` records that `schooltest-web` has zero teacher surfaces and that those waves
>   (W10-W22 of mission `st-mvp-d`) are unbuilt. **Building them here would be inventing a product
>   surface, and would collide with another agent's mission.**

and `.qa/DECISIONS.md` **D-SCOPE-1** binding reading §4:

> "Do not invent" is absolute. A design screen with no data behind it is not to be faked.

A "School" segment or an "I'm a school" card must lead somewhere. There is no school registration
endpoint, no school role in the parent portal's auth surface
(`.qa/intake/web-inventory.md` §4 — the only guard is `useRequireParent`), and no school route in
`src/app/[locale]/**`. Shipping either control produces a visible affordance that either does
nothing or navigates to a 404 — which `.claude/rules/quality.md` and D-SCOPE-1 §4 both forbid.

The existing code already carries this decision as a comment in
`src/modules/auth/components/AuthSplitLayout.tsx`: *"The §14.1 comp's Parent/School segmented toggle
is intentionally NOT built (no school portal in scope)."* This task promotes that comment to a
recorded mission decision.

## Files

**None created, none modified.** The only artefact is this task file and its Evidence section.

## Depends on

- **292** and **294** — the two screens whose design these controls belong to must be delivered
  first, so that the verifier can confirm the controls are absent from the shipped surface rather
  than merely unbuilt-so-far.

## Steps

1. After 292 and 294 are DONE, grep the delivered auth surface for any role control:
   `rg -n "School|role|segmented" src/modules/auth/components/` — expect no user-facing role
   affordance.
2. Assert against the running app that `/sign-in` and `/sign-up` render no control whose accessible
   name is "School" / "I'm a school", in `en` and in one non-default locale.
3. Fill in Evidence with the grep output, the Playwright output and the D-SCOPE-2 citation.

## Project rules

- `.qa/DECISIONS.md` D-SCOPE-1 §4, D-SCOPE-2.
- `.qa/PLAN.md` "Definition of done (per task)" — a BLOCKED task is done when the refusal is proven,
  not when something is shipped.
- `schooltest-web/CLAUDE.md` §0 law 1 — do exactly what is asked, zero extras.

## Done criteria

- Status stays **BLOCKED**; no source file is created or modified by this task.
- A real Playwright assertion against the running app that `/sign-in` and `/sign-up` expose **zero**
  elements with an accessible name matching `/school/i` in the auth card, at 375 and 1280.
- The grep in step 1 returns no user-facing role affordance.
- Evidence quotes D-SCOPE-2 verbatim as the blocking reason.
- No i18n key added for "Parent" / "School" in any of the six catalogs (assert the catalogs are
  unchanged by this task).

## Assumptions

If a school portal is ever added to `schooltest-web`, both controls become buildable from the design
values quoted above without further design work. Nothing here is lost — only deferred with a reason.

## Evidence

_(filled in as the task runs — must quote D-SCOPE-2 and carry the Playwright output proving absence)_
