'use client';

import { useMutation } from '@tanstack/react-query';

import { readClientToken } from '@/lib/axios/strapi';
import { downloadTeacherExport } from '@/modules/teacher/actions/teacher-export.action';
import type {
  TeacherExportFile,
  TeacherExportRequest,
} from '@/modules/teacher/types/teacher-export.types';

// C-TR-5/6/7: the three export routes answer `text/markdown`, not JSON, and their
// filename lives in `Content-Disposition` — a header Strapi's CORS config does not
// expose, so cross-origin browser JS reads it as `null` (measured in Chromium).
// The request therefore goes through `downloadTeacherExport`, which performs the
// SAME typed-client GET from the Next server, where the header is readable, and
// parses transport AND body strictly: a wrong content type, a non-.md attachment or
// a document missing its trailing `## Prompt` section throws instead of handing a
// teacher a broken file. De-identification is server-side and is not re-done here.
//
// A useMutation (not useQuery): an export is an imperative act the user triggers,
// and it must never be cached, refetched or replayed on focus.
async function fetchTeacherExport(request: TeacherExportRequest): Promise<TeacherExportFile> {
  const token = readClientToken();
  if (!token) throw new Error('teacher export requires a signed-in teacher token');
  return downloadTeacherExport({ token, request });
}

export function useTeacherExportMutation() {
  return useMutation({ mutationFn: fetchTeacherExport });
}
