'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from '@/i18n/navigation';
import { TEST_SESSIONS_PATH } from '@/modules/teacher/constants/join-code.constants';
import { classResultsHref } from '@/modules/teacher/lib/results-shell';
import { useTestSessionMonitorQuery } from '@/modules/teacher/queries/use-test-session-monitor.query';
import { TeacherPageCard } from '@/modules/teacher/components/v2/TeacherPageCard';

// RETIRED (Teacher Portal v2, R1 PART B): `/dashboard/test-sessions/<sitting>`
// used to render the C-TS-3 monitoring grid. The design runs a sitting from its
// own class — `/dashboard/results/<class>?tab=live&session=<sitting>` — so this
// route hands over to it instead.
//
// The class can only come from the server: the URL carries the SITTING's
// documentId and nothing else, and C-TS-3's own payload names the class
// (`sitting.class.document_id`). That is the read the Live tab makes anyway, so
// the destination opens on a warm cache rather than a second round trip. A
// sitting the caller may not read answers 403/404 (`retry: false`), which is not
// an error to report on a route that no longer exists — it falls back to the
// Live sessions page, the list this sitting would be on.
function SittingMonitorRedirect({ sittingDocumentId }: { sittingDocumentId: string }) {
  const t = useTranslations('Teacher.results.detail');
  const router = useRouter();
  const monitor = useTestSessionMonitorQuery(sittingDocumentId);
  const classDocumentId = monitor.data?.sitting.class.document_id ?? null;
  const destination =
    classDocumentId === null
      ? monitor.isError
        ? TEST_SESSIONS_PATH
        : null
      : `${classResultsHref(classDocumentId)}?tab=live&session=${sittingDocumentId}`;

  useEffect(() => {
    if (destination !== null) router.replace(destination);
  }, [destination, router]);

  return (
    <TeacherPageCard variant="padded" data-surface="teacher-sitting-redirect">
      <div role="status" aria-label={t('loading')} className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/5" />
        <Skeleton className="h-64 w-full rounded-[11px]" />
      </div>
    </TeacherPageCard>
  );
}

export { SittingMonitorRedirect };
