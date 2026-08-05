import { saveCsvDownload } from '@/modules/school-admin';
import {
  STUDENT_IMPORT_HEADER_ROW,
  STUDENT_IMPORT_TEMPLATE_FILENAME,
} from '@/modules/student-import/constants/student-import.constants';

// The blank template of spec §2 / "General Notes": header row only, generated in
// the browser from a Blob object URL (the task-78 saveCsvDownload path) so the
// link costs no request. The header is the wire contract, never translated.
export function buildStudentCsvTemplate(): string {
  return `${STUDENT_IMPORT_HEADER_ROW}\n`;
}

export function downloadStudentCsvTemplate(): void {
  saveCsvDownload(buildStudentCsvTemplate(), STUDENT_IMPORT_TEMPLATE_FILENAME);
}
