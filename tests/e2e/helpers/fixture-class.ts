import { runSql } from './auth-db';

/**
 * Resolve a seeded fixture class by NAME, never by a pinned documentId.
 *
 * WHY THIS EXISTS. Nineteen specs pinned `x1hat1dy90boz11n9zyphoan` as the
 * documentId of "EAL/D Year 7 - Room 4". That row's live id is
 * `tckipfoi2po8avd96jh2sf0y` and the pinned one matches ZERO rows, so every one
 * of those specs was asserting against a class that does not exist. The API
 * seed's own docblock (`seed-school-classes.ts`) states the rule they broke:
 *
 *   "Keyed by NAME rather than by documentId because Strapi GENERATES
 *    documentIds — they cannot be chosen, so no fixture can promise a stable
 *    one and anything hard-coding one is wrong on any fresh database."
 *
 * A pinned id is not an assertion about a contract; it is an assertion about an
 * accident of one database, and it rots the moment that row is recreated. The
 * NAME is the strongest identity the seed can offer, and it is deliberately
 * chosen and sort-pinned on the API side, so it is what specs must resolve.
 *
 * SQL rather than the C-TEACH-01 payload ON PURPOSE: five of these specs derive
 * module-level URL constants (`const TEST_DAY_URL = ...${CLASS_ID}...`) that are
 * evaluated at IMPORT time, before any fixture or `beforeAll` can run. An async
 * payload read cannot populate them; `runSql` is synchronous and is already the
 * established idiom here (`teacher-contract-fixtures.spec.ts` resolves its whole
 * fixture set this way). Same source of truth, usable one phase earlier.
 */

/** The seeded class every teacher-surface spec operates on (API `FIXTURE.className`). */
export const FIXTURE_CLASS_NAME = 'EAL/D Year 7 - Room 4';

/** The seeded class that deliberately holds no students (API `FIXTURE.emptyClassName`). */
export const EMPTY_CLASS_NAME = 'EAL/D Year 8 - Room 5 (no students)';

/** One psql call per distinct name per process — these ids do not move mid-run. */
const cache = new Map<string, string>();

/**
 * The live documentId for a seeded class name.
 *
 * Throws LOUD and SPECIFIC when the name is absent — naming what was sought and
 * listing what the database actually holds. The pinned-id failure cost three
 * hours precisely because it surfaced as `expect(fixture).toBeTruthy()` receiving
 * `undefined`, which says nothing about why. A fixture that cannot resolve must
 * say so in the terms the reader needs to fix it.
 */
export function fixtureClassId(name: string = FIXTURE_CLASS_NAME): string {
  const cached = cache.get(name);
  if (cached !== undefined) return cached;

  const escaped = name.replace(/'/g, "''");
  const id = runSql(`select document_id from classes where name = '${escaped}'`).trim();
  if (!id) {
    const present = runSql('select name from classes order by name') || '(no classes at all)';
    throw new Error(
      `[e2e] seeded class "${name}" not found — cannot resolve its documentId.\n` +
        `Classes present in the database:\n${present}\n` +
        'Fix the SEED (schooltest-api seed-school-classes.ts) rather than pinning an id here: ' +
        'Strapi generates documentIds, so no fixture can promise a stable one.',
    );
  }
  if (id.includes('\n')) {
    throw new Error(
      `[e2e] class name "${name}" is ambiguous — it matches more than one row:\n${id}\n` +
        'A fixture name must identify exactly one class.',
    );
  }
  cache.set(name, id);
  return id;
}
