# B02 — the managed Codephant test runner: why it never executed, and how to run it

**Verdict: the root cause is NOT in this repo.** It is an argument-order bug in the
Codephant desktop app's own managed Playwright runner. Nothing in
`schooltest-web/playwright.config.ts` or `schooltest-api/playwright.config.ts` was
changed to fix it, and nothing needed to be. The runner executes today, from an
unmodified checkout, as long as the caller **omits the `project` argument** to
`tests.run`.

Measured 2026-09-10 20:00Z, Codephant 2.1.27, `@playwright/test` 1.61.1.

---

## 1. The failing invocation

The runner lives in the app bundle (read-only, root-owned):

- `/opt/Codephant/resources/next/standalone/.next/server/chunks/src_modules_playwright_lib_playwright-run_ts_1uis_h4._.js`
  — `playwrightRunManager.startPreparedRun` / `launchNextSuite`
- the same `chunks/` directory, `e.s(["buildRunArgs", …])` — the argument builder

De-minified, the two relevant pieces are:

```js
// buildRunArgs(request)
const args = ['test', '--reporter=list,json'];
if (request.project) args.push('--project', request.project);   // <-- TWO tokens
if (request.mode === 'failed') args.push('--last-failed');
else {
  if (request.file) args.push(`${escapeGrep(request.file)}$`);  // <-- positional, AFTER --project
  if (request.grep) args.push('--grep', request.grep);
  else if ((request.mode === 'test' || request.mode === 'update-snapshots') && request.title)
    args.push('--grep', escapeGrep(request.title));
  if (request.mode === 'update-snapshots') args.push('--update-snapshots');
}
return args;

// launchNextSuite(run) — one child per suite
const env = buildChildEnv({
  PLAYWRIGHT_JSON_OUTPUT_NAME: plan.reportFile,   // /tmp/pw-run-<runId>.json.<n>
  FORCE_COLOR: '0',
  CODEPHANT_APP_SESSION: undefined,
});
env.PATH = buildExecPath(plan.suite.cwd);
spawn(process.execPath, [plan.cli, ...plan.args], { cwd: plan.suite.cwd, env });
```

`plan.args` finishes with `--config <configFile>` and `--output=<projectRoot>/.codephant/tests/runs/<runId>/<suiteHash>`,
plus `--workers=1` when the request carries `uiUrl`. After the child exits, the
runner reads `plan.reportFile`; if that file is absent it pushes the message
everybody has been staring at: `"<suite>: did not produce a readable JSON report."`

So the argv that has been failing all day, verbatim, is:

```
/opt/Codephant/codephant.bin \
  /home/hnr/Code/schooltest/schooltest-web/node_modules/.pnpm/@playwright+test@1.61.1/node_modules/@playwright/test/cli.js \
  test --reporter=list,json --project chromium \
  '/home/hnr/Code/schooltest/schooltest-web/tests/e2e/class-detail-empty-import\.spec\.ts$' \
  --config /home/hnr/Code/schooltest/schooltest-web/playwright.config.ts \
  --output=/home/hnr/Code/schooltest/.codephant/tests/runs/<runId>/72117a4e5da7a782
# cwd: /home/hnr/Code/schooltest/schooltest-web
# env: app env minus a blocklist, plus PLAYWRIGHT_JSON_OUTPUT_NAME=/tmp/pw-run-<runId>.json.0, FORCE_COLOR=0
```

## 2. The root cause, and the evidence that proves it

Playwright's CLI declares `--project <project-name...>` as a **variadic** option.
Commander therefore keeps consuming following non-option tokens as extra project
names. The runner emits `--project` and `chromium` as two tokens and *then*
appends the positional file filter, so **the file filter is swallowed as a second
project name**:

```
Error: Project(s) "/home/hnr/Code/schooltest/schooltest-web/tests/e2e/class-detail-empty-import\.spec\.ts$" not found. Available projects: "chromium"
    at Object.filterProjects (…/playwright/lib/runner/index.js:2096:11)
    at runTests (…/playwright/lib/cli/testActions.js:61:30)
```

