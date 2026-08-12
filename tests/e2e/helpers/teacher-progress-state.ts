/**
 * Task 063 — which C-TR-4 state ONE class is supposed to be in, derived from that
 * class's own Postgres completion counts.
 *
 * `available` is PER CLASS: C-TR-4 answers `false` for a class no student has
 * finished Test B in. Two specs used to assume otherwise — one asserted
 * `available === true` for every owned class, the other iterated every class
 * through a populated-tab assertion — so seeding the Test-A-only class brief flow
 * 22 needs would have turned them red for the wrong reason. Both now ask here.
 *
 * No SQL is written here: every count comes from `dbCompletedCount`, the probe
 * that already mirrors the shipped `attemptOf` rule (one attempt per
 * (student, form) over the ACTIVE roster; a `complete` session plus a `complete`
 * + `official` + `skill`-scope Result), with the form codes read from the
 * server's own `TEACHER_TEST_FORM_CODES`. `both` is inclusion–exclusion over that
 * same probe — |A| + |B| − |A ∪ B| — so there is no second, looser query to drift
 * from the first.
 */
import { dbCompletedCount, FORM_CODES } from './teacher-insights-live';

/** One class's real Test A / Test B / both-tests completion counts. */
export interface DbCohort {
  testA: number;
  testB: number;
  both: number;
}

export function dbCohort(classDocumentId: string): DbCohort {
  const testA = dbCompletedCount(classDocumentId, [FORM_CODES.A]);
  const testB = dbCompletedCount(classDocumentId, [FORM_CODES.B]);
  const either = dbCompletedCount(classDocumentId, [FORM_CODES.A, FORM_CODES.B]);
  return { testA, testB, both: testA + testB - either };
}

/** A class card carrying at least the fields these helpers select on. */
interface ClassRef {
  class_document_id: string;
  name: string;
}

/**
 * The first class that HAS a comparison to show. Specs asserting the populated
 * Progress tab need one, and `classes[0]` would tie them to the dashboard's
 * ordering and to which classes happen to be seeded.
 */
export function comparableClasses<T extends ClassRef>(classes: readonly T[]): T[] {
  const found = classes.filter((card) => dbCohort(card.class_document_id).both > 0);
  if (found.length === 0) {
    throw new Error('[e2e] no owned class has a both-tests cohort — Test B is unseeded');
  }
  return found;
}

/**
 * The first class with Test A completions and NO Test B — C-TR-4's real empty
 * state (EAL/D 9A, seeded by `.qa/seed-diagnostics.mjs` through the live R
 * engine). Named nowhere: it is found by its DATA.
 */
export function testAOnlyClass<T extends ClassRef>(classes: readonly T[]): T {
  const card = classes.find((entry) => {
    const db = dbCohort(entry.class_document_id);
    return db.testA > 0 && db.testB === 0;
  });
  if (!card) throw new Error('[e2e] no owned class is Test-A-only — run .qa/seed-diagnostics.mjs');
  return card;
}
