'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { showOpsToast } from '@/modules/ops/actions';
import { classifyEraseError } from '@/modules/privacy-consent/lib/classify-erase-error';
import {
  buildEraseBody,
  isEraseRequestReady,
  localDateString,
} from '@/modules/privacy-consent/lib/erase-request';
import { useEraseStudentMutation } from '@/modules/privacy-consent/queries/use-erase-student.mutation';
import { ERASE_REFERENCE_MAX } from '@/modules/privacy-consent/schemas/consent.schema';
import type { EraseRequestValues } from '@/modules/privacy-consent/types/consent.types';

interface UseEraseStudentFormOptions {
  studentDocumentId: string;
  givenName: string;
  onDone: () => void;
}

// The erase dialog's state: what the administrator typed, whether the request may be
// sent, the one write and the message for a refusal. The confirm stays unavailable
// until the typed name matches and a reference is entered.
export function useEraseStudentForm({ studentDocumentId, givenName, onDone }: UseEraseStudentFormOptions) {
  const t = useTranslations('PrivacyConsent.erase');
  const erase = useEraseStudentMutation();
  const [today] = useState(() => localDateString(new Date()));
  const [values, setValues] = useState<EraseRequestValues>({
    typedName: '',
    channel: 'school_initiated',
    reference: '',
    receivedOn: today,
  });

  const ready = isEraseRequestReady(values, givenName, today, ERASE_REFERENCE_MAX);

  const setValue = <K extends keyof EraseRequestValues>(key: K, value: EraseRequestValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (erase.isError) {
      erase.reset();
    }
  };

  const submit = () => {
    if (!ready || erase.isPending) {
      return;
    }
    erase.mutate(
      { documentId: studentDocumentId, body: buildEraseBody(values) },
      {
        onSuccess: (result) => {
          showOpsToast({
            tone: result.erased ? 'ok' : 'warn',
            message: t(result.erased ? 'successToast' : 'alreadyErasedToast'),
          });
          onDone();
        },
      },
    );
  };

  return {
    values,
    setValue,
    today,
    ready,
    pending: erase.isPending,
    error: erase.isError ? t(`error.${classifyEraseError(erase.error)}`) : null,
    submit,
  };
}
