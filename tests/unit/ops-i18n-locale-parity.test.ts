import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Ops i18n locale parity — the committed form of the accepted parity census
 * (artifacts/task-0016aac9-ops-i18n-parity-census.md), filed by the LAST parity
 * slice per the census's own reservation: "can be committed as an asserting
 * spec by whichever slice closes the last tree".
 *
 * `src/i18n/request.ts` has NO English fallback: a locale missing an `Ops.*` key
 * renders the RAW KEY to a non-en operator. Six parity slices translated the
 * 617-key missing set (tasks slice A–F, 2026-09-08); this guard pins full
 * Ops-namespace parity shut. Deliberately NOT asserted here: the pre-existing
 * NON-Ops debt (80 keys in ko/ms/th/vi, 6 in zh) — different namespaces,
 * outside this mission's scope, and asserting them would keep this spec red.
 *
 * The check is DERIVED, never hardcoded: a fixed key list would pass forever
 * while a forty-second key went missing, the failure mode that let the raw-key
 * class regrow after D-028.
 */
const WEB_ROOT = path.resolve(__dirname, '..', '..');

type Catalog = Record<string, unknown>;
const en = JSON.parse(readFileSync(path.join(WEB_ROOT, 'src', 'i18n', 'messages', 'en.json'), 'utf8')) as Catalog;

function flatKeys(node: Catalog, prefix = ''): string[] {
  return Object.entries(node).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' ? flatKeys(v as Catalog, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

const enOpsKeys = flatKeys(en).filter((k) => k.startsWith('Ops.'));
const LOCALES = ['zh', 'ko', 'ms', 'vi', 'th'] as const;

describe('Ops i18n locale parity', () => {
  it('the en Ops namespace is non-trivial — an empty census proves nothing', () => {
    expect(enOpsKeys.length).toBeGreaterThan(1000);
  });

  it.each(LOCALES)('%s carries every en Ops.* key — no raw keys for non-en operators', (locale) => {
    const catalog = JSON.parse(readFileSync(path.join(WEB_ROOT, 'src', 'i18n', 'messages', `${locale}.json`), 'utf8')) as Catalog;
    const present = new Set(flatKeys(catalog));
    const missing = enOpsKeys.filter((k) => !present.has(k));
    expect(missing, `${locale} is missing ${missing.length} Ops keys, e.g. ${missing.slice(0, 5).join(', ')}`).toEqual([]);
  });
});
