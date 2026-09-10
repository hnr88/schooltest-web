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
