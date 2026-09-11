import { CSV_LINE_BREAK } from '@/modules/teacher/constants/class-reports.constants';
import type { CsvCell } from '@/modules/teacher/types/class-reports.types';

/**
 * RFC 4180 text: CRLF between records, a field holding a comma, a double quote,
 * CR or LF is quoted with its quotes doubled, and every record is padded to the
 * widest one so the file keeps one field count throughout. A text field opening
 * with `=`, `+`, `-`, `@`, tab or CR is prefixed with `'` so a spreadsheet never
 * evaluates it (OWASP CSV injection); numbers are written as numbers.
 */
const NEEDS_QUOTES = /[",\r\n]/;
const FORMULA_START = /^[=+\-@\t\r]/;

function field(cell: CsvCell): string {
  if (cell === null) return '';
  if (typeof cell === 'number') return Number.isFinite(cell) ? String(cell) : '';
  const text = FORMULA_START.test(cell) ? `'${cell}` : cell;
  return NEEDS_QUOTES.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(records: readonly (readonly CsvCell[])[]): string {
  const width = Math.max(0, ...records.map((record) => record.length));
  return records
    .map((record) => {
      const padded = [...record, ...Array<CsvCell>(width - record.length).fill(null)];
      return padded.map(field).join(',');
    })
    .join(CSV_LINE_BREAK);
}

/** A download name from the class name: lower-case, non-alphanumerics folded to `-`. */
export function csvFilename(className: string, suffix: string): string {
  const slug = className
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug === '' ? 'class' : slug}-${suffix}.csv`;
}
