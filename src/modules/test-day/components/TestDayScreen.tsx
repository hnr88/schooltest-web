'use client';

import { useTranslations } from 'next-intl';
import { PlayCircle } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { EmptyState, StatusPill } from '@/modules/design-system';
import { CodeRevealCard } from '@/modules/test-day/components/CodeRevealCard';
import { MonitorSection } from '@/modules/test-day/components/MonitorSection';
import { SittingHistoryTable } from '@/modules/test-day/components/SittingHistoryTable';
import { SittingSummaryPanel } from '@/modules/test-day/components/SittingSummaryPanel';
import { StartSittingControls } from '@/modules/test-day/components/StartSittingControls';
import { useCreateSittingMutation } from '@/modules/test-day/queries/use-create-sitting.mutation';
import { useRevealCodeMutation } from '@/modules/test-day/queries/use-reveal-code.mutation';
import { useClassSittingsQuery } from '@/modules/test-day/queries/use-class-sittings.query';
import { useTeacherTestsQuery } from '@/modules/teacher';

import type { TestDayScreenProps } from '@/modules/test-day/types/components.types';

// Teacher test-day screen (task 64, mvp-updates §4.5): start a sitting, reveal
// the access code, watch the class live, handle re-sits, close/reopen. The
// current sitting is the class's latest one (newest first from the query): an
// open sitting is the live board, a closed one keeps its final board with
// reopen plus the start of the next sitting (Test B later is simply a new
// sitting. The UI resolves the exact A/B document id from C-TD-2 and sends it
// explicitly, satisfying D-32 without exposing a second picker on this legacy
// one-click surface.
export function TestDayScreen({ classDocumentId }: TestDayScreenProps) {
  const t = useTranslations('TestDay');
  const sittings = useClassSittingsQuery(classDocumentId);
  const current = sittings.data?.[0] ?? null;
  const tests = useTeacherTestsQuery();
  const currentVariant = tests.data?.tests.find(
    (test) => test.form_document_id === current?.form?.documentId,
  )?.variant;
  const nextVariant = currentVariant === 'A' ? 'B' : currentVariant === 'B' ? 'B' : 'A';
  const nextFormId =
    tests.data?.tests.find((test) => test.variant === nextVariant)?.form_document_id ?? null;
  const createSitting = useCreateSittingMutation(classDocumentId, nextFormId);
  const revealCode = useRevealCodeMutation();

  const className = current?.class?.name ?? sittings.data?.[0]?.class?.name ?? null;

  return (
    <main
      data-slot="test-day"
      data-surface="teacher-test-day"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/dashboard/teach/classes/${classDocumentId}`}
            className="w-fit text-sm font-semibold text-primary transition-colors duration-150 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t('backLink')}
          </Link>
          <Link
            href="/dashboard/teach/run-sheet"
            className="w-fit text-sm font-semibold text-primary transition-colors duration-150 hover:text-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {t('runSheetLink')}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">
            {className ? t('titleWithClass', { className }) : t('title')}
          </h1>
          {current ? (
            <StatusPill tone={current.status === 'open' ? 'success' : 'neutral'}>
              {t(`status.${current.status}`)}
            </StatusPill>
          ) : null}
        </div>
        <p className="max-w-xl text-sm text-body">{t('subtitle')}</p>
      </div>
      {sittings.isPending ? <p className="text-sm text-muted-foreground">{t('loading')}</p> : null}
      {sittings.isError ? (
        <p role="alert" className="text-sm text-danger-ink">
          {t('loadError')}
        </p>
      ) : null}
      {sittings.isSuccess && !current ? (
        <div className="flex max-w-xl flex-col gap-4">
          <EmptyState icon={PlayCircle} title={t('emptyTitle')} description={t('emptyBody')} />
          <StartSittingControls
            pending={createSitting.isPending || tests.isPending}
            disabled={!nextFormId}
            error={createSitting.isError || tests.isError || (tests.isSuccess && !nextFormId)}
            onStart={() => createSitting.mutate()}
          />
        </div>
      ) : null}
      {current ? (
        <>
          {current.status === 'closed' ? (
            <div className="flex max-w-xl flex-col gap-3 rounded-xl border border-border bg-card px-4 py-4">
              <p className="max-w-md text-sm text-body">{t('closedStartHint')}</p>
              <StartSittingControls
                pending={createSitting.isPending || tests.isPending}
                disabled={!nextFormId}
                error={createSitting.isError || tests.isError || (tests.isSuccess && !nextFormId)}
                onStart={() => createSitting.mutate()}
              />
            </div>
          ) : null}
          <CodeRevealCard
            sitting={current}
            revealPending={revealCode.isPending}
            onReveal={() => revealCode.mutate(current.documentId)}
          />
          <MonitorSection sitting={current} />
          <SittingSummaryPanel sitting={current} />
        </>
      ) : null}
      <SittingHistoryTable classDocumentId={classDocumentId} />
    </main>
  );
}
