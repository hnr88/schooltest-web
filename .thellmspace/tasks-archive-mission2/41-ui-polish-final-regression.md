---
id: 41
title: Independent critic, accessibility sweep and final UI-polish regression
layer: regression
kind: verify
slice: all requested flows on the real running stack
target: schooltest-web/tests/e2e; schooltest-api/tests/e2e; .qa/{REPORT.md,STATE.json,STATE.md,heartbeat}
contract: all-ui-polish
status: TODO
depends_on: [40]
---
## Objective

Independently try to break every completed UI-polish slice, run the requested end-to-end flows
on desktop/mobile, complete two clean critic/anti-fixture scans, and write the final report.

## Contract

Assert every new and consumed contract’s success/auth/error conditions as documented in
`.qa/CONTRACTS.md`, plus visible reload-persistent effects for every user-facing change.

## Files

Focused existing/new E2E files and the QA report/state artifacts only; implementation changes
found by criticism become new corrective tasks before this task can pass.

## Depends on

Task 40 delivers the channel-level evidence needed for the final regression.

## Steps

1. Run each listed user acceptance flow against :3100/:5500 and real PostgreSQL/Mailpit.
2. Sweep responsive layout, keyboard operation, axe serious/critical violations and console errors.
3. Independently inspect contract/security/error paths and scan touched code for banned fake/
   fixture/fallback patterns twice in separate clean passes.
4. Update all task evidence/state, write `.qa/REPORT.md`, then commit the completed wave.

## Project rules

Do not call self-attestation proof; preserve current branches and project rules while validating.

## Done criteria

Every task is independently verified DONE or precisely BLOCKED, full live regression passes,
two critic scans are clean, QA report names evidence/screenshots and no unverified claim remains.

## Assumptions

Existing live services remain available for final testing; server startup is not required.

## Evidence

Pending independent verification.
