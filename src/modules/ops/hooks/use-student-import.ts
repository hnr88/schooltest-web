'use client';

import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import { type OpsImportCommit } from '@schooltest/ops-contracts';

import { restFailureOf } from '@/lib/axios/strapi';
import { showOpsToast, useOpsWriteGate } from '@/modules/ops/actions';
import { downloadImportErrorReport } from '@/modules/ops/lib/import-error-report';
import { usePortalImportCommitMutation } from '@/modules/ops/queries/use-import-commit.mutation';
import {
  useImportCancelMutation,
  useImportUndoMutation,
} from '@/modules/ops/queries/use-import-lifecycle.mutation';
import { usePortalImportPreviewMutation } from '@/modules/ops/queries/use-import-preview.mutation';
import { useImportReceiptQuery } from '@/modules/ops/queries/use-import-receipt.query';
import type { PortalImportPreview } from '@/modules/ops/schemas/import.schema';
import type {
  ImportCardState,
  StudentImportApi,
  UseStudentImportOptions,
} from '@/modules/ops/types/import.types';

/** The contract's own ceiling, checked in the browser AND again on the server. */
const MAX_BYTES = 5 * 1024 * 1024;

const CSV_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];

/** A .csv name or a csv media type. The server re-checks the actual bytes. */
function looksLikeCsv(file: File): boolean {
  return file.name.toLowerCase().endsWith('.csv') || CSV_TYPES.includes(file.type);
}

/**
 * The import modal's state, and the ten cards the HTML draws.
 *
 * The card is DERIVED, never assigned: every state is a function of what the
 * server last said plus which request is in flight, so no code path can put the
 * modal into a state the data does not support.
 */
