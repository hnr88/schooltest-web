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
 * name required, family name required, an email required AND well-formed (the
 * same grammar the server tests — the address is what the student's account is
 * provisioned from), a real YYYY-MM-DD date of birth, year level a whole number
 * inside the contract bounds, home language required, and the optional student
 * key honoured. The header row the template downloads is generated from the
 * same constant the parser accepts.
 */

const VALID = 'Ada,Lovelace,ada.lovelace@test.invalid,2012-12-10,8,english';

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
      email: 'ada.lovelace@test.invalid',
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

  test('the email cell is normalised to the lowercased form the server stores', () => {
    const parsed = parseStudentCsv('Ada,Lovelace,Ada.Lovelace@Example.Com,2012-12-10,8,english');
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0].email).toBe('ada.lovelace@example.com');
  });

  test('the optional student key column is honoured when present', () => {
    const parsed = parseStudentCsv(`${VALID},STU-9001`);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0].student_key).toBe('STU-9001');
  });

  test('a quoted family name may hold a comma', () => {
    const parsed = parseStudentCsv('Nguyen,"Thi, Mai",nguyen.thi@test.invalid,2013-03-04,7,vietnamese');
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows[0].family_name).toBe('Thi, Mai');
  });

  test('a BOM and CRLF line endings are tolerated', () => {
    const parsed = parseStudentCsv(`\uFEFF${STUDENT_IMPORT_HEADER_ROW}\r\n${VALID}\r\n`);
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toHaveLength(1);
  });

  test('a missing given name is a reported error row, never a silent default', () => {
    const errors = errorsOf(`,Lovelace,ada.lovelace@test.invalid,2012-12-10,8,english`);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      line: 1,
      column: 'given name',
      reason: 'givenNameRequired',
      value: '',
    });
  });

  test('a missing family name is rejected, exactly like the server', () => {
    const errors = errorsOf('Ada,,ada.lovelace@test.invalid,2012-12-10,8,english');
    expect(errors).toMatchObject([{ column: 'family name', reason: 'familyNameRequired' }]);
  });

  test('a missing email is rejected — the account needs an address to provision from', () => {
    const errors = errorsOf('Ada,Lovelace,,2012-12-10,8,english');
    expect(errors).toMatchObject([{ column: 'email', reason: 'emailInvalid', value: '' }]);
  });

  test('a malformed email is rejected, exactly like the server', () => {
    expect(errorsOf('Ada,Lovelace,not-an-address,2012-12-10,8,english')).toMatchObject([
      { column: 'email', reason: 'emailInvalid', value: 'not-an-address' },
    ]);
    expect(errorsOf('Ada,Lovelace,ada.lovelace@no-tld,2012-12-10,8,english')).toMatchObject([
      { column: 'email', reason: 'emailInvalid' },
    ]);
    expect(errorsOf('Ada,Lovelace,ada lovelace@test.invalid,2012-12-10,8,english')).toMatchObject([
      { column: 'email', reason: 'emailInvalid' },
    ]);
  });

  test('a non-ISO or impossible date of birth is rejected', () => {
    expect(errorsOf('Ada,Lovelace,ada.lovelace@test.invalid,04/12/2012,8,english')).toMatchObject([
      { column: 'date of birth', reason: 'dobInvalid' },
    ]);
    expect(errorsOf('Ada,Lovelace,ada.lovelace@test.invalid,2013-13-45,8,english')).toMatchObject([
      { column: 'date of birth', reason: 'dobInvalid' },
    ]);
    expect(errorsOf('Ada,Lovelace,ada.lovelace@test.invalid,,8,english')).toMatchObject([
      { column: 'date of birth', reason: 'dobInvalid' },
    ]);
  });

  test(`year level must be a whole number ${STUDENT_IMPORT_YEAR_LEVEL_MIN}-${STUDENT_IMPORT_YEAR_LEVEL_MAX}`, () => {
    expect(errorsOf(`Ada,Lovelace,ada.lovelace@test.invalid,2012-12-10,${STUDENT_IMPORT_YEAR_LEVEL_MIN - 1},english`)).toMatchObject([
      { column: 'year level', reason: 'yearLevelInvalid' },
    ]);
    expect(errorsOf(`Ada,Lovelace,ada.lovelace@test.invalid,2012-12-10,${STUDENT_IMPORT_YEAR_LEVEL_MAX + 1},english`)).toMatchObject([
      { column: 'year level', reason: 'yearLevelInvalid' },
    ]);
    expect(errorsOf('Ada,Lovelace,ada.lovelace@test.invalid,2012-12-10,8.5,english')).toMatchObject([
      { column: 'year level', reason: 'yearLevelInvalid' },
    ]);
    expect(errorsOf('Ada,Lovelace,ada.lovelace@test.invalid,2012-12-10,eight,english')).toMatchObject([
      { column: 'year level', reason: 'yearLevelInvalid', value: 'eight' },
    ]);
  });

  test('a missing home language is rejected', () => {
    expect(errorsOf('Ada,Lovelace,ada.lovelace@test.invalid,2012-12-10,8,')).toMatchObject([
      { column: 'home language', reason: 'homeLanguageRequired' },
    ]);
  });

  test('every bad field of one row is reported, and rows stay independent', () => {
    const parsed = parseStudentCsv('Ada,,31-31-31,99,\nBen,Okonkwo,ben.okonkwo@test.invalid,2011-01-02,9,korean');
    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].given_name).toBe('Ben');
    // The email cell '31-31-31' is malformed on top of the four other bad
    // fields — each one is named, never just the first.
    expect(parsed.errors.map((error) => error.reason)).toEqual([
      'familyNameRequired',
      'emailInvalid',
      'dobInvalid',
      'yearLevelInvalid',
      'homeLanguageRequired',
    ]);
  });
});
