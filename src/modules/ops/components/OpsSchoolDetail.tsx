'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { Alert, Badge, Button, MediaCover, Skeleton } from '@/modules/design-system';
import { showOpsToast, useOpsWriteGate } from '@/modules/ops/actions';
import { OpsEditSchoolDialog } from '@/modules/ops/components/OpsEditSchoolDialog';
import { OpsSchoolCountCards } from '@/modules/ops/components/OpsSchoolCountCards';
import { OpsSchoolInvitationPanel } from '@/modules/ops/components/OpsSchoolInvitationPanel';
import { OpsSchoolLifecycleBanner } from '@/modules/ops/components/OpsSchoolLifecycleBanner';
import { OpsSchoolSuspendPanel } from '@/modules/ops/components/OpsSchoolSuspendPanel';
import { OpsSchoolTables } from '@/modules/ops/components/OpsSchoolTables';
import {
  PORTAL_STATUS_VARIANTS,
  portalPlanLabelKey,
  portalStatusLabelKey,
} from '@/modules/ops/lib/portal-lifecycle.lib';
import { getSchoolCrestSource } from '@/modules/ops/lib/school-crest';
import { useSchoolDetailQuery } from '@/modules/ops/queries/use-school-detail.query';
import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';
import { ONBOARDING_STATUS_VARIANTS } from '@/modules/school-admin';

import type { OpsSchoolDetailProps } from '@/modules/ops/types/components.types';
import type { OpsSchool } from '@/modules/ops/types/ops.types';

// OPS-012 (C-OPS-PORTAL-002): the page now reads GET /api/ops/schools/:documentId
// directly. It previously pulled the WHOLE directory and did an in-memory
// `.find()` on documentId, so a deep link paid for every school in the tenant
// and — after OPS-011 paginated the directory — any school outside page 1
// rendered as "not found" although it existed.
//
// ops/43 (R-18): Plan re-parented into the edit-school modal, Form
// window/Sitting recovery retired (R-19/R-20), Student import re-parented
// into its own modal (task 26), and the duplicate Teachers dialog removed
// (R-23) — `OpsSchoolTables`'s Teachers tab is the one surviving instance.
// The invitation panel stays mounted here: it is KEEP-PROTECTED (never
// deleted, retire-ledger R-18) and the onboarding e2e suite drives Send,
// Resend and Revoke through its own rendered buttons, not the header menu.
export function OpsSchoolDetail({ documentId }: OpsSchoolDetailProps) {
  const t = useTranslations('Ops.detail');
  // The lifecycle words live in ONE catalogue (Ops.schools), so the list and
  // this page cannot drift apart in wording either.
  const tSchools = useTranslations('Ops.schools');
  const locale = useLocale();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const schoolQuery = useSchoolDetailQuery(documentId, hydrated && Boolean(token));
  const capabilities = useCapabilitiesQuery(hydrated && Boolean(token));
  const editWriteGate = useOpsWriteGate();
  const [editOpen, setEditOpen] = useState(false);
  const isReadOnly = capabilities.data?.capabilities.write === false;

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
    detail &&
    detail.name !== null &&
    detail.account_status !== null &&
    detail.onboarding_status !== null
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

  if (!school || detail === undefined) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert variant="error" title={t('notFoundTitle')}>
          {t('notFoundDescription')}
        </Alert>
      </main>
    );
  }

  const location = [detail.suburb, detail.state]
    .filter((part): part is string => Boolean(part))
    .join(' ');
  const sector = detail.sector ? tSchools(`sector.${detail.sector}`) : null;
  const plan = detail.portal_plan
    ? `${tSchools(portalPlanLabelKey(detail.portal_plan))} ${tSchools('planSuffix')}`
    : null;
  const created = detail.createdAt
    ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(
        new Date(detail.createdAt),
      )
    : null;
  const detailMeta = [
    sector,
    location || null,
    plan,
    created ? `${t('createdPrefix')} ${created}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ');
  const openInvite = () => {
    document.querySelector<HTMLButtonElement>('[data-slot="ops-onboard-actions"] button')?.click();
  };
  const openEdit = () => {
    const blocked = editWriteGate.blockedReason();
    if (blocked !== null) {
      showOpsToast({ tone: 'error', message: blocked });
      return;
    }
    setEditOpen(true);
  };

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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <MediaCover
              src={getSchoolCrestSource(detail.cover_image_url)}
              alt={school.name}
              ratio="square"
              sizes="76px"
              className="size-[76px] shrink-0 rounded-panel"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{school.name}</h1>
                <Badge variant={PORTAL_STATUS_VARIANTS[detail.portal_status]}>
                  {tSchools(portalStatusLabelKey(detail.portal_status))}
                </Badge>
              </div>
              {detailMeta ? <p className="mt-2 text-sm text-body">{detailMeta}</p> : null}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <span className="inline-flex" onClick={isReadOnly ? openEdit : undefined}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="ops-edit-school"
                disabled={isReadOnly}
                onClick={isReadOnly ? undefined : openEdit}
              >
                {t('editSchool')}
              </Button>
            </span>
            <OpsSchoolSuspendPanel
              school={school}
              enabled={hydrated && Boolean(token)}
              portalStatus={detail.portal_status}
              onEdit={openEdit}
              onInvite={openInvite}
              onChanged={() => {
                void schoolQuery.refetch();
              }}
            />
          </div>
        </div>
        <OpsSchoolLifecycleBanner
          documentId={documentId}
          schoolName={school.name}
          status={detail.portal_status}
          trialEndsAt={detail.trial_ends_at}
          retentionUntil={detail.retention_until}
          suspendedAt={detail.suspended_at}
          enabled={hydrated && Boolean(token)}
        />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* The portal lifecycle, through the mapping the directory row also
              uses — so a school reads the same on both screens. The legacy
              onboarding chip stays beside it: account_status and
              onboarding_status are independent and neither is replaced. */}
          <Badge variant="outline">{tSchools(portalPlanLabelKey(detail.portal_plan))}</Badge>
          <Badge variant={ONBOARDING_STATUS_VARIANTS[school.onboarding_status]}>
            {t(`onboardingStatus.${school.onboarding_status}`)}
          </Badge>
        </div>
        {/* KEEP-PROTECTED (retire-ledger R-18): the onboarding suite drives
            Send/Resend/Revoke through this panel's own rendered buttons. */}
        <OpsSchoolInvitationPanel documentId={documentId} enabled={hydrated && Boolean(token)} />
      </div>
      <OpsSchoolCountCards school={detail} />
      <OpsSchoolTables schoolDocumentId={documentId} school={detail} />
      {editOpen ? (
        <OpsEditSchoolDialog
          school={{
            documentId: detail.documentId,
            name: school.name,
            suburb: detail.suburb,
            state: detail.state,
            sector: detail.sector,
            postcode: detail.postcode,
            schoolType: detail.schoolType,
            contact_email: detail.contact_email,
            contact_first_name: detail.contact_first_name,
            contact_last_name: detail.contact_last_name,
            phone: detail.phone,
            contact_name: detail.contact_name,
            plan: detail.plan,
            portal_plan: detail.portal_plan,
            updatedAt: detail.updatedAt,
          }}
          onDone={() => {
            setEditOpen(false);
            void schoolQuery.refetch();
          }}
        />
      ) : null}
    </main>
  );
}
