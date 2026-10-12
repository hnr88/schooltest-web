#!/usr/bin/env node
/**
 * Security exceptions and gate evaluation (W3-06, ST4S G-21 / G-22, decision D7 section C).
 *
 * This is the ONLY reader of `security/exceptions.json`. `scripts/security-scan.sh` runs the
 * scanners and hands their JSON reports to this file's CLI, which:
 *   - normalises `pnpm audit --json` and Trivy JSON into one advisory shape,
 *   - suppresses an advisory only while a matching exception is in force,
 *   - reports expired, over-long and invalid exceptions (a process error, always fatal),
 *   - flags advisories whose CVE is in the CISA Known Exploited Vulnerabilities catalogue,
 *   - applies `SECURITY_GATE_LEVEL` (off | critical | high) and prints a counts-only summary.
 *
 * pnpm `auditConfig.ignoreGhsas` is deliberately NOT used: it has no expiry.
 *
 * Exception entry: { id, package, reason, reachable, owner, added, expires } (+ optional
 * `severity`, a hint used for the lifetime cap when the advisory is not in the current report).
 *   id        GHSA-..., CVE-..., Trivy/AVD id or the numeric pnpm advisory id
 *   package   the module the exception applies to (an id alone never suppresses)
 *   expires   ISO date; the entry stops suppressing AT that instant (date-only = 00:00 UTC)
 * Maximum lifetime counted from `added`: critical 30 days, anything else 90 days. An over-long
 * entry is NOT honoured (it suppresses nothing) and is reported as a process error.
 *
 * Gate (exit code 1 when failed): `critical` fails on any active critical advisory or any active
 * KEV-listed advisory; `high` adds high advisories and Semgrep ERROR findings. At either level any
 * Gitleaks finding fails, and so does a scanner that was skipped or produced no usable report.
 * `off` never fails on findings. Expired / over-long / invalid exceptions exit 3 at EVERY level.
 *
 * CLI (no secrets are ever printed: counts, rule ids, package names and file paths only):
 *   node scripts/security-exceptions.mjs validate [--exceptions <file>]
 *   node scripts/security-exceptions.mjs evaluate [--exceptions <file>] [--audit <pnpm-audit.json>]
 *        [--trivy <trivy-json>]... [--kev <kev.json>] [--gitleaks <json>] [--semgrep <json>]
 *        [--skipped a,b] [--level off|critical|high] [--now <iso>] [--out <summary.json>]
 * Exit codes: 0 pass, 1 gate failed, 2 usage or input error, 3 exception process error.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DAY_MS = 86_400_000;
export const MAX_LIFETIME_DAYS = Object.freeze({ critical: 30, default: 90 });
export const GATE_LEVELS = Object.freeze(['off', 'critical', 'high']);
export const SEVERITY_ORDER = Object.freeze(['critical', 'high', 'moderate', 'low', 'info', 'unknown']);

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_EXCEPTIONS = join(SCRIPT_DIR, '..', 'security', 'exceptions.json');

/** Thrown by loadExceptions; `problems` lists every structural fault found. */
export class ExceptionFileError extends Error {
  constructor(file, problems) {
    super(`${file}: ${problems.join('; ')}`);
    this.name = 'ExceptionFileError';
    this.problems = problems;
  }
}

// ---------------------------------------------------------------- exceptions file

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function parseInstant(v) {
  if (!isNonEmptyString(v)) return NaN;
  return Date.parse(v);
}

