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
 * Ops-namespace parity shut.
 *
 * KEY PARITY IS NOW CATALOG-WIDE, not Ops-only. The NON-Ops debt this file
 * previously excluded (80 keys in ko/ms/th/vi, 6 in zh — Classes.detail,
 * Classes.studentDetail, Shell.nav ops entries, Auth.sessionExpired*) was
 * translated in the closing slice, so the presence check below now derives from
 * EVERY en key. There is no remaining namespace to carve out, and carving one
 * out again would be how the raw-key class regrows.
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

const enAllKeys = flatKeys(en);
const enOpsKeys = enAllKeys.filter((k) => k.startsWith('Ops.'));
const LOCALES = ['zh', 'ko', 'ms', 'vi', 'th'] as const;

const catalogFor = (locale: string): Catalog =>
  JSON.parse(
    readFileSync(path.join(WEB_ROOT, 'src', 'i18n', 'messages', `${locale}.json`), 'utf8'),
  ) as Catalog;

describe('Ops i18n locale parity', () => {
  it('the en Ops namespace is non-trivial — an empty census proves nothing', () => {
    // Floor recalibrated 2026-09-09 for mvp/ops task 41 (R-09…R-14): retiring the
    // six console i18n groups legitimately shrank the Ops slice (measured: 1115 keys at HEAD → 774 now).
    // The floor still catches an empty or gutted catalog, which is its only job.
    expect(enOpsKeys.length).toBeGreaterThan(700);
  });

  it.each(LOCALES)('%s carries every en Ops.* key — no raw keys for non-en operators', (locale) => {
    const present = new Set(flatKeys(catalogFor(locale)));
    const missing = enOpsKeys.filter((k) => !present.has(k));
    expect(missing, `${locale} is missing ${missing.length} Ops keys, e.g. ${missing.slice(0, 5).join(', ')}`).toEqual([]);
  });
});

describe('catalog-wide i18n key parity (non-Ops trees included)', () => {
  it('the en catalog is non-trivial', () => {
    // Floor recalibrated 2026-09-09 for mvp/ops task 41: the same retirement
    // took the whole catalog (measured: 4189 keys at HEAD → 3841 now). Both ratios below keep the
    // guard's real purpose — a non-empty catalog that is strictly larger than
    // its Ops slice — while accepting the ruled removals.
    expect(enAllKeys.length).toBeGreaterThan(3500);
    // And it must be strictly larger than the Ops slice, or "catalog-wide"
    // would silently mean "Ops-only" again.
    expect(enAllKeys.length).toBeGreaterThan(enOpsKeys.length + 2000);
  });

  it.each(LOCALES)('%s carries every en key, in EVERY namespace', (locale) => {
    const present = new Set(flatKeys(catalogFor(locale)));
    const missing = enAllKeys.filter((k) => !present.has(k));
    expect(
      missing,
      `${locale} is missing ${missing.length} keys, e.g. ${missing.slice(0, 5).join(', ')}`,
    ).toEqual([]);
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
  { value: /^ACARA:$/, why: 'the ACARA proper noun as a field label — the colon is punctuation, not English' },
  {
    value: /^\{\w+\}\s*\/\s*(\{\w+\}|\d+)$/,
    why: "a fraction built from interpolations (e.g. \"{completed} / {total}\", \"{score} / 100\"): there is no prose to translate, and rewriting the separator would break the reading order the component lays out",
  },
  {
    value: /^\{\w+\}\s*→\s*\{\w+\}$/,
    why: "an arrow between interpolations (e.g. \"{from} → {to}\", Teacher.results progress/score deltas): the arrow IS the rendering — no words to translate, and localising the glyph would break the delta layout",
  },
  {
    key: 'Ops.resultWindows.scorePercent',
    why: 'a bare "{score}%" interpolation — the percent sign is punctuation, identical in every locale',
  },
  {
    key: 'Ops.resultWindows.cefrValue',
    why: '" · {cefr}" — an interpunct separator plus the CEFR proper noun as an interpolation; no prose to translate',
  },
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

/**
 * CONTENT parity for the NON-Ops trees the closing slice delivered.
 *
 * Scoped deliberately, and the scope is the honest part. Key parity above is
 * catalog-wide because every en key now exists in every catalog. CONTENT parity
 * cannot be, yet: measured 2026-09-08, the catalogs still hold 608–636 non-Ops
 * values per locale that are byte-identical to en — concentrated in
 * `Home.pilot` (~93/locale), `Home.footer`, `SchoolAdmin.account`,
 * `Home.pricing`, `Classes.addForm` and `SchoolStudents.import`. That is
 * pre-existing marketing/admin-surface debt, it predates this mission, and the
 * closing slice was told to REPORT it rather than fix it. Asserting it here
 * would ship a permanently red spec, which teaches the suite to be ignored.
 *
 * So this block pins exactly what was translated, and nothing it did not earn.
 * When someone repays the Home/SchoolAdmin debt, they should widen
 * TRANSLATED_TREES rather than add a second spec.
 */
const TRANSLATED_TREES = [
  'Classes.detail.',
  'Classes.studentDetail.',
  'Classes.studentDetailMeta.',
  'Shell.nav.',
  'Shell.sidebar.groups.',
  'Teacher.results.',
  'Auth.sessionExpired',
] as const;

const enTranslated = new Map(
  flatEntries(en).filter(([k]) => TRANSLATED_TREES.some((t) => k.startsWith(t))),
);

describe('non-Ops i18n content parity (the trees this slice translated)', () => {
  it('the scoped tree set is non-empty and covers the delivered keys', () => {
    expect(enTranslated.size).toBeGreaterThan(80);
  });

  it.each(LOCALES)('%s translates the Classes/Shell.nav/Shell-sidebar-groups/Teacher.results/Auth-session trees', (locale) => {
    const catalog = catalogFor(locale);
    const still = flatEntries(catalog)
      .filter(([key, value]) => {
        if (typeof value !== 'string') return false;
        const source = enTranslated.get(key);
        if (typeof source !== 'string' || source !== value) return false;
        if (!/[A-Za-z]{3,}/.test(source)) return false;
        return !exempt(locale, key, value);
      })
      .map(([key, value]) => `${key} = ${String(value)}`);
    expect(
      still,
      `${locale} still renders English for ${still.length} of these keys, e.g. ${still.slice(0, 5).join(' | ')}`,
    ).toEqual([]);
  });
});
