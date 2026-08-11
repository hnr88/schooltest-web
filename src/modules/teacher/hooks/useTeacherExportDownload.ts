'use client';

import { saveTeacherExportFile } from '@/modules/teacher/lib/teacher-export-download';
import { useTeacherExportMutation } from '@/modules/teacher/queries/use-teacher-export.mutation';
import type {
  TeacherExportDownload,
  TeacherExportRequest,
} from '@/modules/teacher/types/teacher-export.types';

/**
 * The ONE download hook behind all three C-TR-5/6/7 buttons (Teaching insights,
 * Progress, student drill-down). Each button differs only by the `request` it
 * passes, so there is a single transport, a single strict transport parse and a
 * single save path — no per-surface duplicate that could drift.
 *
 * Saving happens in `onSuccess`, so a failed or refused export (403 foreign class,
 * 404 unknown class/student or a progress export with no Test B) writes NO file and
 * leaves `isError` true for the button to surface.
 */
export function useTeacherExportDownload(request: TeacherExportRequest): TeacherExportDownload {
  const mutation = useTeacherExportMutation();

  return {
    start: () => mutation.mutate(request, { onSuccess: saveTeacherExportFile }),
    isPending: mutation.isPending,
    isError: mutation.isError,
  };
}