/** Read and structurally validate the exceptions file. Returns the entries or throws. */
export function loadExceptions(file = DEFAULT_EXCEPTIONS) {
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch (err) {
    throw new ExceptionFileError(file, [`cannot read file (${err.code || err.message})`]);
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new ExceptionFileError(file, [`not valid JSON (${err.message})`]);
  }
  if (!Array.isArray(data)) throw new ExceptionFileError(file, ['top level must be a JSON array']);
  const problems = [];
  const seen = new Set();
  data.forEach((e, i) => {
    const at = `entry ${i}`;
    if (!e || typeof e !== 'object' || Array.isArray(e)) {
      problems.push(`${at}: must be an object`);
      return;
    }
    for (const k of ['id', 'package', 'reason', 'owner']) {
      if (!isNonEmptyString(e[k])) problems.push(`${at}: "${k}" must be a non-empty string`);
    }
    if (typeof e.reachable !== 'boolean') problems.push(`${at}: "reachable" must be true or false`);
    for (const k of ['added', 'expires']) {
      if (!Number.isFinite(parseInstant(e[k]))) problems.push(`${at}: "${k}" must be an ISO date`);
    }
    if (e.severity !== undefined && !SEVERITY_ORDER.includes(e.severity)) {
      problems.push(`${at}: "severity" must be one of ${SEVERITY_ORDER.join(', ')}`);
    }
    const key = `${String(e.id).toLowerCase()}|${String(e.package).toLowerCase()}`;
    if (seen.has(key)) problems.push(`${at}: duplicate id and package`);
    seen.add(key);
  });
  if (problems.length) throw new ExceptionFileError(file, problems);
  return data;
}

// ---------------------------------------------------------------- normalisation

function normaliseSeverity(s) {
  const v = String(s ?? '').toLowerCase();
  if (v === 'medium') return 'moderate';
  return SEVERITY_ORDER.includes(v) ? v : 'unknown';
}

function severityRank(s) {
  return SEVERITY_ORDER.indexOf(normaliseSeverity(s));
}

function uniq(list) {
  return [...new Set(list.filter(Boolean))];
}

function idKeys(a) {
  return uniq([a.id, a.ghsa, ...(a.cves || [])]).map((x) => String(x).toLowerCase());
}

/**
 * Advisories out of `pnpm audit --json` ({ advisories: { <id>: {...} }, metadata }).
 * Returns null when the document is not a usable audit report (registry error etc.).
 */
export function parseAudit(doc) {
  if (!doc || typeof doc !== 'object' || !doc.advisories || typeof doc.advisories !== 'object') {
    return null;
  }
  return Object.values(doc.advisories).map((a) => ({
    source: 'pnpm-audit',
    kind: 'vulnerability',
    id: String(a.github_advisory_id || a.id || ''),
    ghsa: a.github_advisory_id ? String(a.github_advisory_id) : undefined,
    cves: Array.isArray(a.cves) ? a.cves.map(String) : [],
    package: String(a.module_name || ''),
    severity: normaliseSeverity(a.severity),
    title: a.title ? String(a.title) : undefined,
    url: a.url ? String(a.url) : undefined,
    vulnerableVersions: a.vulnerable_versions ? String(a.vulnerable_versions) : undefined,
    patchedVersions: a.patched_versions ? String(a.patched_versions) : undefined,
  }));
}

/**
 * Findings out of a Trivy JSON report (`Results[]` with Vulnerabilities, Secrets,
 * Misconfigurations). Secret text is never copied: only rule id, target and severity.
 */
export function parseTrivy(doc, source = 'trivy-fs') {
  if (!doc || typeof doc !== 'object' || !Array.isArray(doc.Results ?? [])) return null;
  const out = [];
  for (const r of doc.Results || []) {
    const target = String(r.Target || '');
    for (const v of r.Vulnerabilities || []) {
      const ids = uniq([v.VulnerabilityID, ...(v.VendorIDs || [])].map(String));
      out.push({
        source,
        kind: 'vulnerability',
        id: ids[0] || '',
        ghsa: ids.find((x) => /^GHSA-/i.test(x)),
        cves: ids.filter((x) => /^CVE-/i.test(x)),
        package: String(v.PkgName || ''),
        severity: normaliseSeverity(v.Severity),
        title: v.Title ? String(v.Title) : undefined,
        url: v.PrimaryURL ? String(v.PrimaryURL) : undefined,
        vulnerableVersions: v.InstalledVersion ? String(v.InstalledVersion) : undefined,
        patchedVersions: v.FixedVersion ? String(v.FixedVersion) : undefined,
        target,
      });
    }
    for (const s of r.Secrets || []) {
      out.push({
        source,
        kind: 'secret',
        id: String(s.RuleID || ''),
        cves: [],
        package: target,
        severity: normaliseSeverity(s.Severity),
        title: s.Title ? String(s.Title) : undefined,
        target,
        line: s.StartLine,
      });
    }
    for (const m of r.Misconfigurations || []) {
      out.push({
        source,
        kind: 'misconfig',
        id: String(m.ID || m.AVDID || ''),
        cves: [],
        package: target,
        severity: normaliseSeverity(m.Severity),
        title: m.Title ? String(m.Title) : undefined,
        url: m.PrimaryURL ? String(m.PrimaryURL) : undefined,
        target,
      });
    }
  }
  return out;
}

