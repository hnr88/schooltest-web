'use client';

import type { OpsImportReject } from '@schooltest/ops-contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { showOpsToast } from '@/modules/ops/actions';
import {
  buildConsentAttestation,
  classifyConsentError,
  CONSENT_CONFIG_QUERY_KEY,
  EMPTY_ATTESTATION_SELECTION,
  isAttestationMissing,
  useConsentAttestationOptions,
} from '@/modules/privacy-consent';
import type { ConsentAttestationSelection } from '@/modules/privacy-consent';
import { classifyImportFailure, type ImportFailureKind } from '@/modules/student-import/lib/classify-import-failure';
import { useImportStudentsMutation } from '@/modules/student-import/queries/use-import-students.mutation';
import type {
  ParsedStudentCsv,
  StudentImportAttestationState,
} from '@/modules/student-import/types/student-import.types';

const EMPTY_PARSED: ParsedStudentCsv = { rows: [], errors: [] };

/** Failure kind -> the toast key both host namespaces ship under the same name. */
const FAILURE_TOAST_KEY: Record<Exclude<ImportFailureKind, 'server'>, string> = {
  seatCap: 'seatCapToast',
  schoolInactive: 'schoolInactiveToast',
  forbidden: 'forbiddenToast',
  tooBig: 'tooBigToast',
  noRows: 'noRowsToast',
  generic: 'genericToast',
};

export interface UseStudentImportFlowOptions {
  /**
   * The next-intl namespace carrying the import copy. The Students page and
   * the class detail ship the SAME key names under different prefixes, so the
   * shared flow stays host-agnostic while every toast stays translated.
   */
  messageNamespace: string;
  /** The class detail fixes its destination class; the Students picker omits this. */
  initialClassDocumentId?: string;
  /** The host's roster reads, invalidated after a REAL commit so the list refreshes. */
  invalidateQueryKeys?: readonly (readonly unknown[])[];
  onDone: () => void;
}

export interface StudentImportFlowState {
  parsed: ParsedStudentCsv;
  setParsed: (parsed: ParsedStudentCsv, csv: string) => void;
  /** The destination class — '' until the host picker chooses one. */
  classId: string;
  setClassId: (documentId: string) => void;
  /** The rows the SERVER refused on the last submit, each with its row number. */
  rejects: readonly OpsImportReject[];
  canSubmit: boolean;
  pending: boolean;
  submit: () => Promise<void>;
  /**
   * W4-21: the school's guardian-consent attestation (unticked boxes, shown only
   * while consent records are ON). Optional so a host that builds its own state
   * object is unaffected; this hook always provides it.
   */
  attestation?: StudentImportAttestationState;
}

/**
 * THE one student-import flow behind every school-admin import surface
 * (Students page, class detail): parse locally, one preview, one
 * idempotent commit, receipts reconciling a lost connection — and EVERY
 * refusal mapped to its own message through `classifyImportFailure`, so a
 * seat cap says "no seats" and a headerless file says "no rows", never a
 * generic "try again". A file with SOME refused rows imports the good ones
 * and keeps the dialog open with the refused lines named per row.
 */
export function useStudentImportFlow({
  messageNamespace,
  initialClassDocumentId = '',
  invalidateQueryKeys,
  onDone,
}: UseStudentImportFlowOptions): StudentImportFlowState {
  const t = useTranslations(messageNamespace);
  const tConsent = useTranslations('PrivacyConsent');
  const queryClient = useQueryClient();
  const [parsed, setParsedState] = useState<ParsedStudentCsv>(EMPTY_PARSED);
  const [csv, setCsvState] = useState('');
  const [classId, setClassId] = useState(initialClassDocumentId);
  const [rejects, setRejects] = useState<readonly OpsImportReject[]>([]);
  const importStudents = useImportStudentsMutation();
  const attestationOptions = useConsentAttestationOptions();
  const [attestationSelection, setAttestationSelection] = useState<ConsentAttestationSelection>(
    EMPTY_ATTESTATION_SELECTION,
  );
  const attestationMissing = isAttestationMissing(attestationOptions, attestationSelection);

  const setParsed = (next: ParsedStudentCsv, text: string) => {
    setParsedState(next);
    setCsvState(text);
    // A new file invalidates the previous run's report.
    setRejects([]);
  };

  // With guardian consent required and data collection unticked the import is held,
  // exactly as the API would refuse it (409), so nothing is created without it.
  const canSubmit =
    classId !== '' && parsed.rows.length > 0 && !importStudents.isPending && !attestationMissing;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    let result;
    try {
      const consentAttestation = buildConsentAttestation(attestationOptions, attestationSelection);
      result = await importStudents.mutateAsync({
        csv,
        classDocumentId: classId,
        ...(consentAttestation === undefined ? {} : { consentAttestation }),
      });
    } catch (error) {
      // 409 GUARDIAN_CONSENT_REQUIRED / CONSENT_RECORDS_DISABLED: the switches the
      // dialog loaded are stale. Say so in the school's words and re-read them.
      const consentKind = classifyConsentError(error);
      if (consentKind === 'guardianRequired' || consentKind === 'disabled') {
        void queryClient.invalidateQueries({ queryKey: CONSENT_CONFIG_QUERY_KEY });
        showOpsToast({ tone: 'error', message: tConsent(`attestation.refusal.${consentKind}`) });
        return;
      }
      const failure = classifyImportFailure(error);
      if (failure.kind === 'server') {
        showOpsToast({ tone: 'error', message: failure.serverMessage ?? '' });
        return;
      }
      showOpsToast({ tone: 'error', message: t(FAILURE_TOAST_KEY[failure.kind]) });
      return;
    }
    if (result.kind === 'rejected') {
      setRejects(result.rejected);
      showOpsToast({
        tone: 'error',
        message: t('rejectedToast', { count: result.rejected.length }),
      });
      return;
    }
    for (const queryKey of invalidateQueryKeys ?? []) {
      void queryClient.invalidateQueries({ queryKey });
    }
    if (result.rejected.length > 0) {
      // Partial: the good rows are already enrolled. The dialog stays open so
      // the refused lines can be read and fixed, not guessed at.
      setRejects(result.rejected);
      showOpsToast({
        tone: 'warn',
        message: t('partialToast', {
          created: result.created,
          total: result.created + result.skipped + result.rejected.length,
        }),
      });
      return;
    }
    if (result.created === 0) {
      showOpsToast({ tone: 'warn', message: t('alreadyImportedToast') });
    } else if (result.skipped > 0) {
      showOpsToast({
        tone: 'ok',
        message: t('successSkippedToast', { created: result.created, skipped: result.skipped }),
      });
    } else {
      showOpsToast({ tone: 'ok', message: t('successToast', { count: result.created }) });
    }
    onDone();
  };

  return {
    parsed,
    setParsed,
    classId,
    setClassId,
    rejects,
    canSubmit,
    pending: importStudents.isPending,
    submit,
    attestation: {
      options: attestationOptions,
      selection: attestationSelection,
      onChange: setAttestationSelection,
      missing: attestationMissing,
    },
  };
}
