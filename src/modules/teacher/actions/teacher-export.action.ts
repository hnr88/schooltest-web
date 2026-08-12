'use server';

import { strapi } from '@/lib/axios/strapi';
import {
  parseTeacherExportFilename,
  teacherExportPath,
} from '@/modules/teacher/lib/teacher-export';
import { teacherExportInputSchema } from '@/modules/teacher/schemas/teacher-export-request.schema';
import {
  teacherExportDocumentSchema,
  teacherExportHeadersSchema,
} from '@/modules/teacher/schemas/teacher-export.schema';
import type { TeacherExportFile } from '@/modules/teacher/types/teacher-export.types';

// C-TR-5/6/7 transport. This runs on the NEXT SERVER, and that placement is a
// MEASURED requirement, not a preference: `schooltest-api`'s `strapi::cors` sets no
// `expose`, so the export response reaches cross-origin browser JS with only the
// safelisted headers. Probed in real Chromium against the running Strapi:
// `response.headers.keys()` = ['content-length','content-type'] and
// `get('content-disposition')` === null. The contract's filename therefore CANNOT
// be read in the browser, and inventing one client-side would hide a transport
// regression behind a silently renamed file. Read server-side, both pinned headers
// are present and the strict parse below actually runs.
//
// This function TRANSPORTS; it does not compose. The Markdown, the `S01…`
// de-identification, the `## Prompt` section and the filename are all the server's
// own bytes, handed back verbatim. A 403/404 from Strapi (foreign class, unknown
// class/student, progress export with no Test B) throws here and surfaces as the
// button's error state — never as an empty or partial document.
export async function downloadTeacherExport(input: unknown): Promise<TeacherExportFile> {
  const { token, request } = teacherExportInputSchema.parse(input);

  const response = await strapi.get<string>(teacherExportPath(request), {
    responseType: 'text',
    headers: { Authorization: `Bearer ${token}` },
  });

  const headers = teacherExportHeadersSchema.parse({
    'content-type': response.headers['content-type'],
    'content-disposition': response.headers['content-disposition'],
  });

  return {
    filename: parseTeacherExportFilename(headers['content-disposition']),
    body: teacherExportDocumentSchema.parse(response.data),
  };
}