/**
 * Collapse the same finding reported by more than one scanner (pnpm audit and Trivy both read the
 * lockfile). Two advisories are the same when the package matches and any id or CVE is shared.
 * The result keeps the highest severity and the union of ids and sources.
 */
export function mergeAdvisories(list) {
  const merged = [];
  const index = new Map(); // `${package}|${idkey}` -> position in merged
  for (const adv of list) {
    const pkg = adv.package.toLowerCase();
    const keys = idKeys(adv).map((k) => `${adv.kind}|${pkg}|${k}`);
    const hit = keys.map((k) => index.get(k)).find((p) => p !== undefined);
    if (hit === undefined) {
      const copy = { ...adv, cves: uniq(adv.cves || []), sources: [adv.source] };
      merged.push(copy);
      keys.forEach((k) => index.set(k, merged.length - 1));
      continue;
    }
    const cur = merged[hit];
    cur.cves = uniq([...cur.cves, ...(adv.cves || [])]);
    cur.ghsa = cur.ghsa || adv.ghsa;
    cur.sources = uniq([...cur.sources, adv.source]);
    if (severityRank(adv.severity) < severityRank(cur.severity)) cur.severity = adv.severity;
    cur.title = cur.title || adv.title;
    cur.url = cur.url || adv.url;
    cur.patchedVersions = cur.patchedVersions || adv.patchedVersions;
    idKeys(cur).forEach((k) => index.set(`${cur.kind}|${pkg}|${k}`, hit));
  }
  return merged;
}

export function countBySeverity(advisories) {
  const counts = Object.fromEntries(SEVERITY_ORDER.map((s) => [s, 0]));
  for (const a of advisories) counts[normaliseSeverity(a.severity)] += 1;
  return counts;
}

// ---------------------------------------------------------------- exceptions engine

function entryMatches(entry, adv) {
  if (entry.package.toLowerCase() !== adv.package.toLowerCase()) return false;
  return idKeys(adv).includes(entry.id.toLowerCase());
}

/**
 * @param {Array} advisories normalised advisories (parseAudit / parseTrivy / mergeAdvisories)
 * @param {Array} exceptions entries from loadExceptions
 * @param {Date|string|number} now evaluation instant
 * @returns {{suppressed:Array, active:Array, expiredEntries:Array, overlongEntries:Array,
 *            invalidEntries:Array, unmatchedEntries:Array}}
 */
export function evaluate(advisories, exceptions, now = new Date()) {
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const expiredEntries = [];
  const overlongEntries = [];
  const invalidEntries = [];
  const unmatchedEntries = [];
  const inForce = [];

  for (const e of exceptions) {
    const addedMs = parseInstant(e.added);
    const expiresMs = parseInstant(e.expires);
    if (!Number.isFinite(addedMs) || !Number.isFinite(expiresMs)) {
      invalidEntries.push({ ...e, problem: 'added or expires is not a date' });
      continue;
    }
    if (expiresMs <= addedMs) {
      invalidEntries.push({ ...e, problem: 'expires is not after added' });
      continue;
    }
    if (addedMs > nowMs + DAY_MS) {
      invalidEntries.push({ ...e, problem: 'added is in the future' });
      continue;
    }
    const matches = advisories.filter((a) => entryMatches(e, a));
    const worst = matches.map((a) => a.severity).sort((x, y) => severityRank(x) - severityRank(y))[0];
    const severity = normaliseSeverity(worst || e.severity);
    const maxDays = severity === 'critical' ? MAX_LIFETIME_DAYS.critical : MAX_LIFETIME_DAYS.default;
    const lifetimeDays = Math.round(((expiresMs - addedMs) / DAY_MS) * 100) / 100;

    if (expiresMs <= nowMs) {
      expiredEntries.push({
        ...e,
        severity,
        daysExpired: Math.floor((nowMs - expiresMs) / DAY_MS),
      });
    } else if (lifetimeDays > maxDays) {
      overlongEntries.push({ ...e, severity, lifetimeDays, maxDays });
    } else {
      inForce.push(e);
      if (matches.length === 0) unmatchedEntries.push({ ...e });
    }
  }

  const suppressed = [];
  const active = [];
  for (const a of advisories) {
    const entry = inForce.find((e) => entryMatches(e, a));
    if (entry) {
      suppressed.push({
        ...a,
        exception: { id: entry.id, owner: entry.owner, expires: entry.expires, reachable: entry.reachable },
      });
    } else {
      active.push(a);
    }
  }
  return { suppressed, active, expiredEntries, overlongEntries, invalidEntries, unmatchedEntries };
}

