import type { z } from 'zod';

import type {
  teacherExportInputSchema,
  teacherExportRequestSchema,
} from '@/modules/teacher/schemas/teacher-export-request.schema';
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
// export cannot be issued without a student. Inferred from the schema that
// validates it, so the runtime guard and the compile-time shape cannot diverge.
export type TeacherExportRequest = z.infer<typeof teacherExportRequestSchema>;
export type TeacherExportInput = z.infer<typeof teacherExportInputSchema>;

/** The downloaded document plus the server-chosen filename, both parsed. */
export interface TeacherExportFile {
  filename: string;
  body: string;
}

export type TeacherExportActionError = 'copy' | 'download';
export type TeacherExportActionResult = 'success' | `${TeacherExportActionError}_failed`;

/** What the shared preview hook hands the export trigger and modal. */
export interface TeacherExportPreview {
  start: () => void;
  close: () => void;
  copyPromptAndDownload: () => Promise<TeacherExportActionResult>;
  file: TeacherExportFile | null;
  prompt: string | null;
  actionError: TeacherExportActionError | null;
  isPending: boolean;
  isError: boolean;
}

/** Legacy immediate-download hook shape, retained for internal compatibility. */
export interface TeacherExportDownload {
  start: () => void;
  isPending: boolean;
  isError: boolean;
}

export interface TeacherExportButtonProps {
  request: TeacherExportRequest;
  label: string;
  variant?: 'default' | 'outline';
}

export interface TeacherExportPreviewDialogProps {
  file: TeacherExportFile | null;
  prompt: string | null;
  actionError: TeacherExportActionError | null;
  onClose: () => void;
  onCopyPromptAndDownload: () => void;
}

/** The class-tab export panel (Teaching insights / Progress). */
export interface TeacherExportPanelProps {
  request: TeacherExportRequest;
  headingId: string;
  title: string;
  description: string;
  buttonLabel: string;
  footnote: string;
}
