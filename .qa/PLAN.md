# PLAN.md — mission plan & DAG

Mission: implement the design system + landing page from `/design-system-and-components/`
in schooltest-web; copy 100% from i18n JSONs (en/de); follow schooltest-web CLAUDE.md + rules.

## Complexity band
SMALL-MEDIUM: 16 tasks (band 6–25). Justification: frontend-only, no datastore/API, one
module + one page + e2e; but heavy content (full token port, ~200 message keys, 13 landing
sections, ~20 DS components, 4 e2e specs) — more than "one focused feature". 7 waves ≤ 8
cap; 16 tasks ≤ 40 cap. Concurrency: 1 (mission parameter) — serial build→verify per task.

## Wave plan
- W0 (orchestrator): QA artifacts, contracts, tasks, watchdog, boot-gate. [DONE]
- W1 foundation: 01 tokens/fonts/assets · 02 messages en/de
- W2 design-system module: 03 actions/brand · 04 forms · 05 feedback/cards · 06 overlays/data
- W3 showcase: 07 /design-system page
- W4 landing A: 08 header/hero · 09 features/stats
- W5 landing B: 10 how/pricing/faq · 11 cta/footer · 12 compose/cleanup
- W6 e2e: 13 landing specs · 14 showcase specs · 15 a11y/responsive
- W7 regression: 16 final

## DAG (adjacency)
01: — · 02: — · 03: 01 · 04: 01 · 05: 01 · 06: 01 · 07: 02,03,04,05,06 ·
08: 01,02,03 · 09: 01,02,03,05 · 10: 01,02,03,05,06 · 11: 01,02,03,06 ·
12: 08,09,10,11 · 13: 12 · 14: 07,12 · 15: 07,12 · 16: 13,14,15
Validation: no cycles, no dangling deps, no orphans; every contract entry (C-TOKENS, C-DS,
C-CONTENT, C-PAGE-LANDING, C-PAGE-DS, C-E2E ×6) is owned by ≥1 task.

## Discipline per task
BUILD (coder subagent) → INDEPENDENT VERIFY (fresh explore subagent, read-only) →
update task file + STATE → next. After each wave: wave review (diff read + critic agent)
→ gates (tsc+lint) → commit on main. Watchdog: stuck-checker only (D10).