// ---------------------------------------------------------------- CISA KEV

/** Set of upper-case CVE ids from a KEV catalogue ({vulnerabilities:[{cveID}]}), an array or a Set. */
export function kevCveSet(catalogue) {
  const list = Array.isArray(catalogue)
    ? catalogue
    : catalogue instanceof Set
      ? [...catalogue]
      : (catalogue && catalogue.vulnerabilities) || [];
  return new Set(
    list
      .map((v) => (typeof v === 'string' ? v : v && v.cveID))
      .filter(Boolean)
      .map((v) => String(v).toUpperCase()),
  );
}

/** Returns the advisories whose CVE is listed in the catalogue, each with `kevCves`. */
export function flagKev(advisories, catalogue) {
  const set = kevCveSet(catalogue);
  const flagged = [];
  for (const a of advisories) {
    const hit = uniq([a.id, ...(a.cves || [])])
      .map((x) => String(x).toUpperCase())
      .filter((x) => x.startsWith('CVE-') && set.has(x));
    if (hit.length) flagged.push({ ...a, kevCves: hit });
  }
  return flagged;
}

// ---------------------------------------------------------------- gate

/**
 * @returns {{level:string, failed:boolean, reasons:string[]}}
 */
export function gateDecision({ level = 'off', active = [], kevActive = [], gitleaks = 0, semgrep = 0, incompleteTools = [] }) {
  if (!GATE_LEVELS.includes(level)) throw new Error(`SECURITY_GATE_LEVEL must be one of ${GATE_LEVELS.join(', ')}`);
  if (level === 'off') return { level, failed: false, reasons: [] };
  const counts = countBySeverity(active);
  const reasons = [];
  if (counts.critical) reasons.push(`${counts.critical} critical advisory(ies)`);
  if (kevActive.length) reasons.push(`${kevActive.length} known-exploited (CISA KEV) advisory(ies)`);
  if (level === 'high') {
    if (counts.high) reasons.push(`${counts.high} high advisory(ies)`);
    if (semgrep) reasons.push(`${semgrep} Semgrep ERROR finding(s)`);
  }
  if (gitleaks) reasons.push(`${gitleaks} Gitleaks finding(s)`);
  if (incompleteTools.length) reasons.push(`scanner(s) not completed: ${incompleteTools.join(', ')}`);
  return { level, failed: reasons.length > 0, reasons };
}

// ---------------------------------------------------------------- CLI

function readJsonReport(file) {
  if (!file || !existsSync(file)) return { ok: false, doc: null };
  const text = readFileSync(file, 'utf8');
  if (text.trim() === '') return { ok: true, doc: [] };
  try {
    return { ok: true, doc: JSON.parse(text) };
  } catch {
    return { ok: false, doc: null };
  }
}

function parseArgs(argv) {
  const args = { _: [], trivy: [] };
  const valueFlags = new Set([
    'exceptions', 'audit', 'trivy', 'kev', 'gitleaks', 'semgrep', 'skipped', 'level', 'now', 'out',
  ]);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      args.help = true;
    } else if (a.startsWith('--')) {
      const key = a.slice(2);
      if (!valueFlags.has(key)) throw new Error(`unknown option ${a}`);
      const v = argv[i + 1];
      if (v === undefined) throw new Error(`${a} needs a value`);
      i += 1;
      if (key === 'trivy') args.trivy.push(v);
      else args[key] = v;
    } else {
      args._.push(a);
    }
  }
  return args;
}

