import { describe, expect, test } from 'vitest';

import {
  STUDENT_IMPORT_HEADER_ROW,
  STUDENT_IMPORT_YEAR_LEVEL_MAX,
  STUDENT_IMPORT_YEAR_LEVEL_MIN,
} from '@/modules/student-import/constants/student-import.constants';
import { parseStudentCsv } from '@/modules/student-import/lib/parse-student-csv';

/**
 * The shared school-admin import parser, over the portal columns. Every rule
 * here mirrors the SERVER validator (schooltest-api validatePortalRows): given
 * name required, family name required, a real YYYY-MM-DD date of birth, year
 * level a whole number inside the contract bounds, home language required, and
 * the optional student key honoured. The header row the template downloads is
 * generated from the same constant the parser accepts.
 */

const VALID = 'Ada,Lovelace,2012-12-10,8,english';

function errorsOf(csv: string) {
  return parseStudentCsv(csv).errors;
}

describe('the portal-column student CSV parser', () => {
  test('the template header row is accepted and skipped', () => {
    const parsed = parseStudentCsv(`${STUDENT_IMPORT_HEADER_ROW}\n${VALID}`);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0]).toEqual({
      line: 2,
      student_key: null,
      given_name: 'Ada',
      family_name: 'Lovelace',
      date_of_birth: '2012-12-10',
      year_level: 8,
      first_language: 'english',
    });
  });

  test('bare data rows (a paste without a header) parse positionally', () => {
    const parsed = parseStudentCsv(VALID);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0].given_name).toBe('Ada');
  });

  test('the optional student key column is honoured when present', () => {
    const parsed = parseStudentCsv(`${VALID},STU-9001`);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0].student_key).toBe('STU-9001');
  });

  test('a quoted family name may hold a comma', () => {
    const parsed = parseStudentCsv('Nguyen,"Thi, Mai",2013-03-04,7,vietnamese');
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0].family_name).toBe('Thi, Mai');
  });

  test('a BOM and CRLF line endings are tolerated', () => {
    const parsed = parseStudentCsv(`\uFEFF${STUDENT_IMPORT_HEADER_ROW}\r\n${VALID}\r\n`);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
  });

  test('a missing given name is a reported error row, never a silent default', () => {
    const errors = errorsOf(`,Lovelace,2012-12-10,8,english`);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      line: 1,
      column: 'given name',
      reason: 'givenNameRequired',
      value: '',
    });
  });

  test('a missing family name is rejected, exactly like the server', () => {
    const errors = errorsOf('Ada,,2012-12-10,8,english');
    expect(errors).toMatchObject([{ column: 'family name', reason: 'familyNameRequired' }]);
  });

  test('a non-ISO or impossible date of birth is rejected', () => {
    expect(errorsOf('Ada,Lovelace,04/12/2012,8,english')).toMatchObject([
      { column: 'date of birth', reason: 'dobInvalid' },
    ]);
    expect(errorsOf('Ada,Lovelace,2013-13-45,8,english')).toMatchObject([
      { column: 'date of birth', reason: 'dobInvalid' },
    ]);
    expect(errorsOf('Ada,Lovelace,,8,english')).toMatchObject([
      { column: 'date of birth', reason: 'dobInvalid' },
    ]);
  });

  test(`year level must be a whole number ${STUDENT_IMPORT_YEAR_LEVEL_MIN}-${STUDENT_IMPORT_YEAR_LEVEL_MAX}`, () => {
    expect(errorsOf(`Ada,Lovelace,2012-12-10,${STUDENT_IMPORT_YEAR_LEVEL_MIN - 1},english`)).toMatchObject([
      { column: 'year level', reason: 'yearLevelInvalid' },
    ]);
    expect(errorsOf(`Ada,Lovelace,2012-12-10,${STUDENT_IMPORT_YEAR_LEVEL_MAX + 1},english`)).toMatchObject([
      { column: 'year level', reason: 'yearLevelInvalid' },
    ]);
    expect(errorsOf('Ada,Lovelace,2012-12-10,8.5,english')).toMatchObject([
      { column: 'year level', reason: 'yearLevelInvalid' },
    ]);
    expect(errorsOf('Ada,Lovelace,2012-12-10,eight,english')).toMatchObject([
      { column: 'year level', reason: 'yearLevelInvalid', value: 'eight' },
    ]);
  });

  test('a missing home language is rejected', () => {
    expect(errorsOf('Ada,Lovelace,2012-12-10,8,')).toMatchObject([
      { column: 'home language', reason: 'homeLanguageRequired' },
    ]);
  });

  test('every bad field of one row is reported, and rows stay independent', () => {
    const parsed = parseStudentCsv('Ada,,31-31-31,99,\nBen,Okonkwo,2011-01-02,9,korean');
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].given_name).toBe('Ben');
    expect(parsed.errors.map((error) => error.reason)).toEqual([
      'familyNameRequired',
      'dobInvalid',
      'yearLevelInvalid',
      'homeLanguageRequired',
    ]);
  });
});
