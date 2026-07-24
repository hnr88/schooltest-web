---
id: 014
title: Full regression + critic gate + DONE report
layer: regression
kind: verify
slice: whole-mission proof
target: schooltest-web + schooltest-api
contract: all
status: TODO
depends_on: [005, 008, 009, 010, 011, 013]
---
## Objective
Final gate: pnpm tsc --noEmit + pnpm lint clean in BOTH repos; full Playwright suite
(E2E_PORT=3110) green; a fresh critic pass asking "what is faked/stubbed/unverified/off-
contract"; banned-pattern grep; .qa/REPORT.md written.
## Done criteria
- Two consecutive clean critic scans; suite green (flake policy: gate on passed count,
  isolation-prove any red); REPORT.md lists every delivered item with evidence + screenshots.