function pad(s, n) {
  return String(s).padEnd(n);
}

function printTable(rows, header) {
  const widths = header.map((h, i) => Math.max(h.length, ...rows.map((r) => String(r[i]).length)));
  const line = (r) => r.map((c, i) => pad(c, widths[i])).join('  ').trimEnd();
  console.log(line(header));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  rows.forEach((r) => console.log(line(r)));
}

function runEvaluate(args) {
  const now = args.now ? new Date(args.now) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error('--now is not a date');
  const level = args.level || 'off';
  if (!GATE_LEVELS.includes(level)) throw new Error(`--level must be one of ${GATE_LEVELS.join(', ')}`);
  const exceptions = loadExceptions(resolve(args.exceptions || DEFAULT_EXCEPTIONS));

  const incomplete = (args.skipped ? args.skipped.split(',').filter(Boolean) : []).map((t) => `${t} (skipped)`);
  const perSource = []; // [{name, status, advisories}]
  const all = [];

  function addSource(name, file, parse) {
    const rep = readJsonReport(file);
    const parsed = rep.ok ? parse(rep.doc) : null;
    if (!parsed) {
      incomplete.push(`${name} (no usable report)`);
      perSource.push({ name, status: 'error', advisories: [] });
      return;
    }
    perSource.push({ name, status: 'ok', advisories: parsed });
    all.push(...parsed);
  }
  if (args.audit) addSource('pnpm-audit', args.audit, parseAudit);
  const usedNames = new Set();
  args.trivy.forEach((file) => {
    const base = /image/i.test(basename(file)) ? 'trivy-image' : 'trivy-fs';
    let name = base;
    for (let n = 2; usedNames.has(name); n += 1) name = `${base}-${n}`;
    usedNames.add(name);
    addSource(name, file, (doc) => parseTrivy(doc, name));
  });

  let gitleaks = null;
  if (args.gitleaks) {
    const rep = readJsonReport(args.gitleaks);
    if (rep.ok && Array.isArray(rep.doc)) gitleaks = rep.doc.length;
    else if (rep.ok && rep.doc === null) gitleaks = 0;
    else incomplete.push('gitleaks (no usable report)');
  }
  let semgrep = null;
  if (args.semgrep) {
    const rep = readJsonReport(args.semgrep);
    if (rep.ok && rep.doc && Array.isArray(rep.doc.results)) {
      semgrep = rep.doc.results.filter(
        (r) => String((r.extra && r.extra.severity) || '').toUpperCase() === 'ERROR',
      ).length;
    } else {
      incomplete.push('semgrep (no usable report)');
    }
  }

  const merged = mergeAdvisories(all);
  const result = evaluate(merged, exceptions, now);

  let kevWarning = null;
  let kevAll = [];
  let kevActive = [];
  if (args.kev) {
    const rep = readJsonReport(args.kev);
    if (rep.ok && rep.doc && Array.isArray(rep.doc.vulnerabilities)) {
      const set = kevCveSet(rep.doc);
      kevAll = flagKev(merged, set);
      kevActive = flagKev(result.active, set);
    } else {
      kevWarning = 'CISA KEV catalogue unavailable; known-exploited check skipped';
    }
  } else {
    kevWarning = 'CISA KEV catalogue not downloaded; known-exploited check skipped';
  }

  const gate = gateDecision({
    level,
    active: result.active,
    kevActive,
    gitleaks: gitleaks || 0,
    semgrep: semgrep || 0,
    incompleteTools: incomplete,
  });
  const processErrors = [
    ...result.expiredEntries.map((e) => `expired exception ${e.id} (${e.package}) by ${e.daysExpired} day(s)`),
    ...result.overlongEntries.map(
      (e) => `over-long exception ${e.id} (${e.package}): ${e.lifetimeDays} days, maximum ${e.maxDays} for ${e.severity}`,
    ),
    ...result.invalidEntries.map((e) => `invalid exception ${e.id} (${e.package}): ${e.problem}`),
  ];

  const header = ['source', 'status', 'critical', 'high', 'moderate', 'low', 'other'];
  const rows = perSource.map((s) => {
    const c = countBySeverity(mergeAdvisories(s.advisories));
    return [s.name, s.status, c.critical, c.high, c.moderate, c.low, c.info + c.unknown];
  });
  const mergedActive = countBySeverity(result.active);
  rows.push([
    'active (after exceptions)', '-', mergedActive.critical, mergedActive.high, mergedActive.moderate,
    mergedActive.low, mergedActive.info + mergedActive.unknown,
  ]);

  const summary = {
    generatedAt: now.toISOString(),
    level,
    sources: perSource.map((s) => ({ name: s.name, status: s.status, counts: countBySeverity(mergeAdvisories(s.advisories)) })),
    activeCounts: mergedActive,
    activeAdvisories: result.active.map(({ id, package: pkg, severity, sources, kind }) => ({ id, package: pkg, severity, sources, kind })),
    suppressed: result.suppressed.map(({ id, package: pkg, severity, exception }) => ({ id, package: pkg, severity, exception })),
    kev: kevAll.map(({ id, package: pkg, severity, kevCves }) => ({ id, package: pkg, severity, kevCves })),
    kevWarning,
    gitleaks,
    semgrepErrors: semgrep,
    incomplete,
    exceptions: {
      total: exceptions.length,
      expired: result.expiredEntries,
      overlong: result.overlongEntries,
      invalid: result.invalidEntries,
      unmatched: result.unmatchedEntries.map(({ id, package: pkg, expires }) => ({ id, package: pkg, expires })),
    },
    processErrors,
    gate,
  };
  if (args.out) writeFileSync(resolve(args.out), `${JSON.stringify(summary, null, 2)}\n`);

  console.log(`SECURITY SCAN SUMMARY  (gate level: ${level})`);
  console.log('');
  printTable(rows, header);
  console.log('');
  console.log(`gitleaks findings (redacted): ${gitleaks === null ? 'not run' : gitleaks}`);
  console.log(`semgrep ERROR findings:       ${semgrep === null ? 'not run' : semgrep}`);
  console.log(
    `CISA KEV exploited:           ${kevWarning ? `unknown (${kevWarning})` : `${kevAll.length} listed, ${kevActive.length} active`}`,
  );
  console.log(
    `exceptions:                   ${exceptions.length} loaded, ${result.suppressed.length} advisory(ies) suppressed, ` +
      `${result.expiredEntries.length} expired, ${result.overlongEntries.length} over-long, ${result.invalidEntries.length} invalid`,
  );
  if (result.unmatchedEntries.length) {
    console.log(`  note: ${result.unmatchedEntries.length} unexpired exception(s) match no current advisory (review and remove)`);
  }
  if (incomplete.length) console.log(`incomplete scanners:          ${incomplete.join(', ')}`);
  for (const p of processErrors) console.log(`PROCESS ERROR: ${p}`);
  console.log('');
  if (level === 'off') {
    console.log('GATE: off (report only). Raise SECURITY_GATE_LEVEL to critical or high to enforce.');
  } else {
    console.log(`GATE: ${gate.failed ? 'FAIL' : 'PASS'} at level ${level}${gate.reasons.length ? `: ${gate.reasons.join('; ')}` : ''}`);
  }

  if (processErrors.length) return 3;
  return gate.failed ? 1 : 0;
}

function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error(`security-exceptions: ${err.message}`);
    return 2;
  }
  const cmd = args._[0];
  if (args.help || !cmd) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].split('\n').slice(2).map((l) => l.replace(/^ \* ?/, '')).join('\n'));
    return args.help ? 0 : 2;
  }
  try {
    if (cmd === 'validate') {
      const entries = loadExceptions(resolve(args.exceptions || DEFAULT_EXCEPTIONS));
      console.log(`exceptions file OK: ${entries.length} entry(ies)`);
      return 0;
    }
    if (cmd === 'evaluate') return runEvaluate(args);
    console.error(`security-exceptions: unknown command ${cmd}`);
    return 2;
  } catch (err) {
    console.error(`security-exceptions: ${err.message}`);
    return err instanceof ExceptionFileError ? 3 : 2;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
