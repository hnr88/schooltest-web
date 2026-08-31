'use client';

import { useState } from 'react';

import { saveTeacherExportFile } from '@/modules/teacher/lib/teacher-export-download';
import { extractTeacherExportPrompt } from '@/modules/teacher/lib/teacher-overlays';
import { useTeacherExportMutation } from '@/modules/teacher/queries/use-teacher-export.mutation';

import type {
  TeacherExportActionError,
  TeacherExportPreview,
  TeacherExportRequest,
} from '@/modules/teacher/types/teacher-export.types';

export function useTeacherExportPreview(request: TeacherExportRequest): TeacherExportPreview {
  const mutation = useTeacherExportMutation();
  const [file, setFile] = useState<TeacherExportPreview['file']>(null);
  const [actionError, setActionError] = useState<TeacherExportActionError | null>(null);
  const prompt = file ? extractTeacherExportPrompt(file.body) : null;

  const close = () => {
    setFile(null);
    setActionError(null);
  };

  const copyPromptAndDownload = async () => {
    if (!file || !prompt) return 'download_failed' as const;
    if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function') {
      setActionError('copy');
      return 'copy_failed' as const;
    }
    try {
      await navigator.clipboard.writeText(prompt);
    } catch {
      setActionError('copy');
      return 'copy_failed' as const;
    }
    try {
      saveTeacherExportFile(file);
    } catch {
      setActionError('download');
      return 'download_failed' as const;
    }
    close();
    return 'success' as const;
  };

  return {
    start: () => {
      setActionError(null);
      mutation.mutate(request, { onSuccess: setFile });
    },
    close,
    copyPromptAndDownload,
    file,
    prompt,
    actionError,
    isPending: mutation.isPending,
    isError: mutation.isError,
  };
}
