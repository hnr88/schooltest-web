'use client';

import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useImportCommitMutation } from '@/modules/ops/queries/use-import-commit.mutation';
import { useImportPreviewMutation } from '@/modules/ops/queries/use-import-preview.mutation';
import type {
  ImportCommitResult,
  ImportPreview,
} from '@/modules/ops/schemas/import.schema';

// State and mutation wiring for OpsStudentImport (task 67, C-IMP-01/02): the
// csv text (pasted or read from the picked file), the preview round trip, then
// the commit of the SAME csv. Editing the text after a preview clears that
// preview, so a commit always reflects what is in the box right now - and the
// server re-validates it from scratch regardless.
export function useStudentImport(schoolDocumentId: string) {
  const t = useTranslations('Ops.import');
  const [csv, setCsv] = useState('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportCommitResult | null>(null);
  // Task 026: the drop zone's real statuses. `fileName` is the loaded file's
  // own name (null for pasted text); `errorKind` discriminates the inline
  // error the panel renders alongside the existing toasts — 'forbidden' is the
  // 403 the API answers for a wrong role, 'error' anything else.
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<'forbidden' | 'error' | null>(null);
  const previewMutation = useImportPreviewMutation();
  const commitMutation = useImportCommitMutation();

  const handleError = (error: unknown) => {
    if (isAxiosError(error) && error.response?.status === 403) {
      setErrorKind('forbidden');
      toast.error(t('forbiddenToast'));
      return;
    }
    setErrorKind('error');
    toast.error(t('errorToast'));
  };

  const onCsvChange = (value: string) => {
    setCsv(value);
    setPreview(null);
    setResult(null);
    setErrorKind(null);
    setFileName(null);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    setPreview(null);
    setResult(null);
    setErrorKind(null);
    setFileName(file.name);
  };

  const runPreview = async () => {
    try {
      setResult(null);
      setErrorKind(null);
      setPreview(await previewMutation.mutateAsync({ schoolDocumentId, csv }));
    } catch (error) {
      handleError(error);
    }
  };

  const runCommit = async () => {
    try {
      const committed = await commitMutation.mutateAsync({ schoolDocumentId, csv });
      setResult(committed);
      setPreview(null);
      toast.success(
        t('committedToast', { created: committed.created, skipped: committed.skipped }),
      );
    } catch (error) {
      handleError(error);
    }
  };

  return {
    csv,
    preview,
    result,
    fileName,
    errorKind,
    onCsvChange,
    onFile,
    runPreview,
    runCommit,
    previewing: previewMutation.isPending,
    committing: commitMutation.isPending,
  };
}
