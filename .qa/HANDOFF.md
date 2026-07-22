# HANDOFF — mission `st-portal-redesign` (resume from here)

Written 2026-07-22 ~21:40. If you are a fresh session: read this file, then `.qa/STATE.json`,
then carry on. **Do not restart the mission and do not re-run the intake** — it produced ~350KB of
verified artifacts that are on disk and still valid.

## What the mission is

Implement the design export at `schooltest-web/dashbaord-design/` across the SchoolTest **parent
portal**, wired to the real Strapi API, following `docs/`, inventing nothing, preserving existing
functional behaviour, adding real motion, doing mobile properly.

Full plan: `.qa/PLAN.md`. Decoded operator instruction and scope boundaries: `.qa/DECISIONS.md`
**D-SCOPE-1 / D-SCOPE-2 / D-SCOPE-3**.

## The five things that reframe this mission

1. **The design is a static HTML export, and it is nearly motionless.** Zero `transition:` and
   zero `@keyframes` in the entire Parent Portal export. The design system defines six keyframes
   (`st-fade-in`, `st-pop-in`, `st-toast-in`, `st-spin`, `st-shimmer`, `st-rec-pulse`) that **no
   screen references**. The operator requires motion and rejects static UI, so motion is authored
   from those six plus Tailwind transitions — never a new dependency, always with a
   `prefers-reduced-motion` variant (`.qa/DECISIONS.md` **D-DESIGN-3**).
2. **The design has no focus states and actively removes them** (`outline:none` inline on both
   search inputs). WCAG 2.2 AA and `.claude/rules/quality.md` require them, so focus rings are
   authored from the design's own `--ring` token. Fix the markup; never suppress the rule.
3. **No scheduling model exists anywhere in the API.** No `scheduled_at` / `due_at` /
   `assignment` / `sitting` field on any content-type; `class` is only
   `{name, year_band, teacher, students}`. The design's `coming up` metric and its "Coming up"
   list therefore have no data source — **B-1 / B-2, BLOCKED, not faked.**
4. **The product docs forbid several metrics the design shows.**
   `docs/SCHOOLTEST_DOC0_PLATFORM_PRD_V2.md:25,46,193` — "no cut scores", "no cross-skill
   composite score anywhere in the system", "do not build a CEFR scorer". So `last result 74%`,
   `Progress to B2 68%`, `Avg. score 86%`, `Trend +4%`, `Top 15%` are **B-3 … B-5, BLOCKED**.
   Those slots get the sanctioned vocabulary instead: CEFR band (a Crosswalk lookup), ACARA
   phase, `readiness`, and per-attribute mastery probability + `attribute_status`.
5. **Several `app--*` design slices are a different product.** `app--child-profile.html` and
   `app--result-detail.html` show subjects (Math/Danish/English), letter grades, class averages
   and a Danish school. SchoolTest measures four English skills against CEFR/ACARA. Those are
   **B-6, out of the data model** — the `portal--*` slices are the SchoolTest-domain ones.

## Where to look

| Need | File |
|---|---|
| Machine DAG, statuses, readiness | `.qa/STATE.json` (authoritative) |
| Human mirror | `.qa/STATE.md` |
| Per-task detail | `.thellmspace/tasks/NNN-*.md` (also at `.qa/tasks`, a symlink) |
| Wave plan + definition of done | `.qa/PLAN.md` |
| New API contracts + the 8 BLOCKED metrics | `.qa/CONTRACTS.md` (the addendum at the end) |
| Every decision | `.qa/DECISIONS.md` (the `st-portal-redesign` section at the end) |
| Binding rules per package | `.qa/RULES.md` |
| Design, sliced and citable | `.qa/design/screens/` (114 slices) + `.qa/design/screens-index.json` |
| Design specs (the buildable detail) | `.qa/design/spec/01…06-*.md` |
| Existing routes/modules/hooks | `.qa/intake/web-inventory.md` |
| Every parent-reachable endpoint + gaps G1-G17 | `.qa/intake/api-inventory.md` |
| Product vocabulary + rule conflicts | `.qa/intake/docs-constraints.md` |
| Design↔API↔docs reconciliation | `.qa/intake/RECONCILIATION.md` |

## Environment (all verified live at intake)

