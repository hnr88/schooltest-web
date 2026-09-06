import { UNRESOLVED_FIXTURE_ID, runSql } from './auth-db';

/**
 * Resolve NON-CLASS seeded fixtures by their stable natural key.
 *
 * Companion to ./fixture-class.ts, kept separate so each file's name stays true
 * to what it resolves. Same rule, same reason: Strapi GENERATES documentIds, so
 * a pinned id asserts an accident of one database rather than a contract, and it
 * dies silently the moment that row is recreated. Every id here replaced a
 * literal that matched ZERO rows.
 *
 * WHAT THIS FILE DELIBERATELY DOES NOT COVER, because a natural key does not
 * exist for them and inventing one would be worse than the dead id:
 *   - RESULT fixtures (MIXED / FULL / EFFORT_INVALID / NONE) are chosen by
 *     psychometric PROPERTY, not by name. Resolving them by predicate would let
 *     a spec's SUBJECT change without its diff changing — it would keep passing
 *     while measuring a different result. A dead id at least fails loudly.
 *   - SESSIONS are events, not fixtures. A spec that needs one should mint it
 *     and read it back, not capture someone else's.
 *   - "Import Alpha"/"Import Beta" do not exist at all; that is a seed gap and
 *     the import spec should create its own subjects.
 * Those stay red and named rather than quietly resolved.
 */

/** One psql call per distinct key per process — seeded ids do not move mid-run. */
const cache = new Map<string, string>();

/** Escape a SQL string literal (fixture names only — never user input). */
const lit = (value: string): string => value.replace(/'/g, "''");

/**
 * Run a single-column lookup and fail LOUD when it misses: name what was sought
 * and list what the database actually holds, so the reader fixes the seed rather
 * than pinning a fresh id here and restarting the rot.
 */
function resolve(cacheKey: string, what: string, sql: string, listSql: string): string {
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  const id = runSql(sql).trim();
  // An unreachable database is not a missing row: degrade so collection lives,
  // and leave the loud not-found path below for a query that actually ran.
  if (id === UNRESOLVED_FIXTURE_ID) {
    cache.set(cacheKey, UNRESOLVED_FIXTURE_ID);
    return UNRESOLVED_FIXTURE_ID;
  }
  if (!id) {
    const present = runSql(listSql) || '(none at all)';
    throw new Error(
      `[e2e] seeded fixture ${what} not found — cannot resolve its documentId.\n` +
        `Present in the database:\n${present}\n` +
        'Fix the SEED rather than pinning an id here: Strapi generates documentIds, ' +
        'so no fixture can promise a stable one.',
    );
  }
  if (id.includes('\n')) {
    throw new Error(`[e2e] ${what} is ambiguous — it matches more than one row:\n${id}`);
  }
  cache.set(cacheKey, id);
  return id;
}

/** The demo school every ops/school-admin spec operates on. */
export const FIXTURE_SCHOOL_NAME = 'SchoolTest Demo School A';

export function fixtureSchoolId(name: string = FIXTURE_SCHOOL_NAME): string {
  return resolve(
    `school:${name}`,
    `school "${name}"`,
    `select document_id from schools where name = '${lit(name)}'`,
    "select name from schools where name like 'SchoolTest%'",
  );
}

/** Forms carry a real stable business key of their own — use it, not a name. */
export function fixtureFormId(formCode: string): string {
  return resolve(
    `form:${formCode}`,
    `form "${formCode}"`,
    `select document_id from forms where form_code = '${lit(formCode)}'`,
    'select form_code from forms order by form_code',
  );
}

/** A seeded student, keyed by the given/family pair the seed fixes. */
export function fixtureStudentId(givenName: string, familyName: string): string {
  return resolve(
    `student:${givenName} ${familyName}`,
    `student "${givenName} ${familyName}"`,
    `select document_id from students where given_name = '${lit(givenName)}' and family_name = '${lit(familyName)}'`,
    'select given_name || \' \' || family_name from students order by family_name limit 20',
  );
}

/** A seeded users-permissions account, keyed by email (its natural key). */
export function fixtureUserId(email: string): string {
  return resolve(
    `user:${email}`,
    `user "${email}"`,
    `select document_id from up_users where email = '${lit(email)}'`,
    "select email from up_users where email like '%@schooltest.local' order by email",
  );
}
