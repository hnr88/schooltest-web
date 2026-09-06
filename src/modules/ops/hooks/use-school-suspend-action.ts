'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { SCHOOL_SUSPEND_CODES, formatResourceVersion } from '@schooltest/ops-contracts';

import { restFailureOf } from '@/lib/axios/strapi';
import { useSchoolSuspendMutation } from '@/modules/ops/queries/use-school-suspend.mutation';
import { useSchoolVersionQuery } from '@/modules/ops/queries/use-school-version.query';

import type { UseSchoolSuspendActionInput } from '@/modules/ops/types/school-suspend.types';

/** The coded 400/412 refusals this operation declares, each with its own copy. */
const CODE_MESSAGES: Record<string, string> = {
  [SCHOOL_SUSPEND_CODES.alreadySuspended]: 'errorAlready',
  [SCHOOL_SUSPEND_CODES.archived]: 'errorArchived',
  [SCHOOL_SUSPEND_CODES.versionStale]: 'errorStale',
  [SCHOOL_SUSPEND_CODES.versionRequired]: 'errorVersion',
  [SCHOOL_SUSPEND_CODES.versionInvalid]: 'errorVersion',
};

/**
 * C-OPS-PORTAL-005 click handling: fetch-backed version, confirm, mutate,
 * report. Kept out of the component so it stays presentational.
 *
 * The refusal copy is chosen by the server's stable `details.code`, never by
 * parsing prose, so "someone else changed this school" (412) reads differently
 * from "this school is archived" (400) — two outcomes an operator resolves in
 * completely different ways.
 */
export function useSchoolSuspendAction({
  documentId,
  schoolName,
  enabled,
}: UseSchoolSuspendActionInput) {
  const t = useTranslations('Ops.detail.suspend');
  const version = useSchoolVersionQuery(documentId, enabled);
  const suspend = useSchoolSuspendMutation();

  return {
    /** False while the row version is unknown: without it the write is a guess. */
    ready: version.isSuccess,
    pending: suspend.isPending,
    /** The versioned suspend result — carries action_documentId + undo_expires_at (task 12). */
    result: suspend.data,
    async confirm(): Promise<boolean> {
      if (!version.data) {
        toast.error(t('errorVersionUnavailable'));
        return false;
      }
      try {
        await suspend.mutateAsync({
          schoolDocumentId: documentId,
          version: formatResourceVersion(version.data.updatedAt),
        });
        toast.success(t('success', { name: schoolName }));
        return true;
      } catch (error) {
        const failure = restFailureOf(error);
        const code =
          failure && failure.kind === 'contract' ? failure.envelope?.error.details.code : undefined;
        const key = code ? CODE_MESSAGES[code] : undefined;
        toast.error(t(key ?? 'error'));
        return false;
      }
    },
  };
}