- api `:5500` (Strapi 5.50.1), web `:3100` (Next 16.2.10), postgres `:5540`, redis `:6390`,
  mailpit `:1125/:8125`, minio `:9010`, r-scoring `:8790`. Namespace `st1` — **reused, nothing
  parallel was created** (`.qa/DECISIONS.md` **D-OPS-1**).
- **Never run `pnpm dev`/`build`/`start`** (`CLAUDE.md` law 12). Playwright's `webServer` block
  starts the app itself and reuses a running one. Verification is `pnpm exec playwright test`.
- Servers are kept alive by the **root** watchdog (pid 406706). This mission's watchdog
  (`.qa/qa-watchdog.sh`) is **stuck-checker only** and deliberately never restarts a server, so
  the two cannot race (`.qa/DECISIONS.md` **D-OPS-2**).
- Seeded parent for e2e: `tests/e2e/helpers/auth.ts` → `parent@schooltest.local`. Accounts come
  only from the Strapi bootstrap seed — **never a signup form, never the admin UI**.
- DB probe: `PGPASSWORD=$(grep '^DATABASE_PASSWORD=' schooltest-api/.env | cut -d= -f2-) psql -h 127.0.0.1 -p 5540 -U schooltest -d schooltest`

## Boot-gate — PASSED (2026-07-22 ~21:00)

- postgres accepts a real connection — 1542 rows in `up_users`
- `POST /api/auth/local` seeded parent → `200` + real JWT (user id 49)
- `GET /api/my/students` with that JWT → `200` + **10 real seeded student rows**
- same with no token → `403` (auth boundary live)
- web `/` → `200` (`localePrefix: 'as-needed'` means `/` IS the en route)
- real data present: 382 students · 2358 results · 2611 sessions · 1570 notifications ·
  312 schools · 8 agents

## Regression baseline — record it, do not lose it

`pnpm exec playwright test` before any edit: **157 passed / 1 failed / 2 skipped / 2 did not run**
of 162.

The one red is **pre-existing and owned by wave W9**:
`tests/e2e/notification-preference-controls.spec.ts:75` — after writing both opt-outs off and
reloading, the "Text messages" switch still reports `aria-checked="true"`. A real persistence /
read-back defect.

**Any other red at any point is a regression this mission caused. Stop and fix it.**

## How to run the loop

- Ready set = `status: TODO` with every `depends_on` `DONE`. Recompute after each task.
- **Concurrency 1** (operator parameter). One task in flight: a BUILD pass, then an INDEPENDENT
  VERIFY pass by a different agent that never built it. The builder never passes its own task.
- Every build subagent brief must include: its task `.md` verbatim, the `.qa/CONTRACTS.md` entry,
  the design slice path, and the binding rule files. It must run **no git write command**, must
  **never start/stop a server**, pnpm only, ≤200-line files / ≤120-line components.
- The orchestrator owns commits: one per wave, task-referenced, on `main`. **Never branch, never
  revert, never rewrite history.**
- After every wave, a fresh CRITIC agent hunts for anything missing / faked / stubbed /
  unpersisted / off-contract. Its findings become new tasks. The loop terminates only when the
  critic AND the banned-pattern grep both come back empty **twice consecutively**.
- Touch `.qa/heartbeat` while long subagents run so the stuck-checker does not false-trip.

## Workspace coordination

- `AGENTS-COORDINATION.md` has this mission's announcement under **Agent E**. Append there before
  changing shared surfaces, and announce any new env key.
- Root `.qa/` belongs to Agent D's `st-mvp-d` mission. **Do not write root state.**
- An **external auto-commit daemon** sweeps all three repos periodically (root `.qa` **OP-12**).
  Your tree can be committed mid-edit with a generated message. Do not rewrite history to tidy
  it — land the next coherent commit on top.

## Status at handoff

- Intake: **COMPLETE** (9 extraction documents + reconciliation).
- Boot-gate: **PASSED**. Watchdog: **RUNNING**. Baseline: **RECORDED**.
- Task DAG: authored into `.thellmspace/tasks/` across 12 waves, ids `001-339`, ~286 tasks.
- Build: **NOT STARTED** — W2 (backend metric surfaces) and W0 (tokens) are the two entry points;
  they have no dependencies on each other and W2 gates the dashboard.
