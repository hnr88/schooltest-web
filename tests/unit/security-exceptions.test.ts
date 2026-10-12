// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, test } from 'vitest';

/**
 * W3-07 — the vulnerability-scan exceptions engine (`scripts/security-exceptions.mjs`) and its
 * CLI, plus static checks on `scripts/security-scan.sh`, the security workflow and the gitleaks
 * allow-list. Same mechanism and the same cases as schooltest-api (W3-06). No network, no docker,
 * no scanner: every case feeds stub reports (pnpm-audit, Trivy, KEV) to the pure functions or to
 * the CLI in a temp directory, so the tests are deterministic and fast.
 */

const WEB_ROOT = process.cwd();
const MODULE = join(WEB_ROOT, 'scripts', 'security-exceptions.mjs');
const SCAN_SH = join(WEB_ROOT, 'scripts', 'security-scan.sh');
const SHIPPED = join(WEB_ROOT, 'security', 'exceptions.json');
const WORKFLOW = join(WEB_ROOT, '.github', 'workflows', 'security.yml');
const GITLEAKS = join(WEB_ROOT, '.gitleaks.toml');

type Rec = Record<string, unknown>;
interface Engine {
  loadExceptions(file: string): Rec[];
  evaluate(
    advisories: Rec[],
    exceptions: Rec[],
    now: Date,
  ): {
    suppressed: Rec[];
    active: Rec[];
    expiredEntries: Rec[];
    overlongEntries: Rec[];
    invalidEntries: Rec[];
    unmatchedEntries: Rec[];
  };
  flagKev(advisories: Rec[], catalogue: unknown): Rec[];
  kevCveSet(catalogue: unknown): Set<string>;
  parseAudit(doc: unknown): Rec[] | null;
  parseTrivy(doc: unknown): Rec[];
  mergeAdvisories(list: Rec[]): Rec[];
  gateDecision(opts: Rec): { level: string; failed: boolean; reasons: string[] };
}

// The engine is a plain ESM .mjs file with no dependencies: import it by absolute file URL.
const importEsm = (href: string) => import(/* @vite-ignore */ href) as Promise<Engine>;

type Sev = 'critical' | 'high' | 'moderate' | 'low';
const NOW = new Date('2026-10-11T00:00:00Z');

function adv(over: Record<string, unknown> = {}) {
  return {
    source: 'pnpm-audit',
    kind: 'vulnerability',
    id: 'GHSA-aaaa-bbbb-cccc',
    ghsa: 'GHSA-aaaa-bbbb-cccc',
    cves: ['CVE-2026-0001'],
    package: 'left-pad',
    severity: 'high' as Sev,
    ...over,
  };
}

function entry(over: Record<string, unknown> = {}) {
  return {
    id: 'GHSA-aaaa-bbbb-cccc',
    package: 'left-pad',
    reason: 'Dev-only code path, not reachable from a request handler.',
    reachable: false,
    owner: 'Founder (Jarrad)',
    added: '2026-10-01',
    expires: '2026-12-01',
    ...over,
  };
}

function auditDoc(advisories: Array<Record<string, unknown>>) {
  return {
    advisories: Object.fromEntries(
      advisories.map((a, i) => [
        String(1000 + i),
        {
          id: 1000 + i,
          module_name: a.module,
          severity: a.severity,
          github_advisory_id: a.ghsa,
          title: 'stub advisory',
          url: `https://github.com/advisories/${a.ghsa}`,
          vulnerable_versions: '<1.0.0',
          patched_versions: '>=1.0.0',
          findings: [],
          ...(a.cves ? { cves: a.cves } : {}),
        },
      ]),
    ),
    metadata: { vulnerabilities: {} },
  };
}

