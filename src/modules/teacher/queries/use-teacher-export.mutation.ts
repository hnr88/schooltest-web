'use client';

import { useMutation } from '@tanstack/react-query';

import { strapi } from '@/lib/axios/strapi';
import {
  parseTeacherExportFilename,
  teacherExportPath,
} from '@/modules/teacher/lib/teacher-export';
import {
  teacherExportDocumentSchema,
  teacherExportHeadersSchema,
} from '@/modules/teacher/schemas/teacher-export.schema';
import type {
  TeacherExportFile,
  TeacherExportRequest,
} from '@/modules/teacher/types/teacher-export.types';

// C-TR-5/6/7: the three export routes answer `text/markdown`, not JSON, so
// `responseType: 'text'` stops Axios' default JSON pass. Transport AND body are
// parsed: a wrong content type, a non-.md attachment or a document missing its
// trailing `## Prompt` section throws instead of handing a teacher a broken
// file. De-identification is server-side and is not re-done here.
//
// A useMutation (not useQuery): an export is an imperative act with a
// side effect the user triggers, and it must never be cached or refetched.
async function fetchTeacherExport(request: TeacherExportRequest): Promise<TeacherExportFile> {
  const response = await strapi.get(teacherExportPath(request), { responseType: 'text' });
  const headers = teacherExportHeadersSchema.parse({
    'content-type': response.headers['content-type'],
    'content-disposition': response.headers['content-disposition'],
  });
  return {
    filename: parseTeacherExportFilename(headers['content-disposition']),
    body: teacherExportDocumentSchema.parse(response.data),
  };
}

export function useTeacherExportMutation() {
  return useMutation({ mutationFn: fetchTeacherExport });
}
