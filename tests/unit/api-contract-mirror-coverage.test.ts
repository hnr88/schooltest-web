import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

/**
 * EVERY api contract module is either MIRRORED or NAMED. Nothing is silent.
 *
 * WHY THIS EXISTS. `tests/e2e/teacher-contract-parity.spec.ts` already diffs
 * exported names between the api contracts and their portal mirrors, and it is a
 * good check — but it ENUMERATES ITS MODULE GRAPH BY HAND, and its own task file
 * flags the consequence: "a new contract module that is not imported there is
 * covered by nothing." Measured on this tree, that is not a hypothetical —
 * 31 api contract modules exist and 6 are paired, so 25 are covered by nothing.
 *
 * Both cross-repo drift incidents this fleet hit in one hour were caught ONLY
 * because they happened to land in `teacher-sessions.ts`, one of the six:
 * `SITTING_SETTINGS_FROZEN_MESSAGE` shipped with no mirror and no allowlist
 * entry, and a monitor-schema widening did the same. An identical omission in
 * any of the other 25 lands silently, and always has.
 *
 * WHAT THIS GUARD DOES, AND WHAT IT DELIBERATELY DOES NOT.
 * It answers one question — is this module's mirroring status a DECISION someone
 * recorded, or an accident? It does not attempt export-level diffing for the
 * unpaired modules: that is the paired spec's job, and pretending to do it here
 * would be a check that passes for a reason unrelated to the property it names.
 *
 * The paired list is READ FROM THE PARITY SPEC'S OWN SOURCE rather than
 * restated, so the two cannot drift: adding a module to that spec automatically
 * satisfies this guard, and removing one automatically re-arms it. Deriving both
 * sides from the tree is the whole point — a hand-maintained list is the defect
 * being fixed, so this file must not contain a second one.
 */

const API_CONTRACTS = path.resolve(__dirname, '../../../schooltest-api/src/contracts');
const PARITY_SPEC = path.resolve(__dirname, '../e2e/teacher-contract-parity.spec.ts');

/**
 * INHERITED DEBT, not approved exemptions.
 *
 * Each of these is an api contract module with no portal mirror pairing today.
 * They are named individually and deliberately: a shrinking list is progress,
 * a silent gap is not. Most are genuinely server-only — `stimulus`, `keys`,
 * `proctoring-events` and `calibration` have no business in a portal mirror —
 * but that has NOT been traced to call sites for every entry here, so this list
 * records the gap rather than blessing it.
 *
 * The guard's job is to make NEW drift impossible. Retiring these one by one,
 * each justified from a real call site, is follow-on work.
 *
 * TO ADD A MODULE HERE you must be able to say why the portal never parses that
 * shape. If the portal does parse it, pair it in the parity spec instead.
 */
const UNMIRRORED_BASELINE: readonly string[] = [
  'accommodations',
  'calibration',
  'delivery',
  'diagnostic-export',
  'item',
  'keys',
  'messages',
  'my-lists',
  'notifications',
  'parent-child-progress',
  'parent-household-progress',
  'proctoring-events',
  'push-subscription',
  'responses',
  'results',
  'roster',
  'school-admin',
  'school-onboarding-invitation',
  'search-domains',
  'search-domains.constants',
  'search-domains.types',
  'sessions',
  'sittings',
  'stimulus',
  'teacher-trial',
];

/** Every api contract module on disk, barrel excluded. */
function apiContractModules(): string[] {
  return readdirSync(API_CONTRACTS)
    .filter((file) => file.endsWith('.ts') && file !== 'index.ts')
    .map((file) => file.replace(/\.ts$/, ''))
    .sort();
}

/** The modules the parity spec actually pairs — read from its source, not restated. */
function pairedModules(source: string): string[] {
  const found = new Set<string>();
  for (const match of source.matchAll(/schooltest-api\/src\/contracts\/([A-Za-z0-9_.-]+)/g)) {
    found.add(match[1]);
  }
  return [...found].sort();
}

describe('api contract modules are mirrored or named — never silent', () => {
  const modules = apiContractModules();
  const paired = pairedModules(readFileSync(PARITY_SPEC, 'utf8'));

  test('the tree really was read (a guard over nothing proves nothing)', () => {
    // A derived guard whose derivation silently returned an empty set would
    // pass forever. Both sides are floored so that cannot happen unnoticed.
    expect(modules.length).toBeGreaterThan(20);
    expect(paired.length).toBeGreaterThan(0);
  });

  test('every module is either paired in the parity spec or in the named baseline', () => {
    const silent = modules.filter(
      (mod) => !paired.includes(mod) && !UNMIRRORED_BASELINE.includes(mod),
    );
    expect(
      silent,
      'a new api contract module must be paired in teacher-contract-parity.spec.ts ' +
        'or named in UNMIRRORED_BASELINE with a reason — it cannot be silent',
    ).toEqual([]);
  });

  test('the baseline does not name a module that is already paired, or one that is gone', () => {
    // Two ways the list rots: an entry that has since been mirrored (so the
    // debt is paid and the entry is now a lie), and an entry for a deleted
    // module. Both make the list less trustworthy the longer it sits.
    expect(
      UNMIRRORED_BASELINE.filter((mod) => paired.includes(mod)),
      'this module IS paired now — remove it from the baseline',
    ).toEqual([]);
    expect(
      UNMIRRORED_BASELINE.filter((mod) => !modules.includes(mod)),
      'this module no longer exists — remove it from the baseline',
    ).toEqual([]);
  });

  test('SELF-TEST: the guard fails on a crafted offender', () => {
    // A guard shipped without proof it can fail has never been shown to bite.
    // This runs the real predicate against a fabricated module name.
    const crafted = [...modules, 'zz-crafted-unmirrored-module'];
    const silent = crafted.filter(
      (mod) => !paired.includes(mod) && !UNMIRRORED_BASELINE.includes(mod),
    );
    expect(silent).toEqual(['zz-crafted-unmirrored-module']);
  });
});
