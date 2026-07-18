---
id: 25
title: Final regression — critic loop ×2 clean + REPORT.md
layer: regression
kind: verify
slice: whole-mission adversarial review + report
target: .qa/REPORT.md
contract: all
status: TODO
depends_on: [24]
---
## Objective
1. Fresh full gates: tsc+lint zero (all 3 packages touched), full Playwright suites
   green (web suite incl. M1 specs + the live magic-link spec).
2. Banned-pattern grep over all touched code (mock|fake|stub|dummy|TODO|FIXME|lorem) —
   ZERO in shipped paths (test helpers exempt if real, e.g. Mailhog client).
3. Fresh CRITIC pass over the whole delivered surface (contracts vs real responses,
   enumeration-safety, ownership leaks, enumeration of error paths, i18n parity, no
   hardcoded copy) + a second consecutive clean pass required by the gate.
4. Write .qa/REPORT.md: delivered per feature with DB proofs (console outputs, Mailhog
   evidence, e2e tails), endpoints/models/pages created, the Google BLOCKED item with
   its precise unblock step, seeds (D9), security findings (enumeration-safe request
   endpoint, hashed single-use tokens, parent ownership enforcement, rate limits).
5. Reconcile STATE.json/STATE.md; stop the watchdog.
## Done criteria
- Two consecutive clean critic passes + clean greps; report written; board closed.
## Evidence
(filled by builder/verifier)