Playwright exits **1 in ~0.3 s, before any reporter is constructed**, so no JSON
file is ever written — which is exactly the 0.3–1.0 s / `exitCode 1` /
`summary: null` / `results: []` / "did not produce a readable JSON report"
signature recorded on all ten retained runs.

Reproduced by hand with a faithful replica of `launchNextSuite` (same
`process.execPath`, same cwd, same env rebuilt from `/proc/<app server pid>/environ`
through the real `buildChildEnv` blocklist):

```
ELAPSED_MS: 293
EXIT: 1
STDERR: Error: Project(s) "…class-detail-empty-import\.spec\.ts$" not found. Available projects: "chromium"
REPORT EXISTS: false
```

Argument-order matrix — identical command otherwise, `--list` so nothing runs.
Only the runner's own form fails:

| # | form | result |
|---|------|--------|
| A | `--project chromium '<file>$'` (**the runner's**) | `Error: Project(s) "<file>$" not found` |
| B | `--project=chromium '<file>$'` | 3 tests listed |
| C | `'<file>$' --project chromium` | 3 tests listed |
| D | no `--project` | 3 tests listed |

Same on the API suite (`--project unit '<unit spec>$'` → same error; without
`--project` → `Total: 14 tests in 1 file`), which is why the failure was suite-,
spec- and caller-independent.

**Why suite discovery always worked while every run died:** the catalog path
(`runPlaywright` → `test --list --reporter=json [--config] [<file>$ …]`) never
passes `--project` at all, so nothing is swallowed. It also falls back to parsing
JSON from **stdout** when the output file is missing. The run path has neither
protection: no fallback, and `--project` always first.

## 3. The two previously recorded causes were both dead ends — and one comment is wrong

- `reuseExistingServer` was already `true` and is not implicated. Keep it `true`.
- The config's `json` reporter is irrelevant either way: the CLI flag
  `--reporter=list,json` **overrides** the config's `reporter` list, and the
  report location comes from `PLAYWRIGHT_JSON_OUTPUT_NAME`, not from
  `outputFile: 'test-results/results.json'`. That is also why the API config,
  with no json reporter at all, behaves identically.
- **Correction for the next reader:** `schooltest-web/playwright.config.ts` states
  that "the runner sets CI". It does not. Measured on the live app server process
  (`/proc/1141811/environ`): there is no `CI` variable, and `buildChildEnv` only
  copies the app env minus a fixed blocklist (`PORT`, `NODE_ENV`, `AUTH_SECRET`,
  `CODEPHANT_APP_SESSION`, …) and then adds `PLAYWRIGHT_JSON_OUTPUT_NAME` and
  `FORCE_COLOR=0`. Nothing sets `CI`. The comment was left in place on purpose —
  that file holds several live workers' verification and is not mine to churn for
  a comment — but the claim is false and should not be built on.

## 4. How to run the managed runner today (the workaround every worker needs)

**Omit `project` in `tests.run`.** Everything else stays as documented.

```
tests.run({ suiteId: 'schooltest-web/playwright.config.ts',
            mode: 'file',                       // or 'test' + title
            file: 'schooltest-web/tests/e2e/<spec>.spec.ts',
            uiUrl: 'http://localhost:3002' })   // UI runs only
```

- `schooltest-web` declares exactly **one** project, `chromium`, so omitting
  `project` still satisfies the in-tab fixture's Chromium requirement.
- Always scope with `mode: 'file'` or `mode: 'test'`. On `schooltest-api`,
  omitting `project` means all three projects are eligible, and the file filter is
  what keeps a run off the live `mutating`/`quiescent` e2e lanes.
- For `mode: 'test'`, the `title` must be the **leaf** test title only. Playwright
  greps against a space-joined title path, so a title containing the ` › `
  separator matches nothing and the run dies with
  `Error: No tests found` (run `47fcd4e1-f9b8-4b51-86ed-104495a2dfa7`).

## 5. Proof: managed runs that actually executed

**UI / in-tab, web suite — PASSED**
`runId 815e32cc-fca0-4fa1-aa57-4a77ebb109a2`

```
request: { uiUrl: 'http://localhost:3002', suiteId: 'schooltest-web/playwright.config.ts',
           mode: 'file', file: 'schooltest-web/tests/e2e/auth-logo.spec.ts' }
status:  passed        exitCode: 0        errors: []
summary: { status: 'passed', passed: 2, failed: 0, skipped: 0, flaky: 0, durationMs: 16379 }
results: desktop: each auth page renders one visible logo   passed 10532ms
         mobile:  each auth page renders one visible logo   passed  4686ms
```

Both tests executed their page assertions in the visible Codephant Browser tab and
each retained a `codephant-browser:815e32cc-…` PNG, inspected: a real 1280x800
desktop render and a real 375px mobile render of the auth surface.

```
.codephant/tests/runs/815e32cc-fca0-4fa1-aa57-4a77ebb109a2/evidence/
  fef6598571e413813583b54a5a883ed663468ac47c398c4b4ca076db308567ff.png  (desktop 1280x800)
  a39a18ab4d535178b4282d9b8a1def42ebfa64e9c88534f11b2050bd3c7be403.png  (mobile 375px)
```

**Non-UI, API suite — PASSED**
`runId 075de8fc-2342-494a-9776-6925568f5891`

```
request: { suiteId: 'schooltest-api/playwright.config.ts', mode: 'file',
           file: 'schooltest-api/tests/unit/acara-phase-v2.spec.ts' }
status:  passed        exitCode: 0        errors: []
summary: { status: 'passed', passed: 14, failed: 0, skipped: 0, flaky: 0, durationMs: 1119 }
```

Both suites had previously failed identically on every one of the ten retained
runs. Nothing in either repo changed between those failures and these passes —
only the absence of the `project` argument.

## 6. The app-side fix (for the Codephant maintainers)

In `buildRunArgs`, either

- emit the option as a single token: `args.push(`--project=${request.project}`)`, or
- push the positional file filter **before** `--project`.

Both were verified against Playwright 1.61.1 (matrix rows B and C above). A
belt-and-braces second fix: give the run path the same stdout fallback the
discovery path already has, so a Playwright startup error surfaces as its real
message instead of "did not produce a readable JSON report".

## 7. One unrelated blocker found while proving this

The task's suggested proof spec, `tests/e2e/class-detail-empty-import.spec.ts`
"flow 12", **executed** under the fixed invocation but failed at sign-in, twice,
with the UI showing *"Something went wrong on our side. Please try again."*
(runs `1cac6276-b97e-44a8-ab52-10eecf6cbaf3`, `c057f17b-c90d-46d9-b6dc-5c1563ee8b83`).

That is not a runner defect and not a credential problem — a direct
`POST /api/auth/local` with the seeded password returned **200** at 22:57 local.
The API's global per-IP rate limit was saturated by the four concurrent journey
workers; `/tmp/opencode/strapi12.log` at the time of the run:

```
[2026-09-10 22:58:43.228] warn: [rate-limit] 127.0.0.1 exceeded 120 req/60000ms on /api/auth/local
[2026-09-10 22:58:43.228] http: POST /api/auth/local (1 ms) 429
… (repeated; even GET /_health returned 429 at 22:58:54)
```

`classifySignInError` maps any non-400 response to `serverError`, which is the
exact string on the screen. Re-run login-bearing specs when the fleet is quieter,
or serialise them; the runner itself is fine.

Screenshot of that state (retained by the managed run, inspected):
`.codephant/tests/runs/c057f17b-c90d-46d9-b6dc-5c1563ee8b83/evidence/42f74275c3601d62ae1f7d9f72b323aca3838c05efa877efd9bee59ed4ec20b8.png`

## 8. The replica used in section 2

Kept as a code block, not a committed `.js`: `.qa/**` is **not** in
`eslint.config.mjs`'s ignore list, so a stray script here would be linted as app
source and red the shared `pnpm lint` gate. Save it outside the repo to re-run it.

```js
// Faithful replica of Codephant's managed runner spawn (playwright-run.ts:launchNextSuite)
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

const SERVER_PID = process.env.REPRO_SERVER_PID || '1141811';
const BLOCK = new Set(['PORT','TARGET_PORT','TERMINAL_PORT','TERMINAL_HOST','AUTH_SECRET','CODEPHANT_APP_SESSION','AUTH_EMAIL','AUTH_PASSWORD','ALLOWED_ORIGINS','DEFAULT_PROJECTS_DIR','INDEXNOW_KEY','NODE_ENV','NEXT_RUNTIME','NEXT_TELEMETRY_DISABLED','__NEXT_PRIVATE_PREBUNDLED_REACT','__NEXT_PRIVATE_RUNTIME_TYPE']);

const raw = fs.readFileSync(`/proc/${SERVER_PID}/environ`, 'utf8').split('\0').filter(Boolean);
const appEnv = {};
for (const entry of raw) {
  const eq = entry.indexOf('=');
  appEnv[entry.slice(0, eq)] = entry.slice(eq + 1);
}
const env = {};
for (const [k, v] of Object.entries(appEnv)) {
  if (v === undefined || BLOCK.has(k) || k.startsWith('NEXT_PUBLIC_')) continue;
  env[k] = v;
}

const projectRoot = '/home/hnr/Code/schooltest';
const cwd = process.env.REPRO_CWD || '/home/hnr/Code/schooltest/schooltest-web';
const configFile = process.env.REPRO_CONFIG || path.join(cwd, 'playwright.config.ts');
const spec = process.env.REPRO_SPEC || path.join(cwd, 'tests/e2e/class-detail-empty-import.spec.ts');
const project = process.env.REPRO_PROJECT || 'chromium';
const runId = 'repro-' + Date.now();
const reportFile = path.join('/tmp', `pw-run-${runId}.json.0`);
const outputDir = path.join(projectRoot, '.codephant', 'tests', 'runs', runId, 'deadbeefdeadbeef');
fs.mkdirSync(outputDir, { recursive: true });

// resolvePlaywrightCli
const req = createRequire(path.join(cwd, 'package.json'));
let cli = null;
for (const id of ['@playwright/test/cli', 'playwright/cli']) { try { cli = req.resolve(id); break; } catch {} }

// buildExecPath: cwd/node_modules/.bin first, then login shell PATH, then process.env.PATH, then fallbacks
env.PATH = [path.join(cwd, 'node_modules', '.bin'), appEnv.PATH || '', process.env.PATH || ''].join(path.delimiter);
env.PLAYWRIGHT_JSON_OUTPUT_NAME = reportFile;
env.FORCE_COLOR = '0';

const escapeGrep = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const args = [cli, 'test', '--reporter=list,json', '--project', project, `${escapeGrep(spec)}$`, '--config', configFile, `--output=${outputDir}`];
if (process.env.REPRO_WORKERS1) args.push('--workers=1');

const execPath = process.env.REPRO_EXEC || '/opt/Codephant/codephant.bin';
console.log('EXECPATH:', execPath);
console.log('CWD:', cwd);
console.log('ARGV:', JSON.stringify(args));
console.log('REPORT_FILE:', reportFile);
console.log('CI in env:', 'CI' in env, '| ELECTRON_RUN_AS_NODE:', env.ELECTRON_RUN_AS_NODE);
const started = Date.now();
const res = spawnSync(execPath, args, { cwd, env, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
console.log('--- STDOUT ---'); console.log(res.stdout);
console.log('--- STDERR ---'); console.log(res.stderr);
console.log('EXIT:', res.status, 'signal:', res.signal, 'error:', res.error && res.error.message);
console.log('ELAPSED_MS:', Date.now() - started);
console.log('REPORT EXISTS:', fs.existsSync(reportFile), fs.existsSync(reportFile) ? fs.statSync(reportFile).size + ' bytes' : '');
```

---

## 9. Re-verification after the attempt-1 rejection (2026-09-10, 20:15–20:35 UTC)

Attempt 1 was rejected on its regression command, not on the runner:

```
$ pnpm --dir schooltest-web exec playwright test tests/e2e/class-detail-empty-import.spec.ts --project=chromium --workers=1
  Error: fixture empty class must have no students
  Expected: 0   Received: 2        ← flow 12, class-detail-empty-import.spec.ts:48
```

### 9.1 That red was fixture pollution, and it is now fixed

`dd51a1f` is an evidence-only commit — `git show --name-only` is four paths under
`.qa/journeys/B02-managed-runner/`, zero spec files and zero config files:

```
$ git show --name-only --format="" dd51a1f | grep -Ec '\.spec\.ts|playwright\.config\.ts'
0
```

The `Received: 2` was two **live probe students left on the empty fixture class**
by a crashed run of this same spec's flow 13 — the leak its own docblock predicts
("a run that died mid-flow-13 left two archived probes behind"):

```sql
select s.document_id, s.given_name, s.status, s.created_at
  from students s
  join students_class_lnk l on l.student_id = s.id
  join classes c on c.id = l.class_id
 where c.name = 'EAL/D Year 8 - Room 5 (no students)';

 zwkwlhjpcc4on8xjfib1zin0 | Repro1789067662A     | archived | 22:14:22
 d0s2vjvtk6pgcrilphr64f7u | Repro1789067662B     | archived | 22:14:22
 pyeqqcl13rdz8q5kgymx0522 | Mixed1789067687A     | archived | 22:14:47
 h9elyjbj5rnnvzwsfcbvjoxl | Import Probe …171A   | ACTIVE   | 23:12:52
 p0bxr13rzck9trkn7s9jgpo2 | Import Probe …171B   | ACTIVE   | 23:12:52
```

`Import Probe <stamp>A/B` is `PROBE_ROWS` in the spec, and the stamp decodes to
`2026-09-10T20:12:37.171Z` — **seven minutes after** `dd51a1f` was committed
(20:05:04Z). No live process owned that spec, so the rows were orphans, and they
red flow 12 permanently for every later run.

Cleared through the spec's OWN documented cleanup route (`deleteStudents` →
`DELETE /api/students/:documentId` as the seeded `apiadmin`), never raw SQL and
never a spec edit:

