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
 *
 * SECOND HALF — CONTENT parity (task 073115d9). Key presence is not enough: a
 * key can exist and still hold the ENGLISH sentence, which renders English to a
 * non-en operator just as plainly as a raw key does. That was measured right
 * after key parity closed — 150-151 Ops keys per locale still English, e.g.
 * `Ops.schools.filterStatus`, `Ops.import.*`, `Ops.inspection.*` — and one pair
 * disagreed on the same screen (`Ops.schools.portalStatus.pending_setup` in
 * English beside a translated `Ops.classesTab.status.pending_setup`). So this
 * file also asserts that no Ops value equals its en value unless the ALLOWLIST
 * below says why that is correct. Each exemption carries its own justification:
 * an entry without a reason is not an exemption, it is unfinished work.
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

/**
 * Values that MAY legitimately equal English, each with the reason it is not
 * debt. `locales: undefined` means the exemption holds for all five.
 */
interface Exemption {
  readonly why: string;
  readonly locales?: readonly string[];
  readonly key?: string;
  readonly value?: RegExp;
}

const ALLOWLIST: readonly Exemption[] = [
  { value: /^—$/, why: 'em dash: a typographic symbol, not English text' },
  { value: /^-$/, why: 'hyphen placeholder: a symbol' },
  { value: /^GDPR$/, why: 'proper noun — the regulation is named GDPR in every locale' },
  { value: /^SMTP$/, why: 'protocol name, untranslated everywhere' },
  { value: /^SEO$/, why: 'industry initialism, used as-is in all five catalogs' },
  { value: /^API$/, why: 'initialism, used as-is in all five catalogs' },
  { value: /^UID$/, why: 'technical identifier' },
  { value: /^CEFR$/, why: 'framework name (Common European Framework of Reference)' },
  { value: /^ACARA$/, why: 'Australian curriculum authority — a proper noun' },
  { value: /^EAL\/D$/, why: 'Australian programme name, used as-is' },
  { value: /^SchoolTest$/, why: 'the product name' },
  { value: /^Redis$/, why: 'product name' },
  { value: /^PostgreSQL$/, why: 'product name' },
  { value: /^\d[\d\s.,:%–-]*$/, why: 'numeric-only value: nothing to translate' },
  { value: /^\{[^}]+\}$/, why: 'bare interpolation: nothing to translate' },
  { value: /^Email$/, locales: ['vi'], why: 'Vietnamese uses the loanword "Email" — Auth.emailLabel already does' },
  { value: /^Status$/, locales: ['ms'], why: 'Malay for status IS "Status" — the Ops.schoolTables.columnStatus precedent' },
  { value: /^Audit$/, locales: ['ms'], why: 'Malay uses "Audit" — Navigation.opsAudit reads "Audit & keselamatan"' },
  { value: /^Media$/, locales: ['ms', 'vi'], why: 'loanword in both catalogs' },
  { value: /^Enterprise$/, locales: ['ms'], why: 'Malay software UI keeps the tier name "Enterprise"' },
  { value: /^Standard$/, locales: ['ms'], why: 'Malay for standard IS "Standard"' },
  { value: /^Item$/, locales: ['ms'], why: 'Malay for item IS "Item"' },
  { value: /^Web$/, locales: ['ms', 'vi'], why: 'both catalogs use the loanword "Web"' },
  {
    key: 'Ops.import.placeholder',
    why: 'a LITERAL CSV header row the uploaded file must contain — translating it would tell the operator to write headers the importer rejects',
  },
  {
    key: 'Ops.settings.testEmail.placeholder',
    why: 'an example address on the RFC 2606 reserved domain; localising the local part would suggest a real mailbox',
  },
  { key: 'Ops.system.info.fields.nodeVersion', why: 'product name: the runtime is called Node everywhere' },
  { key: 'Ops.system.info.fields.strapiVersion', why: 'product name: Strapi' },
];

function exempt(locale: string, key: string, value: string): boolean {
  return ALLOWLIST.some(
    (entry) =>
      (entry.locales === undefined || entry.locales.includes(locale)) &&
      (entry.key !== undefined ? entry.key === key : (entry.value as RegExp).test(value)),
  );
}

function flatEntries(node: Catalog, prefix = ''): Array<[string, unknown]> {
  return Object.entries(node).flatMap(([k, v]) =>
    v !== null && typeof v === 'object'
      ? flatEntries(v as Catalog, `${prefix}${k}.`)
      : [[`${prefix}${k}`, v] as [string, unknown]],
  );
}

const enOps = new Map(flatEntries(en).filter(([k]) => k.startsWith('Ops.')));

describe('Ops i18n content parity', () => {
  it('every allowlist exemption carries a justification', () => {
    const unjustified = ALLOWLIST.filter((e) => e.why.trim().length < 10);
    expect(unjustified).toEqual([]);
    // And each entry must actually be scoped to something.
    expect(ALLOWLIST.filter((e) => e.key === undefined && e.value === undefined)).toEqual([]);
  });

  it.each(LOCALES)('%s translates every Ops value it holds — no English left on the screen', (locale) => {
    const catalog = JSON.parse(
      readFileSync(path.join(WEB_ROOT, 'src', 'i18n', 'messages', `${locale}.json`), 'utf8'),
    ) as Catalog;
    const still = flatEntries(catalog)
      .filter(([key, value]) => {
        if (typeof value !== 'string') return false;
        const source = enOps.get(key);
        if (typeof source !== 'string' || source !== value) return false;
        // Only values with real words in them can be "still English".
        if (!/[A-Za-z]{3,}/.test(source)) return false;
        return !exempt(locale, key, value);
      })
      .map(([key, value]) => `${key} = ${String(value)}`);
    expect(
      still,
      `${locale} still renders English for ${still.length} Ops keys, e.g. ${still.slice(0, 5).join(' | ')}`,
    ).toEqual([]);
  });
});
