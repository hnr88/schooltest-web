'use server';

import { strapi } from '@/lib/axios/strapi';
import {
  classifyTeacherExportFailure,
  parseTeacherExportFilename,
  teacherExportPath,
} from '@/modules/teacher/lib/teacher-export';
import { teacherExportInputSchema } from '@/modules/teacher/schemas/teacher-export-request.schema';
import {
  teacherExportDocumentSchema,
  teacherExportHeadersSchema,
} from '@/modules/teacher/schemas/teacher-export.schema';
import type { TeacherExportOutcome } from '@/modules/teacher/types/teacher-export.types';

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
// own bytes, handed back verbatim. A refusal from Strapi (400 withheld at
// de-identification, 403/404 foreign or unknown class/student, progress export
// with no Test B) or a broken transport comes back as `{ ok: false, failure }`
// rather than a throw: a throw here reaches the browser as an opaque 500 and the
// teacher could only be told "try again". The caller surfaces it as the button's
// error state — never as an empty or partial document.
export async function downloadTeacherExport(input: unknown): Promise<TeacherExportOutcome> {
  const { token, request } = teacherExportInputSchema.parse(input);

  try {
    const response = await strapi.get<string>(teacherExportPath(request), {
      responseType: 'text',
      headers: { Authorization: `Bearer ${token}` },
    });

    const headers = teacherExportHeadersSchema.parse({
      'content-type': response.headers['content-type'],
      'content-disposition': response.headers['content-disposition'],
    });

    return {
      ok: true,
      file: {
        filename: parseTeacherExportFilename(headers['content-disposition']),
        body: teacherExportDocumentSchema.parse(response.data),
      },
    };
  } catch (error) {
    return { ok: false, failure: classifyTeacherExportFailure(error) };
  }
}
