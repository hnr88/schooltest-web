'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Alert, Badge, Button, Skeleton } from '@/modules/design-system';
import { OpsFormWindow } from '@/modules/ops/components/OpsFormWindow';
import { OpsSchoolInvitationPanel } from '@/modules/ops/components/OpsSchoolInvitationPanel';
import { OpsSittingRecovery } from '@/modules/ops/components/OpsSittingRecovery';
import { OpsStudentImport } from '@/modules/ops/components/OpsStudentImport';
import { useOpsSchoolsQuery } from '@/modules/ops/queries/use-ops-schools.query';
import { ACCOUNT_STATUS_VARIANTS, ONBOARDING_STATUS_VARIANTS } from '@/modules/school-admin';

interface OpsSchoolDetailProps {
  documentId: string;
}

// Ops console school detail (task 66, st-mvp-pivot): one C-OPS-01 row —
// lifecycle chips plus the live teacher/class/student/result counts. The W8
// tasks (67-70) hang the deeper management surfaces off this page.
export function OpsSchoolDetail({ documentId }: OpsSchoolDetailProps) {
  const t = useTranslations('Ops.detail');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const schoolsQuery = useOpsSchoolsQuery(hydrated && Boolean(token));

  if (schoolsQuery.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (schoolsQuery.isError) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={schoolsQuery.isFetching}
              onClick={() => schoolsQuery.refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      </main>
    );
  }

  const school = schoolsQuery.data.find((row) => row.documentId === documentId);

  if (!school) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert variant="error" title={t('notFoundTitle')}>
          {t('notFoundDescription')}
        </Alert>
      </main>
    );
  }

  const counts = [
    { label: t('teachersLabel'), value: school.teacher_count },
    { label: t('classesLabel'), value: school.class_count },
    { label: t('studentsLabel'), value: school.student_count },
    { label: t('resultsLabel'), value: school.results_count },
  ];

  return (
    <main
      data-slot="ops-school-detail"
      data-surface="ops-school-detail"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <Link
          href="/dashboard/ops/schools"
          className="text-sm text-body underline-offset-4 hover:underline"
        >
          {t('backToSchools')}
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">{school.name}</h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Badge variant={ACCOUNT_STATUS_VARIANTS[school.account_status]}>
            {t(`accountStatus.${school.account_status}`)}
          </Badge>
          <Badge variant={ONBOARDING_STATUS_VARIANTS[school.onboarding_status]}>
            {t(`onboardingStatus.${school.onboarding_status}`)}
          </Badge>
        </div>
        {/* Spec: the Onboard School control sits near the status badges and
            above the summary cards. */}
        <OpsSchoolInvitationPanel documentId={documentId} enabled={hydrated && Boolean(token)} />
      </div>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {counts.map((count) => (
          <div
            key={count.label}
            className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4"
          >
            <dt className="text-sm text-body">{count.label}</dt>
            <dd className="text-2xl font-semibold text-foreground">{count.value}</dd>
          </div>
        ))}
      </dl>
      <OpsFormWindow documentId={documentId} />
      <OpsSittingRecovery schoolDocumentId={documentId} />
      <OpsStudentImport documentId={documentId} />
    </main>
  );
}
