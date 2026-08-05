import type { StudentWriteBody } from '@/modules/school-students/types/school-students.types';
import type { ParsedStudentRow } from '@/modules/student-import';

// One accepted CSV row -> one C-CHD-02 create body. The parser already keys its
// rows like the contract, so this only drops the nulls (the server reads an
// omitted optional as "not set") and pins the class the admin picked. The
// school comes from the session server-side, never from the body.
export function buildImportStudentBody(
  row: ParsedStudentRow,
  classDocumentId: string,
): StudentWriteBody {
  const body: StudentWriteBody = {
    given_name: row.given_name,
    class_documentId: classDocumentId,
  };
  if (row.family_name !== null) {
    body.family_name = row.family_name;
  }
  if (row.email !== null) {
    body.email = row.email;
  }
  if (row.first_language !== null) {
    body.first_language = row.first_language;
  }
  if (row.acara_phase !== null) {
    body.acara_phase = row.acara_phase;
  }
  return body;
}
