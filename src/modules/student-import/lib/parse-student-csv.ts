import {
  STUDENT_IMPORT_ALL_COLUMNS,
  STUDENT_IMPORT_FIELD_ERRORS,
  STUDENT_IMPORT_YEAR_PATTERN,
} from '@/modules/student-import/constants/student-import.constants';
import { studentImportRowSchema } from '@/modules/student-import/schemas/student-import.schema';
import type {
  ParsedStudentCsv,
  ParsedStudentRowError,
} from '@/modules/student-import/types/student-import.types';

// Pure reader for the shared student-import CSV (the portal vocabulary). The
// header row is optional and columns are positional in template order, so a
// paste of bare data lines works exactly like the downloaded template. Records
// are physical lines — a quoted cell may hold a comma ("Nguyen, Thi") but not a
// newline, which is the one RFC 4180 case a paste box realistically never
// produces.

const BOM = '\uFEFF';

/** Lowercase + trim + underscores-to-spaces + collapse whitespace. */
function normalise(value: string): string {
  return value.trim().toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ');
}

function splitCells(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (inQuotes) {
      if (char !== '"') {
        cell += char;
      } else if (line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = false;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cells.push(cell);
      cell = '';
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

const isBlank = (cells: readonly string[]): boolean => cells.every((value) => value === '');

/** A first record whose every filled cell names a template column is the header. */
function isHeaderRecord(cells: readonly string[]): boolean {
  const filled = cells.filter((value) => value !== '');
  return (
    filled.length > 0 &&
    filled.every((value) =>
      (STUDENT_IMPORT_ALL_COLUMNS as readonly string[]).includes(normalise(value)),
    )
  );
}

const cellAt = (cells: readonly string[], index: number): string => cells[index] ?? '';

function toCandidate(cells: readonly string[], line: number): Record<string, unknown> {
  const yearRaw = cellAt(cells, 3);
  const studentKey = cellAt(cells, 5);
  return {
    line,
    given_name: cellAt(cells, 0),
    family_name: cellAt(cells, 1),
    date_of_birth: cellAt(cells, 2),
    // A whole number parses to its number (the schema range-checks it); anything
    // else travels as the raw text so the schema rejects it and the error row
    // can quote the offending value.
    year_level: STUDENT_IMPORT_YEAR_PATTERN.test(yearRaw)
      ? Number.parseInt(yearRaw, 10)
      : yearRaw,
    first_language: cellAt(cells, 4),
    student_key: studentKey === '' ? null : studentKey,
  };
}

function toRowErrors(
  cells: readonly string[],
  line: number,
  paths: readonly PropertyKey[],
): ParsedStudentRowError[] {
  const errors: ParsedStudentRowError[] = [];
  const seen = new Set<string>();
  for (const path of paths) {
    const key = String(path);
    const field = STUDENT_IMPORT_FIELD_ERRORS[key as keyof typeof STUDENT_IMPORT_FIELD_ERRORS];
    if (!field || seen.has(key)) continue;
    seen.add(key);
    errors.push({
      line,
      column: field.column,
      reason: field.reason,
      value: cellAt(cells, STUDENT_IMPORT_ALL_COLUMNS.indexOf(field.column)),
    });
  }
  return errors;
}

export function parseStudentCsv(input: string): ParsedStudentCsv {
  const text = input.startsWith(BOM) ? input.slice(BOM.length) : input;
  const result: ParsedStudentCsv = { rows: [], errors: [] };
  let headerSeen = false;

  for (const [index, line] of text.split(/\r\n|\n|\r/).entries()) {
    const cells = splitCells(line);
    if (isBlank(cells)) continue;
    if (!headerSeen) {
      headerSeen = true;
      if (isHeaderRecord(cells)) continue;
    }

    const parsed = studentImportRowSchema.safeParse(toCandidate(cells, index + 1));
    if (parsed.success) {
      result.rows.push(parsed.data);
      continue;
    }
    result.errors.push(
      ...toRowErrors(
        cells,
        index + 1,
        parsed.error.issues.map((issue) => issue.path[0]),
      ),
    );
  }

  return result;
}