export function useStudentImport(
  schoolDocumentId: string,
  options?: UseStudentImportOptions,
): StudentImportApi {
  const t = useTranslations('Ops.import');
  const writeGate = useOpsWriteGate();
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  // ops/26 — the class page's "Add students"/"Import students" pre-selects its
  // own class; the Students tab's entry point opens with none chosen.
  const [classDocumentId, setClassDocumentId] = useState<string | null>(
    options?.initialClassDocumentId ?? null,
  );
  const [preview, setPreview] = useState<PortalImportPreview | null>(null);
  const [result, setResult] = useState<OpsImportCommit | null>(null);
  const [requestKey, setRequestKey] = useState<string | null>(null);
  const [localReject, setLocalReject] = useState<'badType' | 'tooBig' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unresolved, setUnresolved] = useState(false);

  const previewMutation = usePortalImportPreviewMutation();
  const commitMutation = usePortalImportCommitMutation();
  const cancelMutation = useImportCancelMutation();
  const undoMutation = useImportUndoMutation();

  // Polled only while a commit is actually in flight. Once it settles the
  // receipt is read once more, so the numbers on screen are the stored ones.
  const receipt = useImportReceiptQuery(schoolDocumentId, requestKey, commitMutation.isPending);

  /** Anything that changes WHAT would be imported invalidates the preview. */
  const invalidate = () => {
    setPreview(null);
    setResult(null);
    setErrorMessage(null);
    setUnresolved(false);
    setRequestKey(null);
  };

  const onCsvChange = (value: string) => {
    setCsv(value);
    setFileName(null);
    setLocalReject(null);
    invalidate();
  };

  const onClassChange = (value: string | null) => {
    setClassDocumentId(value);
    invalidate();
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    invalidate();
    setFileName(file.name);
    if (!looksLikeCsv(file)) {
      setLocalReject('badType');
      setCsv('');
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalReject('tooBig');
      setCsv('');
      return;
    }
    setLocalReject(null);
    setCsv(await file.text());
  };

  /** ops/26 (`:1702` `changeFile`) — back to `idle`, the class picker untouched. */
  const changeFile = () => {
    setFileName(null);
    setCsv('');
    setLocalReject(null);
    invalidate();
  };

  const handleFailure = (error: unknown) => {
    const failure = restFailureOf(error);
    if (failure?.kind === 'transport') {
      // No status came back. That proves nothing either way, so the modal goes
      // to reconciliation instead of claiming the import did or did not run.
      setUnresolved(true);
      setErrorMessage(t('unresolved'));
      return;
    }
    if (isAxiosError(error) && error.response?.status === 413) {
      setLocalReject('tooBig');
      return;
    }
    setErrorMessage(
      (failure && 'envelope' in failure ? failure.envelope?.error.message : null) ??
        t('errorToast'),
    );
  };

  const runPreview = async () => {
    if (classDocumentId === null || csv.trim() === '') return;
    setErrorMessage(null);
    try {
      setPreview(
        await previewMutation.mutateAsync({ schoolDocumentId, csv, classDocumentId }),
      );
    } catch (error) {
      handleFailure(error);
    }
  };

  // `runPreview` is a new function every render; a ref keeps the effect below
  // off the exhaustive-deps list without freezing a stale closure over it. The
  // write happens in its own effect (never during render — the compiler
  // forbids that) so it is always current by the time the next effect reads it.
  const runPreviewRef = useRef(runPreview);
  useEffect(() => {
    runPreviewRef.current = runPreview;
  });

  // ops/26 (`:1220-1225`) — the design validates the moment a file lands, with
  // no separate "Preview" click. A real preview needs the destination class
  // too (duplicates are judged per class), so this fires once both are set;
  // `preview !== null` in the guard stops it firing again on its own result.
  useEffect(() => {
    if (csv.trim() === '' || classDocumentId === null) return;
    if (localReject !== null || preview !== null || previewMutation.isPending) return;
    void runPreviewRef.current();
  }, [csv, classDocumentId, localReject, preview, previewMutation.isPending]);

  /** Shared by the persistent Undo button and the clean-outcome toast action. */
  const performUndo = async (importDocumentId: string) => {
    try {
      await undoMutation.mutateAsync({ schoolDocumentId, importDocumentId });
      setResult(null);
      showOpsToast({ tone: 'ok', message: t('undoneToast') });
    } catch (error) {
      handleFailure(error);
    }
  };

  const downloadErrorReport = async () => {
    if (classDocumentId === null) return;
    try {
      await downloadImportErrorReport(schoolDocumentId, csv, classDocumentId);
    } catch (error) {
      handleFailure(error);
    }
  };

  const runCommit = async () => {
    if (classDocumentId === null || preview === null) return;
    const key = crypto.randomUUID();
    setRequestKey(key);
    setErrorMessage(null);
    try {
      const committed = await commitMutation.mutateAsync({
        schoolDocumentId,
        csv,
        classDocumentId,
        requestKey: key,
      });
      setResult(committed);
      setPreview(null);
      const message = t('committedToast', { created: committed.created, skipped: committed.skipped });
      // ops/26 (`:1244-1252`) — three outcomes, three tones: a clean import is
      // 'ok' with Undo; row errors and dupes are both 'warn', but only the
      // row-errors toast carries an action (the design draws no action on the
      // dupes toast, `:1246`).
      if (committed.rejected.length > 0) {
        showOpsToast({
          tone: 'warn',
          message,
          action: { label: t('errorReportButton'), run: () => void downloadErrorReport() },
        });
      } else if (committed.skipped > 0) {
        showOpsToast({ tone: 'warn', message });
      } else {
        showOpsToast({
          tone: 'ok',
          message,
          action: { label: t('undoButton'), run: () => void performUndo(committed.import_documentId) },
        });
      }
    } catch (error) {
      handleFailure(error);
    }
  };

  /** Cancel reports the server's race outcome; it never asserts one itself. */
  const runCancel = async () => {
    if (requestKey === null) return;
    try {
      const outcome = await cancelMutation.mutateAsync({ schoolDocumentId, requestKey });
      if (outcome.state === 'completed' && outcome.result) {
        setResult(outcome.result);
        toast.info(t('cancelLostToast'));
        return;
      }
      setResult(null);
      setUnresolved(false);
      showOpsToast({ tone: 'ok', message: t('cancelledToast') });
    } catch (error) {
      handleFailure(error);
    }
  };

  const runUndo = async () => {
    if (!result) return;
    await performUndo(result.import_documentId);
  };

  const card: ImportCardState = useMemo(() => {
    if (localReject !== null) return localReject;
    if (commitMutation.isPending) return 'uploading';
    if (unresolved) return 'failed';
    if (previewMutation.isPending) return 'validating';
    if (errorMessage !== null && preview === null && result === null) return 'failed';
    if (preview === null) return 'idle';
    if (preview.create.length === 0 && preview.skip_existing.length === 0) {
      return preview.reject.length === 0 ? 'noRows' : 'rowErrors';
    }
    if (preview.reject.length > 0) return 'rowErrors';
    if (preview.skip_existing.length > 0) return 'dupes';
    return 'ready';
  }, [
    localReject,
    commitMutation.isPending,
    previewMutation.isPending,
    unresolved,
    errorMessage,
    preview,
    result,
  ]);

  const undoState = useMemo(() => {
    const data = receipt.data;
    if (!result) return { available: false, reason: null };
    if (!data) return { available: false, reason: t('undoUnknown') };
    if (data.undo_available) return { available: true, reason: null };
    return { available: false, reason: data.state === 'undone' ? t('undoDone') : t('undoExpired') };
  }, [receipt.data, result, t]);

  // ops/26 (`:1690` `impCtaLabel`) — real counts, not the demo's fixed ones.
  const ctaLabel = useMemo(() => {
    const created = preview?.create.length ?? 0;
    switch (card) {
      case 'ready':
        return t('ctaLabelReady', { count: created });
      case 'rowErrors':
        return t('ctaLabelRowErrors', { count: created });
      case 'dupes':
        return t('ctaLabelDupes', { count: created });
      case 'failed':
        return t('ctaLabelFailed');
      case 'validating':
        return t('ctaLabelValidating');
      default:
        return t('ctaLabelDefault');
    }
  }, [card, preview, t]);

  // ops/26 (`:1699`) — opacity 0.55 on these five, or whenever the write gate
  // itself refuses (`ops_support`, offline).
  const softDisabledStates: readonly ImportCardState[] = [
    'idle',
    'validating',
    'badType',
    'tooBig',
    'noRows',
  ];
  const ctaDisabled = softDisabledStates.includes(card) || writeGate.blockedReason() !== null;

  /**
   * ops/26 (`:1226-1240` `runImport`) — the four guards, each a form-level
   * message with NO request sent, in the design's own order; then the write
   * gate; then commit (or, from `failed`, retry preview or commit — whichever
   * never got a result).
   */
  const runCta = async () => {
    if (card === 'uploading') return;
    if (fileName === null) {
      setErrorMessage(t('guardNoFile'));
      return;
    }
    if (card === 'validating') {
      setErrorMessage(t('guardStillValidating'));
      return;
    }
    if (card === 'badType' || card === 'tooBig' || card === 'noRows') {
      setErrorMessage(t('guardCannotImport'));
      return;
    }
    const blocked = writeGate.blockedReason();
    if (blocked !== null) {
      showOpsToast({
        tone: 'error',
        message: blocked,
        ...(writeGate.retryWhenBlocked
          ? { action: { label: writeGate.retryLabel, run: () => void runCta() } }
          : {}),
      });
      return;
    }
    if (card === 'failed') {
      // A dropped connection leaves the real outcome unknown — the reconcile
      // banner already tells the operator to refresh before trying again, so
      // the CTA must not fire a second write blind on top of an unresolved one.
      if (unresolved) return;
      await (preview !== null ? runCommit() : runPreview());
      return;
    }
    await runCommit();
  };

  return {
    csv,
    fileName,
    classDocumentId,
    preview,
    result,
    card,
    errorMessage,
    unresolved,
    // REAL progress: processed/total from the receipt row, or null. There is no
    // timer and no fallback, so the bar is indeterminate until the server has
    // numbers of its own to report.
    progress:
      receipt.data && receipt.data.total_rows > 0
        ? Math.round((receipt.data.processed_rows / receipt.data.total_rows) * 100)
        : null,
    receiptState: receipt.data?.state ?? null,
    undoAvailable: undoState.available,
    undoUnavailableReason: undoState.reason,
    canCommit: preview !== null && preview.create.length > 0 && classDocumentId !== null,
    previewing: previewMutation.isPending,
    committing: commitMutation.isPending,
    cancelling: cancelMutation.isPending,
    undoing: undoMutation.isPending,
    ctaLabel,
    ctaDisabled,
    // `:1247` "closeModal refuses while busy" — a commit in flight is the only
    // case that would abandon a job silently if the modal closed under it.
    busy: commitMutation.isPending,
    onCsvChange,
    onClassChange,
    onFile,
    changeFile,
    runPreview,
    runCommit,
    runCta,
    runCancel,
    runUndo,
    downloadErrorReport,
  };
}