```
DELETE h9elyjbj5rnnvzwsfcbvjoxl -> 204
DELETE p0bxr13rzck9trkn7s9jgpo2 -> 204
active students on the empty fixture class: 0
```

The rejection's own command then passes, and its `afterEach` leaves the class at
0 again:

```
$ pnpm exec playwright test tests/e2e/class-detail-empty-import.spec.ts --project=chromium --workers=1
  3 passed (18.9s)      exit 0
```

### 9.2 The runner: proven again, and the failure mode reproduced on demand

Fresh runs under this task (`314e7af0-50f2-48c3-8c55-7dc3df9d1416`):

| runId | request | outcome |
|---|---|---|
| `aea2a74d-a242-485c-bf68-9c6ebf8a3f4c` | api unit, no `project` | **passed 14 / failed 0, exit 0** |
| `f25e1143-a55e-4f39-9269-188bf6b8ebde` | in-tab, class-detail-empty-import | executed; 1 failed 2 skipped, screenshot retained |
| `9f36d3b2-…`, `3a16cb78-…` | in-tab, auth-logo | executed; 1 passed 1 failed, screenshots retained |
| `ee6b2a75-…`, `3d8af24e-…` | in-tab, a11y-auth / teacher-sidebar | executed; screenshots retained |

Every one produced a populated `summary`, per-test `results` and a retained
`codephant-browser:<runId>` PNG. **The `project` argument remains the only way to
reproduce the original death**, and a peer did so independently while this was
being re-verified — run `38b8d522-312b-4f61-8a93-a737f73c3c15` (J03 worker):

