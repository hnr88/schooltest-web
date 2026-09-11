import { TEACHER_EXPORT_CONTENT_TYPE } from '@/modules/teacher/schemas/teacher-export.schema';
import type { TeacherExportFile } from '@/modules/teacher/types/teacher-export.types';

/**
 * Hands the SERVER's bytes to the browser's own download machinery, under the
 * SERVER's filename and the contract's media type. Nothing about the document is
 * assembled, reformatted or re-identified on the way through: `file.body` is
 * written to the Blob exactly as C-TR-5/6/7 sent it.
 *
 * The object URL is revoked on the next macrotask rather than immediately after
 * `click()` — Chromium starts the download synchronously, but revoking inside the
 * same tick can race the save on other engines.
 */
export function saveTeacherExportFile(file: TeacherExportFile): void {
  saveTextFile(file.body, file.filename, TEACHER_EXPORT_CONTENT_TYPE);
}

/** The same download path for a document the portal built itself (the Reports modal's CSV). */
export function saveTextFile(body: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
