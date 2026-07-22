import { expect, test } from '@playwright/test';

import {
  CEFR_LADDER,
  householdProgressChildSchema,
  householdProgressDataSchema,
  householdProgressHouseholdSchema,
} from '../../../schooltest-api/src/contracts/parent-household-progress';
import { cefrBandSchema } from '../../../schooltest-api/src/contracts/vocab';

import { runSql } from './helpers/auth-db';

const statusSchema = householdProgressChildSchema.shape.status;

const TOP_PARENT = `(select user_id from students_parent_lnk group by user_id
   order by count(*) desc, user_id limit 1)`;

const HOUSEHOLD_SQL = `select
  (select count(*) from students s join students_parent_lnk l on l.student_id = s.id
     where l.user_id = ${TOP_PARENT} and s.status in ('active', 'enrolled')),
  (select count(*) from sessions se where se.status = 'complete' and se.student_document_id in
     (select s.document_id from students s join students_parent_lnk l on l.student_id = s.id
        where l.user_id = ${TOP_PARENT})),
  (select count(*) from results r
     join results_student_lnk rl on rl.result_id = r.id
     join students_parent_lnk l on l.student_id = rl.student_id
     where r.destination = 'official' and l.user_id = ${TOP_PARENT})`;

const CHILDREN_SQL = `select coalesce(json_agg(json_build_object(
    'documentId', s.document_id, 'givenName', s.given_name, 'familyName', s.family_name,
    'yearLevel', s.year_level, 'status', s.status) order by s.id), '[]'::json)
  from students s join students_parent_lnk l on l.student_id = s.id
  where l.user_id = ${TOP_PARENT}`;

function rows(sql: string): string[] {
  return runSql(sql)
    .split('\n')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function realHousehold(): { childCount: number; testsCompleted: number; resultsPublished: number } {
  const [childCount, testsCompleted, resultsPublished] = runSql(HOUSEHOLD_SQL)
    .split('|')
    .map((value) => Number.parseInt(value, 10));
  return { childCount, testsCompleted, resultsPublished };
}

function realChildren() {
  const children = JSON.parse(runSql(CHILDREN_SQL)) as unknown;
  return householdProgressDataSchema.parse({ household: realHousehold(), children }).children;
}

test.describe('C-DASH-HOUSEHOLD stage-1 contract vs the real dev database', () => {
  test('every students.status value in the database parses against the child status enum', () => {
    const statuses = rows('select distinct status from students where status is not null');
    expect(statuses.length).toBeGreaterThan(0);
    for (const status of statuses) {
      expect(statusSchema.safeParse(status).success, status).toBe(true);
    }
  });

  test('every results.cefr_band value in the database is a real rung of CEFR_LADDER', () => {
    const bands = rows('select distinct cefr_band from results where cefr_band is not null');
    expect(bands.length).toBeGreaterThan(0);
    const ladder: readonly string[] = CEFR_LADDER;
    for (const band of bands) {
      expect(cefrBandSchema.safeParse(band).success, band).toBe(true);
      expect(ladder).toContain(band);
    }
    expect(bands).not.toContain('C2');
  });

  test('CEFR_LADDER is the six-rung API ladder starting at pre_A1, never C2', () => {
    expect(CEFR_LADDER).toHaveLength(6);
    expect(CEFR_LADDER[0]).toBe('pre_A1');
    const ladder: readonly string[] = CEFR_LADDER;
    expect(ladder).not.toContain('C2');
    expect(rows(`select count(*) from results where cefr_band = 'C2'`)).toEqual(['0']);
  });

  test('a household object built from a real SQL count triple parses', () => {
    const household = realHousehold();
    expect(household.childCount).toBeGreaterThan(0);
    const parsed = householdProgressHouseholdSchema.safeParse(household);
    expect(parsed.success, parsed.error?.message).toBe(true);
  });

  test('a data object built from the real household rows parses', () => {
    const children = JSON.parse(runSql(CHILDREN_SQL)) as unknown;
    const parsed = householdProgressDataSchema.safeParse({ household: realHousehold(), children });
    expect(parsed.success, parsed.error?.message).toBe(true);
    expect(parsed.data?.children.length).toBeGreaterThan(0);
  });

  test('a mutated object is rejected by the strict schema', () => {
    const household = realHousehold();

    const extraKey = householdProgressHouseholdSchema.safeParse({ ...household, avgScore: 86 });
    expect(extraKey.success).toBe(false);
    expect(extraKey.error?.issues[0]?.code).toBe('unrecognized_keys');

    const negative = householdProgressHouseholdSchema.safeParse({ ...household, childCount: -1 });
    expect(negative.success).toBe(false);
    expect(negative.error?.issues[0]?.path).toEqual(['childCount']);

    const composite = householdProgressDataSchema.safeParse({
      household,
      children: realChildren().map((child) => ({ ...child, cefrBand: 'B1' })),
    });
    expect(composite.success).toBe(false);
    expect(composite.error?.issues[0]?.code).toBe('unrecognized_keys');
  });
});
