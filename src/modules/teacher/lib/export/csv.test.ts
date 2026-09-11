import { describe, expect, test } from 'vitest';

import { parseCsv } from '@/modules/teacher/lib/export/__fixtures__/parse-csv';
import { csvFilename, toCsv } from '@/modules/teacher/lib/export/csv';
import t2Dashboard from '@/modules/teacher/lib/__fixtures__/teacher-dashboard.t2.json';
import { t2Roster } from '@/modules/teacher/lib/v2/__fixtures__/t2';

// RFC 4180 on values recorded from the live API (:5500) as t2 on 2026-09-11 — a roster
// name and the class name — plus edge values derived from them.
const name = t2Roster[0]?.student.name ?? '';
const className = t2Dashboard.classes[0]?.name ?? '';

describe('toCsv', () => {
  test('CRLF between records; plain text unquoted; numbers as numbers; null as an empty field', () => {
    expect(toCsv([[name, 41, null], [name, 0, -45]])).toBe(`${name},41,\r\n${name},0,-45`);
  });

  test('a comma, a double quote or a line break quotes the field and doubles its quotes', () => {
    const text = toCsv([[`${name}, "${name}"`], [`${name}\n${name}`]]);
    expect(text).toBe(`"${name}, ""${name}"""\r\n"${name}\n${name}"`);
    expect(parseCsv(text)).toEqual([[`${name}, "${name}"`], [`${name}\n${name}`]]);
  });

  test('every record is padded to the widest one', () => {
    expect(toCsv([[name], [name, 1, 2], []])).toBe(`${name},,\r\n${name},1,2\r\n,,`);
  });

  test('text a spreadsheet would evaluate is neutralised; numbers are left alone', () => {
    expect(toCsv([['=SUM(A1)', '+1', '-2', '@x', -2]])).toBe("'=SUM(A1),'+1,'-2,'@x,-2");
  });

  test('a non-finite number is an empty field, never "NaN"', () => {
    expect(toCsv([[Number.NaN, Number.POSITIVE_INFINITY]])).toBe(',');
  });
});

describe('csvFilename', () => {
  test('the recorded class name folds to a lower-case slug', () => {
    expect(className).not.toBe('');
    expect(csvFilename(className, 'student-reports')).toMatch(/^[\p{Ll}\p{N}]+(-[\p{Ll}\p{N}]+)*-student-reports\.csv$/u);
    expect(csvFilename(className, 'class-summary')).toBe(
      `${className.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-class-summary.csv`,
    );
  });

  test('accents fold to their letters; a name with no letters or digits falls back to "class"', () => {
    expect(csvFilename(`É${className}`, 'x')).toBe(csvFilename(`E${className}`, 'x'));
    expect(csvFilename('— · —', 'x')).toBe('class-x.csv');
  });
});
