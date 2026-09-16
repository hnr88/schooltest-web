'use client';

import { useLocale, useTranslations } from 'next-intl';

import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { useExitRequestDecisionMutation } from '@/modules/teacher/queries/use-exit-request-decision.mutation';
import { usePendingExitRequestsQuery } from '@/modules/teacher/queries/use-pending-exit-requests.query';
import type { PendingExitRequestsPanelProps } from '@/modules/teacher/types/exit-request.types';
import type { ExitRequestDecision, PendingExitRequest } from '@/modules/teacher/schemas/exit-request.schema';

/** One queue row: who, which test, when, why — with the two answers. */
function PendingExitRequestRow({
  request,
  deciding,
  onDecide,
}: {
  request: PendingExitRequest;
  deciding: boolean;
  onDecide: (requestId: string, decision: ExitRequestDecision) => void;
}) {
  const t = useTranslations('TeacherPortal.live.exitRequests');
  const locale = useLocale();
  const askedAt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(request.createdAt),
  );

  return (
    <li
      data-slot="pending-exit-request"
      data-request-id={request.id}
      className="flex items-start justify-between gap-4 px-4 py-3"
    >
      <div className="min-w-0 flex flex-col gap-0.5">
        <span data-slot="pending-exit-request-student" className="text-[13.5px] font-semibold text-navy-900">
          {request.studentName}
          <span className="ml-2 font-normal text-[#6B7280]">
            {request.testLabel ?? t('testFallback')} · {askedAt}
          </span>
        </span>
        <span data-slot="pending-exit-request-reason" className="text-[13px] text-[#374151]">
          {request.reason}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <TeacherButton
          tone="primary"
          size="xs"
          disabled={deciding}
          onClick={() => onDecide(request.id, 'approved')}
        >
          {t('approve')}
        </TeacherButton>
        <TeacherButton
          tone="dangerOutline"
          size="xs"
          disabled={deciding}
          onClick={() => onDecide(request.id, 'denied')}
        >
          {t('deny')}
        </TeacherButton>
      </div>
    </li>
  );
}

/**
 * The Live tab's pending-exit-requests panel (the live test-monitoring view):
 * every student currently locked in the open sitting who has asked to leave,
 * with Approve / Deny. The queue polls while the tab is open; a decision
 * invalidates it, so the answered request leaves the list (and an approval
 * flags the sitting server-side, sanctioning the student's exit).
 */
export function PendingExitRequestsPanel({ sittingDocumentId }: PendingExitRequestsPanelProps) {
  const t = useTranslations('TeacherPortal.live.exitRequests');
  const queue = usePendingExitRequestsQuery(sittingDocumentId);
  const decide = useExitRequestDecisionMutation();
  const decidingId = decide.isPending ? (decide.variables?.requestId ?? null) : null;
  const requests = queue.data ?? [];

  const handleDecide = (requestId: string, decision: ExitRequestDecision): void => {
    decide.mutate({ requestId, decision });
  };

  return (
    <section
      data-slot="pending-exit-requests"
      data-sitting-id={sittingDocumentId}
      data-status={queue.isPending ? 'loading' : queue.isError ? 'error' : 'ready'}
      className="rounded-[11px] border border-[#ECEEF2] bg-white"
    >
      <h3
        data-slot="pending-exit-requests-title"
        className="border-b border-[#ECEEF2] px-4 pt-4 pb-3 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]"
      >
        {t('title', { count: requests.length })}
      </h3>
      {queue.isPending ? (
        <p className="px-4 py-6 text-[13.5px] text-[#6B7280]">{t('loading')}</p>
      ) : null}
      {queue.isError ? (
        <p role="alert" className="px-4 py-6 text-[13.5px] text-[#B42318]">
          {t('loadError')}
        </p>
      ) : null}
      {!queue.isPending && !queue.isError && requests.length === 0 ? (
        <p data-slot="pending-exit-requests-empty" className="px-4 py-6 text-[13.5px] text-[#6B7280]">
          {t('empty')}
        </p>
      ) : null}
      {requests.length > 0 ? (
        <ul data-slot="pending-exit-requests-list" className="flex flex-col divide-y divide-[#ECEEF2]">
          {requests.map((request) => (
            <PendingExitRequestRow
              key={request.id}
              request={request}
              deciding={decidingId === request.id}
              onDecide={handleDecide}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