```
request: { uiUrl: …, mode: 'file', file: '…/journey-03-import-students.spec.ts', project: 'chromium' }
finished in 1.054s   exitCode 1   summary: null   results: []
errors: "schooltest-web: did not produce a readable JSON report." / …
```

Nine of the ten retained runs omit `project` and all nine executed; the one that
passes it is the one that died. Two of the nine were fully green **in-tab** runs
by other callers: `989ce2dd-ffe7-4582-a93b-6641a68a901c` (the orchestrator's own,
auth-logo, 2 passed, 2 screenshots) and `13bc094e-4179-48c4-a9bf-0678d641f2a0`
(J06, journey-06, 2 passed).

## 10. The SECOND defect: the visible tab is shared, and its session persists

This is what actually stops in-tab UI evidence now, and it is not the runner's
argument bug. `uiUrl` runs reuse the one visible Codephant Browser tab **and its
localStorage**. The app keeps its JWT in `app.auth.token` there
(`src/lib/axios/strapi.ts:22`), so a session left behind by a previous run — any
agent's — is still signed in when the next run starts.

Every spec that drives the real form then **hangs**: `loginAs`/`signIn` does
`page.goto('/sign-in')`, an authenticated app redirects that to `/dashboard`, and
`getByLabel(emailLabel)` waits for a field that is no longer on the page until the
test times out. Not a login failure — a missing form.

