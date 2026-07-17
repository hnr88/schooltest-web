# STATE.md — mission board (human-readable mirror of STATE.json)

Mission: design system + landing page from `design-system-and-components/` in
schooltest-web; all copy from i18n JSONs (en/de). Contracts: .qa/CONTRACTS.md.
Task files: .thellmspace/tasks/NN-*.md. Plan: .qa/PLAN.md.

## Board
| # | Task | Depends | Status | Verify |
|---|------|---------|--------|--------|
| 01 | Foundation tokens/fonts/assets | — | DONE | PASS |
| 02 | Messages en/de | — | DONE | PASS |
| 03 | DS actions & brand | 01 | DONE | PASS |
| 04 | DS forms barrel | 01 | DONE | PASS |
| 05 | DS feedback & cards | 01 | DONE | PASS |
| 06 | DS overlays & data | 01 | DONE | PASS |
| 07 | /design-system showcase | 02–06 | DONE | PASS |
| 08 | Landing header/hero | 01–03 | DONE | PASS |
| 09 | Landing features/stats | 01–03,05 | DONE | PASS |
| 10 | Landing how/pricing/faq | 01–03,05,06 | DONE | PASS |
| 11 | Landing cta/footer | 01–03,06 | DONE | PASS |
| 12 | Compose + cleanup | 08–11 | DONE | PASS |
| 13 | E2E landing | 12 | DONE | PASS |
| 14 | E2E showcase | 07,12 | DONE | PASS |
| 15 | E2E a11y/responsive | 07,12 | DONE | PASS |
| 16 | Final regression | 13–15 | TODO | — |

## Per-layer rollup
- ui: 01,03,04,05,06,07,08,09,10,11 — all TODO
- frontend (content): 02 — TODO
- integration: 12,13,14 — TODO
- a11y: 15 — TODO · regression: 16 — TODO

## Waves
W1 {01,02} → W2 {03,04,05,06} → W3 {07} → W4 {08,09} → W5 {10,11,12} →
W6 {13,14,15} → W7 {16}

Boot-gate: PASSED (baseline tsc 0 / lint 0 errors; playwright webServer boots app on
:3100; existing home.spec green — see .qa/STATE.json baseline).
