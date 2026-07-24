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

---

## UPDATE 2026-07-22 ~22:15 — reconciliation landed and CORRECTED the contract

`.qa/intake/RECONCILIATION.md` (534 lines) is now on disk and is the authoritative design↔API↔docs
map. Read it before building anything. Three things changed since this file was first written:

### 1. `C-DASH-HOUSEHOLD` v1 was WRONG and is superseded by Amendment A1

v1 returned a single per-child `cefrBand` / `cefrStageIndex` / `acaraPhase`. That is a
**cross-skill composite**, forbidden outright by `DOC1:304` and `DOC0:46`. Corrected in
`.qa/CONTRACTS.md` → **AMENDMENT A1**: no per-child level exists; bands live **only** in
`skills[]`, one entry per skill, built from a real `GROUP BY skill` over all official results
(not the lossy 5-row window), with absent skills rendered explicitly as `not_assessed`.

**UI consequence:** the design's single CEFR tick rail becomes **one rail per skill**, over the
real ladder `pre_A1 → A1 → A2 → B1 → B2 → C1`. The design's `A1…C2` rail is not buildable — wrong
ladder AND a composite.

Any task file authored against v1 must be reconciled to v2 before it is built.

### 2. The BLOCKED list grew to 12 — the servability roll-up is 22 / 7 / 27

**22 SERVABLE · 7 NEEDS-BACKEND (all collapsing into the one new endpoint) · 27 BLOCKED.**
New blockers: **B-9** per-child single level · **B-10** hero prose projections and percent deltas ·
**B-11** school `rating` (no field, and `SchoolHit` is a strict schema so an extra key 500s) ·
**B-12** the "accept SchoolTest placement" copy claim (count is servable, claim is not).

The navy hero ships **1 of its 3 stats** truthfully today.

### 3. The in-flight uncommitted work is mostly SAFE and partly LOAD-BEARING

`.qa/intake/RECONCILIATION.md` §4 — and `.qa/DECISIONS.md` **D-SCOPE-3a** — replace the coarse
"drop what was created" reading:

- **§4.1 hard guarantee:** nothing under `src/lib/axios/**`, `*/queries/**` or `src/modules/auth`
  was touched. Data fetching, auth and route guarding are intact.
- **§4.4 lists 10 items of FUNCTIONAL wiring that must be preserved**, notably
  `src/modules/dashboard/lib/dashboard-overview.ts` — the only place dashboard metrics are derived
  today, and therefore **the seam where `C-DASH-HOUSEHOLD` lands** — and the search-store setter
  refactors whose outgoing request shape is unchanged and must not be "fixed" back.
- **§4.3 flags three coupled pairs**: `globals.css` ↔ `src/lib/utils.ts` `THEME_CLASS_GROUPS`
  (a renamed token silently breaks `cn()` merging, and `design-tokens.spec.ts` asserts it in the
  real DOM); the `design-system/index.ts` barrel; and the six i18n catalogues where copy is
  cosmetic but **key shape is not**.

**Read `.qa/intake/RECONCILIATION.md` §4.4 before deleting or rewriting anything.**

### Also done since the first handoff

- `eslint.config.mjs` ignores `dashbaord-design/**` and `.qa/**`; **`pnpm lint` is now 0 errors**
  (was 2, both from a vendored viewer script in the design export). — `.qa/DECISIONS.md` D-OPS-4
- 45 mission-2 task files archived to `.thellmspace/tasks-archive-mission2/`. — D-OPS-5
- Real-data reality recorded in **D-DATA-1**: practice sessions have real timestamps but a
  **5-second median duration** (synthetic seed). The dashboard will render honestly small numbers.
  Padding them to resemble the design's `4h 20m` is a fake-green violation — design the sparse
  state instead.
- Intake committed as **`b83fe9b`**. The 210 pre-existing uncommitted working-tree entries were
  deliberately left untouched.

---

## UPDATE 2026-07-22 ~22:45 — DAG complete, build loop proven, session handing off

### Where the run actually is

| Item | State |
|---|---|
| Intake | **COMPLETE** — 9 extraction docs + `RECONCILIATION.md` |
| Boot-gate | **PASSED** |
| Watchdog | **RUNNING** (stuck-checker only; root watchdog owns servers) |
| Task DAG | **COMPLETE + VALIDATED** — 286 tasks, 12 waves, 19 BLOCKED, 0 DAG errors |
| Build loop | **PROVEN** — task **060 DONE**, independently verified |
| Commits | web `b83fe9b`, `e96aa9d`, `d3bad8c`, `50b9394` · api `c76e093` |
| Remaining | **285 tasks.** 37 ready now — run `node .qa/gen-state.mjs` and read `.qa/STATE.md` |

### Start here next session

1. `node .qa/gen-state.mjs` → prints the ready set and rewrites `STATE.md`.
2. Pick from the ready set. **W2 is the critical path** — the dashboard cannot be verified without
   it. Next in sequence: **061** (pure ISO-week / trailing-7-day / practice-streak helpers), then
   **062** (the endpoint skeleton: service + controller + route + grant).
3. Run the loop exactly as task 060 did — that run is the template:
   BUILD subagent (task file verbatim + contract + design slice + rule files, no git writes, never
   restarts a server) → **INDEPENDENT VERIFY** subagent that never built it → mark DONE with the
   verifier's evidence → commit → re-derive readiness.

### Two corrections this session made to its own artifacts

- **`.qa/CONTRACTS.md` v1 of `C-DASH-HOUSEHOLD` is a footgun** if read top-down. It now carries a
  `SUPERSEDED IN PART BY AMENDMENT A1` banner. **A1 wins.** 23 task files were rippled to A1
  (commit `d3bad8c`); no status changed.
- **`D-VERIFY-2` — the regression gate is the PASSED COUNT, never the failing spec's name.** Three
  full-suite runs produced three different failure sets, all passing in isolation. Gate on
  157 (+1 per new test) and re-run any failure in isolation before calling it a regression.

### Findings task 060 surfaced for later waves

1. **Task 062 must keep its query parent-scoped.** `students.given_name` is nullable in Postgres
   and 30 rows are NULL, though 0 of 337 parent-linked students are. A non-parent-scoped query
   would throw on the Zod parse.
2. **`src/modules/children/lib/child-skills.ts:30` hand-declares a duplicate `CEFR_LADDER`** —
   a single-source-of-truth violation predating this mission. W3/W5 must collapse it onto the
   exported constant.
3. **The suite's flakiness and the W9 SMS bug may be the same defect class** — shared mutable seed
   state across parallel workers. W9/W11 should consider per-worker isolation of the seeded parent
   rather than only patching one spec.

### Honest statement of scale

286 tasks at build + independent verify each is a multi-session run. One task consumed ~340k
subagent tokens end to end. Nothing has been faked to make progress look faster: 19 tasks are
BLOCKED on purpose because the data or the product docs forbid them, and that number should be
expected to hold rather than shrink.
