import type { z } from 'zod';

import type {
  teacherExportDocumentSchema,
  teacherExportHeadersSchema,
  teacherExportKindSchema,
} from '@/modules/teacher/schemas/teacher-export.schema';

export type TeacherExportKind = z.infer<typeof teacherExportKindSchema>;
export type TeacherExportDocument = z.infer<typeof teacherExportDocumentSchema>;
export type TeacherExportHeaders = z.infer<typeof teacherExportHeadersSchema>;

// The three C-TR-5/6/7 routes as ONE discriminated request. Client-side only —
// it is not a wire shape, so it uses the portal's camelCase convention. The
// `student` member carries the extra id the third route needs, which is why the
// union is discriminated rather than a kind + optional field: a `student`
// export cannot be issued without a student.
export type TeacherExportRequest =
  | { kind: 'insights'; classDocumentId: string }
  | { kind: 'progress'; classDocumentId: string }
  | { kind: 'student'; classDocumentId: string; studentDocumentId: string };

/** The downloaded document plus the server-chosen filename, both parsed. */
export interface TeacherExportFile {
  filename: string;
  body: string;
}
