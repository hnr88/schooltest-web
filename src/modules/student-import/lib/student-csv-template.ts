import {
  IMPORT_TEMPLATE_FILENAME,
  importTemplateColumns,
  importTemplateSampleRow,
} from '@schooltest/ops-contracts';

import { saveCsvDownload } from '@/modules/school-admin';

// The template of spec §2 / "General Notes": generated in the browser from a
// Blob object URL (the task-78 saveCsvDownload path) so the link costs no
// request — but from the CONTRACT's own columns and sample row, never retyped,
// and byte-identical to the ops portal's server download: same header, same
// sample row, same RFC 4180 CRLF records, same filename. One template for
// every import. The header is the wire contract, never translated.
export function buildStudentCsvTemplate(): string {
  const columns = importTemplateColumns('versioned');
  const sample = importTemplateSampleRow('versioned', null);
  const line = (cells: readonly string[]) => `${cells.join(',')}\r\n`;
  const rows = sample ? line(columns.map((column) => sample[column] ?? '')) : '';
  return `${line(columns)}${rows}`;
}

export function downloadStudentCsvTemplate(): void {
  saveCsvDownload(buildStudentCsvTemplate(), IMPORT_TEMPLATE_FILENAME);
}
