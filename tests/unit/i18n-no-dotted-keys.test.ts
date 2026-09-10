import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

/**
 * THE LOCALE-FILE INVARIANT (teacher/11 follow-up): no key in ANY locale
 * catalogue may contain a "." character — next-intl treats "." as NESTING, so
 * a flat key like "rows.lowBw.label" is an INVALID_KEY error at access time
 * and the UI renders the key path instead of the string.
 *
 * THREE properties that make this guard real rather than formal:
 * 1. It validates each file against the RULE, independently — it never
 *    compares locales to each other. Cross-locale parity passed for the
 *    entire life of the malformed keys precisely because the fault was
 *    symmetric across all six files; a comparison cannot catch a symmetric
 *    fault.
 * 2. It is GENERIC: every namespace, every nesting level, every locale.
 * 3. It names its offenders, so the next failure self-identifies.
 */

const LOCALES = ['en', 'ko', 'ms', 'th', 'vi', 'zh'] as const;
const MESSAGES_DIR = path.resolve(process.cwd(), 'src/i18n/messages');

/** Walks an object; returns every full key path whose FINAL segment contains a dot. */
export function findDottedKeys(
  node: unknown,
  prefix = '',
  out: string[] = [],
): string[] {
  if (node === null || typeof node !== 'object' || Array.isArray(node)) return out;
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (key.includes('.')) {
      out.push(path);
    } else if (value !== null && typeof value === 'object') {
      findDottedKeys(value, path, out);
    }
  }
  return out;
}

function catalogueFor(locale: string): unknown {
  return JSON.parse(readFileSync(path.join(MESSAGES_DIR, `${locale}.json`), 'utf8'));
}

describe('locale catalogues — no key may contain a dot (the nesting operator)', () => {
  for (const locale of LOCALES) {
    test(`${locale}.json carries zero dotted keys`, () => {
      const offenders = findDottedKeys(catalogueFor(locale));
      expect(
        offenders,
        `${locale}.json has malformed dotted keys: ${JSON.stringify(offenders)}`,
      ).toEqual([]);
    });
  }

  // The guard bites: a crafted malformed catalogue is caught and NAMED.
  test('the walker names offenders on a malformed catalogue', () => {
    const malformed = {
      Teacher: {
        testSessions: {
          live: { settings: { 'rows.lowBw.label': 'Low-bandwidth mode' } },
        },
      },
    };
    expect(findDottedKeys(malformed)).toEqual([
      'Teacher.testSessions.live.settings.rows.lowBw.label',
    ]);
  });
});