describe('security exceptions engine (pure functions)', () => {
  test('the shipped exceptions file is a valid empty list', async () => {
    const m = await importEsm(pathToFileURL(MODULE).href);
    expect(m.loadExceptions(SHIPPED)).toEqual([]);
  });

  test('loadExceptions rejects malformed entries and lists every problem', async () => {
    const m = await importEsm(pathToFileURL(MODULE).href);
    const dir = mkdtempSync(join(tmpdir(), 'sec-exc-'));
    try {
      const file = join(dir, 'bad.json');
      writeFileSync(
        file,
        JSON.stringify([
          { id: 'GHSA-x', package: 'p', reason: '', reachable: 'no', owner: 'o', added: 'nope', expires: '2026-12-01' },
          entry(),
          entry(),
        ]),
      );
      let message = '';
      try {
        m.loadExceptions(file);
      } catch (e) {
        message = String((e as Error).message);
      }
      expect(message).toContain('"reason" must be a non-empty string');
      expect(message).toContain('"reachable" must be true or false');
      expect(message).toContain('"added" must be an ISO date');
      expect(message).toContain('duplicate id and package');

      writeFileSync(file, '{"not":"an array"}');
      expect(() => m.loadExceptions(file)).toThrow(/top level must be a JSON array/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('an exception past expires is reported in expiredEntries and no longer suppresses', async () => {
    const m = await importEsm(pathToFileURL(MODULE).href);
    const e = entry({ added: '2026-06-01', expires: '2026-09-01' });
    const r = m.evaluate([adv()], [e], NOW);
    expect(r.expiredEntries.map((x: Rec) => x.id)).toEqual(['GHSA-aaaa-bbbb-cccc']);
    expect(r.expiredEntries[0].daysExpired).toBe(40);
    expect(r.suppressed).toHaveLength(0);
    expect(r.active).toHaveLength(1);
  });

  test('a 31-day critical entry is overlong and does not suppress; 30 days is honoured', async () => {
    const m = await importEsm(pathToFileURL(MODULE).href);
    const crit = adv({ severity: 'critical' });
    const over = m.evaluate([crit], [entry({ added: '2026-10-01', expires: '2026-11-01' })], NOW);
    expect(over.overlongEntries).toHaveLength(1);
    expect(over.overlongEntries[0]).toMatchObject({ lifetimeDays: 31, maxDays: 30, severity: 'critical' });
    expect(over.suppressed).toHaveLength(0);

    const ok = m.evaluate([crit], [entry({ added: '2026-10-01', expires: '2026-10-31' })], NOW);
    expect(ok.overlongEntries).toHaveLength(0);
    expect(ok.suppressed).toHaveLength(1);
  });

  test('non-critical entries may run 90 days but not 91', async () => {
    const m = await importEsm(pathToFileURL(MODULE).href);
    const high = adv({ severity: 'high' });
    const ninety = m.evaluate([high], [entry({ added: '2026-10-01', expires: '2026-12-30' })], NOW);
    expect(ninety.overlongEntries).toHaveLength(0);
    expect(ninety.suppressed).toHaveLength(1);
    const ninetyOne = m.evaluate([high], [entry({ added: '2026-10-01', expires: '2026-12-31' })], NOW);
    expect(ninetyOne.overlongEntries).toHaveLength(1);
    expect(ninetyOne.active).toHaveLength(1);
  });

  test('a listed, unexpired advisory is suppressed; a different package is not', async () => {
    const m = await importEsm(pathToFileURL(MODULE).href);
    const r = m.evaluate([adv(), adv({ package: 'other', id: 'GHSA-zzzz', ghsa: 'GHSA-zzzz', cves: [] })], [entry()], NOW);
    expect(r.suppressed.map((x: Rec) => x.package)).toEqual(['left-pad']);
    expect(r.suppressed[0].exception).toMatchObject({ id: 'GHSA-aaaa-bbbb-cccc', owner: 'Founder (Jarrad)' });
    expect(r.active.map((x: Rec) => x.package)).toEqual(['other']);
    expect(r.expiredEntries).toHaveLength(0);
    expect(r.overlongEntries).toHaveLength(0);
  });

  test('an exception may name the CVE instead of the GHSA, case-insensitively', async () => {
    const m = await importEsm(pathToFileURL(MODULE).href);
    const r = m.evaluate([adv()], [entry({ id: 'cve-2026-0001', package: 'LEFT-PAD' })], NOW);
    expect(r.suppressed).toHaveLength(1);
  });

  test('invalid date ordering and future-dated entries are reported, not honoured', async () => {
    const m = await importEsm(pathToFileURL(MODULE).href);
    const backwards = entry({ added: '2026-10-05', expires: '2026-10-01' });
    const future = entry({ id: 'GHSA-future', added: '2026-12-01', expires: '2026-12-20' });
    const r = m.evaluate([adv(), adv({ id: 'GHSA-future', ghsa: 'GHSA-future', cves: [] })], [backwards, future], NOW);
    expect(r.invalidEntries.map((x: Rec) => x.problem)).toEqual([
      'expires is not after added',
      'added is in the future',
    ]);
    expect(r.suppressed).toHaveLength(0);
  });

  test('KEV flag logic with a stub catalogue', async () => {
    const m = await importEsm(pathToFileURL(MODULE).href);
    const stub = { vulnerabilities: [{ cveID: 'CVE-2026-0001' }, { cveID: 'CVE-2025-9999' }] };
    const flagged = m.flagKev(
      [adv(), adv({ id: 'GHSA-clean', ghsa: 'GHSA-clean', cves: ['CVE-2026-5555'], package: 'clean' })],
      stub,
    );
    expect(flagged).toHaveLength(1);
    expect(flagged[0].package).toBe('left-pad');
    expect(flagged[0].kevCves).toEqual(['CVE-2026-0001']);
    // a Trivy finding whose primary id is the CVE is flagged too
    expect(m.flagKev([adv({ id: 'CVE-2025-9999', ghsa: undefined, cves: [] })], new Set(['cve-2025-9999']))).toHaveLength(1);
    // a GHSA-only advisory with no CVE can never match
    expect(m.flagKev([adv({ cves: [] })], stub)).toHaveLength(0);
    expect(m.kevCveSet(['cve-1', { cveID: 'CVE-2' }]).has('CVE-1')).toBe(true);
  });

  test('parseAudit, parseTrivy and mergeAdvisories collapse the same finding', async () => {
    const m = await importEsm(pathToFileURL(MODULE).href);
    const fromAudit = m.parseAudit(
      auditDoc([{ module: 'left-pad', severity: 'high', ghsa: 'GHSA-aaaa-bbbb-cccc' }]),
    );
    const fromTrivy = m.parseTrivy({
      Results: [
        {
          Target: 'pnpm-lock.yaml',
          Vulnerabilities: [
            {
              VulnerabilityID: 'CVE-2026-0001',
              VendorIDs: ['GHSA-aaaa-bbbb-cccc'],
              PkgName: 'left-pad',
              Severity: 'CRITICAL',
              InstalledVersion: '0.9.0',
              FixedVersion: '1.0.0',
            },
          ],
          Secrets: [{ RuleID: 'private-key', Severity: 'HIGH', StartLine: 3, Match: '*****' }],
          Misconfigurations: [{ ID: 'DS-0002', Severity: 'MEDIUM', Title: 'Root user' }],
        },
      ],
    });
    expect(m.parseAudit({ error: 'registry unavailable' })).toBeNull();
    expect(fromTrivy.map((x: Rec) => x.kind).sort()).toEqual(['misconfig', 'secret', 'vulnerability']);
    expect(fromTrivy.find((x: Rec) => x.kind === 'misconfig')?.severity).toBe('moderate');

    const merged = m.mergeAdvisories([...(fromAudit ?? []), ...fromTrivy]);
    const vuln = merged.filter((x: Rec) => x.kind === 'vulnerability');
    expect(vuln).toHaveLength(1);
    expect(vuln[0].severity).toBe('critical');
    expect(vuln[0].cves).toEqual(['CVE-2026-0001']);
    expect([...(vuln[0].sources as string[])].sort()).toEqual(['pnpm-audit', 'trivy-fs']);
    // the secret finding keeps no matched text
    expect(JSON.stringify(fromTrivy)).not.toContain('*****');
  });

  test('gateDecision: off never fails; critical and high escalate; gitleaks and gaps fail', async () => {
    const m = await importEsm(pathToFileURL(MODULE).href);
    const active = [adv({ severity: 'high' }), adv({ id: 'x', ghsa: 'x', severity: 'moderate', cves: [] })];
    expect(m.gateDecision({ level: 'off', active: [adv({ severity: 'critical' })], gitleaks: 3 }).failed).toBe(false);
    expect(m.gateDecision({ level: 'critical', active }).failed).toBe(false);
    expect(m.gateDecision({ level: 'critical', active: [adv({ severity: 'critical' })] }).failed).toBe(true);
    expect(m.gateDecision({ level: 'critical', active, kevActive: [adv()] }).failed).toBe(true);
    expect(m.gateDecision({ level: 'high', active }).failed).toBe(true);
    expect(m.gateDecision({ level: 'critical', active: [], gitleaks: 1 }).failed).toBe(true);
    expect(m.gateDecision({ level: 'critical', active: [], incompleteTools: ['semgrep (skipped)'] }).failed).toBe(true);
    expect(m.gateDecision({ level: 'critical', active: [], semgrep: 4 }).failed).toBe(false);
    expect(m.gateDecision({ level: 'high', active: [], semgrep: 4 }).failed).toBe(true);
    expect(() => m.gateDecision({ level: 'blocker', active: [] })).toThrow();
  });
});

describe('security exceptions CLI and scan script (black-box)', () => {
  function run(args: string[]) {
    const r = spawnSync('node', [MODULE, ...args], { cwd: WEB_ROOT, encoding: 'utf8' });
    return { code: r.status, out: `${r.stdout}${r.stderr}` };
  }

  test('an expired exception in a temp file fails the run even at level off', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sec-cli-'));
    try {
      const exc = join(dir, 'exceptions.json');
      const audit = join(dir, 'audit.json');
      writeFileSync(exc, JSON.stringify([entry({ added: '2026-01-01', expires: '2026-02-01' })]));
      writeFileSync(audit, JSON.stringify(auditDoc([{ module: 'left-pad', severity: 'moderate', ghsa: 'GHSA-aaaa-bbbb-cccc' }])));
      const r = run(['evaluate', '--exceptions', exc, '--audit', audit, '--level', 'off', '--now', '2026-10-11']);
      expect(r.code).toBe(3);
      expect(r.out).toContain('PROCESS ERROR: expired exception GHSA-aaaa-bbbb-cccc');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('level off reports only; critical fails on a critical advisory; an exception clears it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sec-cli-'));
    try {
      const empty = join(dir, 'empty.json');
      const held = join(dir, 'held.json');
      const audit = join(dir, 'audit.json');
      const out = join(dir, 'summary.json');
      writeFileSync(empty, '[]');
      writeFileSync(held, JSON.stringify([entry({ added: '2026-10-05', expires: '2026-10-25' })]));
      writeFileSync(audit, JSON.stringify(auditDoc([{ module: 'left-pad', severity: 'critical', ghsa: 'GHSA-aaaa-bbbb-cccc' }])));
      const common = ['--audit', audit, '--now', '2026-10-11', '--out', out];

      const off = run(['evaluate', '--exceptions', empty, '--level', 'off', ...common]);
      expect(off.code).toBe(0);
      expect(off.out).toContain('GATE: off (report only)');

      const crit = run(['evaluate', '--exceptions', empty, '--level', 'critical', ...common]);
      expect(crit.code).toBe(1);
      expect(crit.out).toContain('GATE: FAIL at level critical');

      const excepted = run(['evaluate', '--exceptions', held, '--level', 'critical', ...common]);
      expect(excepted.code).toBe(0);
      expect(excepted.out).toContain('1 advisory(ies) suppressed');
      expect(existsSync(out)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('an unreadable report counts as an incomplete scanner when the gate is on', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sec-cli-'));
    try {
      const empty = join(dir, 'empty.json');
      writeFileSync(empty, '[]');
      const r = run([
        'evaluate', '--exceptions', empty, '--level', 'critical',
        '--audit', join(dir, 'does-not-exist.json'),
      ]);
      expect(r.code).toBe(1);
      expect(r.out).toContain('pnpm-audit (no usable report)');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('validate accepts the shipped file and rejects a missing one with exit 3', () => {
    expect(run(['validate']).code).toBe(0);
    expect(run(['validate', '--exceptions', join(tmpdir(), 'no-such-exceptions.json')]).code).toBe(3);
  });

  test('security-scan.sh parses, pins every scanner image by digest and refuses an in-repo output dir', () => {
    expect(spawnSync('bash', ['-n', SCAN_SH]).status).toBe(0);
    const src = readFileSync(SCAN_SH, 'utf8');
    for (const name of ['GITLEAKS_IMAGE', 'TRIVY_IMAGE', 'SEMGREP_IMAGE']) {
      expect(src).toMatch(new RegExp(`^${name}="[^"]+:[^"@]+@sha256:[0-9a-f]{64}"$`, 'm'));
    }
    const probe = join(WEB_ROOT, 'security-scan-spec-probe');
    const r = spawnSync('bash', [SCAN_SH, '--out', probe], { cwd: WEB_ROOT, encoding: 'utf8' });
    expect(r.status).toBe(2);
    expect(r.stderr).toContain('must be outside the repository');
    expect(existsSync(probe)).toBe(false);
  });

  test('the workflow is safe for a public repository and builds the image with the localhost opt-in', () => {
    const wf = readFileSync(WORKFLOW, 'utf8');
    // Strip comment lines: the header explains what is NOT used.
    const code = wf
      .split('\n')
      .filter((l) => !l.trim().startsWith('#'))
      .join('\n');
    expect(code).not.toMatch(/pull_request_target/);
    expect(code).not.toMatch(/\bsecrets\./);
    expect(code).toMatch(/^permissions:\n {2}contents: read$/m);
    expect(code).toContain('persist-credentials: false');
    expect(code).toContain('--build-arg ALLOW_LOCALHOST_PUBLIC_URLS=true');
    expect(code).toContain('bash scripts/security-scan.sh');
    // every third-party action is pinned by full commit SHA
    const uses = [...code.matchAll(/^\s+uses:\s+(\S+)/gm)].map((m) => m[1]);
    expect(uses.length).toBeGreaterThan(0);
    for (const u of uses) expect(u).toMatch(/@[0-9a-f]{40}$/);
  });

  test('gitleaks keeps the default rules and allow-lists only triaged non-secret paths', () => {
    const toml = readFileSync(GITLEAKS, 'utf8');
    expect(toml).toMatch(/^\[extend\]\s*\nuseDefault = true$/m);
    expect(toml).not.toMatch(/^\[allowlist\]/m);
    const paths = [...toml.matchAll(/^\s+'''([^']+)'''/gm)].map((m) => m[1]);
    // Only the documented non-secret hits: the Next.js doc sample and i18n key identifiers.
    expect(paths).toEqual([
      '\\.claude/docs/guides/environment-variables\\.md',
      'src/modules/teacher/lib/v2/(teaching-insights|subskill-cards|students-tab)\\.test\\.ts',
      'src/modules/teacher/lib/student-detail-text(\\.test)?\\.ts',
    ]);
  });
});
