import {
  ACARA_PHASES,
  FIRST_LANGUAGES,
  STUDENT_IMPORT_COLUMNS,
  STUDENT_IMPORT_FIELD_ERRORS,
} from '@/modules/student-import/constants/student-import.constants';
import { studentImportRowSchema } from '@/modules/student-import/schemas/student-import.schema';
import type {
  ParsedStudentCsv,
  ParsedStudentRowError,
} from '@/modules/student-import/types/student-import.types';

// Pure reader for the shared student-import CSV (spec §2/§4). The header row is
// optional and columns are positional in template order, so a paste of bare data
// lines works exactly like the downloaded template. Records are physical lines —
// a quoted cell may hold a comma ("Nguyen, Thi") but not a newline, which is the
// one RFC 4180 case a paste box realistically never produces.

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
      (STUDENT_IMPORT_COLUMNS as readonly string[]).includes(normalise(value)),
    )
  );
}

/**
 * Blank stays null (the field is optional server-side); an unmappable value is
 * handed back verbatim so the row schema rejects it and it surfaces as an error
 * row rather than a silent default.
 */
function matchPicklist(options: readonly string[], raw: string): string | null {
  if (raw === '') return null;
  return options.find((option) => normalise(option) === normalise(raw)) ?? raw;
}

const cellAt = (cells: readonly string[], index: number): string => cells[index] ?? '';

function toCandidate(cells: readonly string[], line: number): Record<string, unknown> {
  const familyName = cellAt(cells, 1);
  const email = cellAt(cells, 2);
  return {
    line,
    given_name: cellAt(cells, 0),
    family_name: familyName === '' ? null : familyName,
    email: email === '' ? null : email,
    first_language: matchPicklist(FIRST_LANGUAGES, cellAt(cells, 3)),
    acara_phase: matchPicklist(ACARA_PHASES, cellAt(cells, 4)),
  };
}

function toRowErrors(
  cells: readonly string[],
  line: number,
  paths: readonly PropertyKey[],
): ParsedStudentRowError[] {
  const errors: ParsedStudentRowError[] = [];
  for (const path of paths) {
    const field = STUDENT_IMPORT_FIELD_ERRORS[path as keyof typeof STUDENT_IMPORT_FIELD_ERRORS];
    if (!field) continue;
    errors.push({
      line,
      column: field.column,
      reason: field.reason,
      value: cellAt(cells, STUDENT_IMPORT_COLUMNS.indexOf(field.column)),
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
