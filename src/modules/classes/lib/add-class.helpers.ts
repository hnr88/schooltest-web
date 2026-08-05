import type { StudentWriteBody } from '@/modules/school-students';
import type { ParsedStudentRow } from '@/modules/student-import';

// One parsed CSV row -> the C-CHD-02 create body, keyed exactly like the write
// endpoint's strict allowlist. Blank optional cells arrive as null and are
// omitted entirely, because an absent key is the server's "leave unset" while
// an explicit null is a write. The class is the one created in the same submit.
export function toStudentCreateBody(
  row: ParsedStudentRow,
  classDocumentId: string,
): StudentWriteBody {
  const body: StudentWriteBody = {
    given_name: row.given_name,
    class_documentId: classDocumentId,
  };
  if (row.family_name !== null) body.family_name = row.family_name;
  if (row.email !== null) body.email = row.email;
  if (row.first_language !== null) body.first_language = row.first_language;
  if (row.acara_phase !== null) body.acara_phase = row.acara_phase;
  return body;
}
