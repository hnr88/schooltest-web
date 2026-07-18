---
id: 24
title: E2E — a11y sweep + responsive + Google-BLOCKED documentation + regression
layer: a11y
kind: verify
slice: axe on all new pages, mobile+desktop sweeps, full-suite regression
target: tests/e2e/a11y-auth.spec.ts, .qa/screenshots/
contract: all
status: TODO
depends_on: [19, 20, 21, 22, 23]
---
## Objective
- axe (existing @axe-core/playwright) on /sign-in, /sign-up, /dashboard (authed) →
  zero serious/critical; 375px + 1280px sweeps (no h-scroll, 44px targets, focus order);
  screenshots to .qa/screenshots/ (sign-in, sign-up, dashboard, dashboard-mobile).
- Full existing suite must stay green (19 landing/DS specs from M1 — they must not
  regress with the new pages).
- Google flow: document the BLOCKED e2e (D5) in the spec file as a skipped test with
  the exact reason + what ships instead (button + callback + provider config) —
  test.skip with a comment, NOT a fake pass.
## Done criteria
- axe zero; sweeps pass; full suite green; the skip note exists with the D5 reason.
## Evidence
(filled by builder/verifier)