Evidence, all with the tab's own retained snapshot showing a *dashboard* where an
auth page was expected:

| run | spec | in-tab | headless, same tree |
|---|---|---|---|
| `f25e1143` | class-detail-empty-import flow 12 | timeout 30s; snapshot = `t2-alvarez` **Teacher** on /dashboard/results | **3 passed** |
| `3d8af24e` | teacher-sidebar (teacher rail) | timeout 30s | **7 passed** (1 unrelated red) |
| `052df2c5` (J01) | journey-01-ops-invite-school | timeout 240s | — |
| `1bf0231c` (J06) | journey-06 | timeout 30s | — |

**It also produces false passes.** `auth-logo` asserts exactly one visible
`[data-slot="logo"]` on each auth route. In-tab, its *desktop* leg passed while
the tab sat on a teacher dashboard — because the dashboard rail renders that same
`data-slot`. Only the *mobile* leg failed, and only because the rail is collapsed
at 375px (`3a16cb78`, `9f36d3b2`; both `2 passed` headless). An in-tab green on a
polluted tab can mean nothing.

Specs that seed the token themselves are immune: `ee6b2a75` (a11y-auth, which
`addInitScript`s `app.auth.token`) rendered the seeded parent account correctly.

**There is no in-repo remedy.** The app's only sign-out path is React state —
`SchoolAccountScreen` holds the tab in `useState<AccountTab>('details')`
(`src/modules/school-admin/components/SchoolAccountScreen.tsx:20`), so no URL
reaches `AccountSignOutPanel` and the tab cannot be cleared by navigation. The
fix belongs to the runner: **clear storage (or use a fresh context) for each
`uiUrl` run**, exactly as `--project` belongs to `buildRunArgs`. Until then, an
in-tab spec must either seed its own token or run while the tab is signed out,
and the operator can clear it by hand between waves.

### Unrelated reds observed while probing (for B04 / the orchestrator)

- The parent portal is now gated — "Not part of this release", string live in a
  peer's **uncommitted** `src/i18n/messages/en.json`. `a11y-auth.spec.ts` went
  green (10 passed, 20:26Z) → red (20:30Z) with no commit in between.
- `ops-session-expired.spec.ts` and `teacher-sidebar.spec.ts:187` — the GAP-6
  expired-session wall — are red headless.
- `settings-tabs.spec.ts:69` red headless; `students-list.spec.ts` all 8 skipped.
