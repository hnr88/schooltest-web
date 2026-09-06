'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { Alert, Badge, Button, Skeleton } from '@/modules/design-system';
import { OpsFormWindow } from '@/modules/ops/components/OpsFormWindow';
import { OpsSchoolCountCards } from '@/modules/ops/components/OpsSchoolCountCards';
import { OpsSchoolInvitationPanel } from '@/modules/ops/components/OpsSchoolInvitationPanel';
import { OpsSchoolPlanPanel } from '@/modules/ops/components/OpsSchoolPlanPanel';
import { OpsSchoolSuspendPanel } from '@/modules/ops/components/OpsSchoolSuspendPanel';
import { OpsSchoolTables } from '@/modules/ops/components/OpsSchoolTables';
import { OpsSittingRecovery } from '@/modules/ops/components/OpsSittingRecovery';
import { OpsStudentImport } from '@/modules/ops/components/OpsStudentImport';
import { OpsTeachersDialog } from '@/modules/ops/components/OpsTeachersDialog';
import {
  PORTAL_STATUS_VARIANTS,
  portalLifecycleBanner,
  portalPlanLabelKey,
  portalStatusLabelKey,
} from '@/modules/ops/lib/portal-lifecycle.lib';
import { useSchoolDetailQuery } from '@/modules/ops/queries/use-school-detail.query';
import { ONBOARDING_STATUS_VARIANTS } from '@/modules/school-admin';

import type { OpsSchoolDetailProps } from '@/modules/ops/types/components.types';
import type { OpsSchool } from '@/modules/ops/types/ops.types';

// OPS-012 (C-OPS-PORTAL-002): the page now reads GET /api/ops/schools/:documentId
// directly. It previously pulled the WHOLE directory and did an in-memory
// `.find()` on documentId, so a deep link paid for every school in the tenant
// and — after OPS-011 paginated the directory — any school outside page 1
// rendered as "not found" although it existed.
//
// Ops console school detail (task 66, st-mvp-pivot): one C-OPS-01 row —
// lifecycle chips plus the live teacher/class/student/result counts. The
// W8 tasks (67-70) hang the deeper management surfaces off this page; the
// Teachers card opens the OPS-teacher-details staff directory (064).
export function OpsSchoolDetail({ documentId }: OpsSchoolDetailProps) {
  const t = useTranslations('Ops.detail');
  // The lifecycle words live in ONE catalogue (Ops.schools), so the list and
  // this page cannot drift apart in wording either.
  const tSchools = useTranslations('Ops.schools');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const schoolQuery = useSchoolDetailQuery(documentId, hydrated && Boolean(token));
  const [teachersOpen, setTeachersOpen] = useState(false);

  if (schoolQuery.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </main>
    );
  }

  if (schoolQuery.isError) {
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
              loading={schoolQuery.isFetching}
              onClick={() => schoolQuery.refetch()}
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

  const detail = schoolQuery.data;

  // The three identity fields are NOT NULL in the school content-type, so a row
  // missing them is a broken record rather than a renderable school. Narrowing
  // here keeps the child components on their existing non-null OpsSchool
  // contract without inventing a substitute name or lifecycle value.
  const school: OpsSchool | null =
    detail && detail.name !== null && detail.account_status !== null && detail.onboarding_status !== null
      ? {
          documentId: detail.documentId,
          name: detail.name,
          account_status: detail.account_status,
          onboarding_status: detail.onboarding_status,
          plan: detail.plan,
          teacher_count: detail.teacher_count,
          class_count: detail.class_count,
          student_count: detail.student_count,
          results_count: detail.results_count,
        }
      : null;

  const banner = detail === undefined ? null : portalLifecycleBanner(detail.portal_status);

  if (!school || detail === undefined) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert variant="error" title={t('notFoundTitle')}>
          {t('notFoundDescription')}
        </Alert>
      </main>
    );
  }

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
        {banner === null ? null : (
          <Alert variant={banner.tone} title={t(banner.titleKey)}>
            {t(banner.bodyKey)}
          </Alert>
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* The portal lifecycle, through the mapping the directory row also
              uses — so a school reads the same on both screens. The legacy
              onboarding chip stays beside it: account_status and
              onboarding_status are independent and neither is replaced. */}
          <Badge variant={PORTAL_STATUS_VARIANTS[detail.portal_status]}>
            {tSchools(portalStatusLabelKey(detail.portal_status))}
          </Badge>
          <Badge variant="outline">{tSchools(portalPlanLabelKey(detail.portal_plan))}</Badge>
          <Badge variant={ONBOARDING_STATUS_VARIANTS[school.onboarding_status]}>
            {t(`onboardingStatus.${school.onboarding_status}`)}
          </Badge>
          <OpsSchoolSuspendPanel school={school} enabled={hydrated && Boolean(token)} />
        </div>
        {/* Spec: the Onboard School control sits near the status badges and
            above the summary cards. */}
        <OpsSchoolInvitationPanel documentId={documentId} enabled={hydrated && Boolean(token)} />
      </div>
      <OpsSchoolCountCards school={detail} onTeachersClick={() => setTeachersOpen(true)} />
      <OpsSchoolPlanPanel documentId={documentId} plan={school.plan} />
      <OpsFormWindow documentId={documentId} />
      <OpsSittingRecovery schoolDocumentId={documentId} />
      <OpsStudentImport documentId={documentId} />
      <OpsSchoolTables schoolDocumentId={documentId} />
      <OpsTeachersDialog
        schoolDocumentId={documentId}
        open={teachersOpen}
        onOpenChange={setTeachersOpen}
      />
    </main>
  );
}
