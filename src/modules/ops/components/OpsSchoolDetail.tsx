'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { Alert, Button, MediaCover, Skeleton } from '@/modules/design-system';
import { showOpsToast, useOpsWriteGate } from '@/modules/ops/actions';
import { OpsEditSchoolDialog } from '@/modules/ops/components/OpsEditSchoolDialog';
import { OpsSchoolCountCards } from '@/modules/ops/components/OpsSchoolCountCards';
import { OpsSchoolInvitationPanel } from '@/modules/ops/components/OpsSchoolInvitationPanel';
import { OpsSchoolLifecycleBanner } from '@/modules/ops/components/OpsSchoolLifecycleBanner';
import { OpsSchoolSuspendPanel } from '@/modules/ops/components/OpsSchoolSuspendPanel';
import { OpsSchoolTables } from '@/modules/ops/components/OpsSchoolTables';
import {
  portalPlanLabelKey,
  portalStatusLabelKey,
} from '@/modules/ops/lib/portal-lifecycle.lib';
import { getSchoolCrestSource } from '@/modules/ops/lib/school-crest';
import { useSchoolDetailQuery } from '@/modules/ops/queries/use-school-detail.query';
import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';
import type { PortalStatus } from '@schooltest/ops-contracts';
import type { OpsSchoolDetailProps } from '@/modules/ops/types/components.types';
import type { OpsSchool } from '@/modules/ops/types/ops.types';

// Design statusStyle mapping (`Ops Portal.dc.html:964-977`): fixed fg/bg per status.
const STATUS_PILL_TONES: Record<PortalStatus, string> = {
  active: 'bg-[#E1F5EF] text-[#0E7C66]',
  trial: 'bg-[#EEF3FE] text-[#1D4ED8]',
  pending_setup: 'bg-[#FDF3E0] text-[#92610B]',
  suspended: 'bg-[#FDEEEC] text-[#B42318]',
  archived: 'bg-[#F1F3F7] text-[#7C8698]',
};

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
    // Design 254-278: a stats-strip-shaped skeleton plus row-shaped skeletons.
    return (
      <main className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex gap-8 rounded-card bg-card px-[30px] py-[26px] shadow-sm">
          {['65%', '40%', '55%', '45%'].map((width) => (
            <div key={width} className="flex min-w-[140px] flex-1 flex-col gap-2.5">
              <Skeleton className="h-2.5 w-[52%] rounded-md" />
              <Skeleton className="h-[22px] rounded-lg" style={{ width }} />
            </div>
          ))}
        </div>
        <div className="rounded-card bg-card px-7 py-6 shadow-sm">
          {['62%', '78%', '50%', '70%', '44%'].map((width) => (
            <div
              key={width}
              className="flex items-center gap-3.5 border-b border-[#F4F6FA] py-[13px]"
            >
              <Skeleton className="size-[38px] shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 rounded-md" style={{ width }} />
                <Skeleton className="h-2.5 w-[28%] rounded-md" />
              </div>
              <Skeleton className="h-[26px] w-24 shrink-0 rounded-full" />
            </div>
          ))}
          <p className="pb-1 pt-4 text-[13px] text-[#9AA6B8]">{t('loadingData')}</p>
        </div>
      </main>
    );
  }

  if (schoolQuery.isError) {
    // Design 243-252: centered card, red tile, navy retry pill.
    return (
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-card bg-card px-8 py-13 text-center shadow-sm">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#FDEEEC] text-[#B42318]">
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5M12 16.5v.01" />
            </svg>
          </div>
          <div className="text-base font-semibold text-foreground">{t('errorTitle')}</div>
          <p className="mx-auto mt-1.5 max-w-[400px] text-[13.5px] leading-relaxed text-[#7C8698]">
            {t('errorDescription')}
          </p>
          <Button
            type="button"
            variant="navy"
            loading={schoolQuery.isFetching}
            onClick={() => schoolQuery.refetch()}
            className="mt-5 h-[42px] rounded-full px-[22px] text-[13.5px] font-semibold"
          >
            {t('retry')}
          </Button>
        </div>
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
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard/ops/schools"
          className="w-fit text-[13.5px] font-medium text-[#7C8698] no-underline hover:text-blue-600"
        >
          <span aria-hidden="true">← </span>
          {t('backToSchools')}
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          <MediaCover
            src={getSchoolCrestSource(detail.cover_image_url)}
            alt={school.name}
            ratio="square"
            sizes="76px"
            className="size-[76px] shrink-0 rounded-[20px]"
          />
          <div className="min-w-[220px] flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-[30px] leading-tight font-medium tracking-[-0.02em] text-foreground">
                {school.name}
              </h1>
              {/* Design 214: fixed tone pair per lifecycle status, 12/600 pill. */}
              <span
                className={`rounded-full px-[13px] py-1.5 text-xs font-semibold ${STATUS_PILL_TONES[detail.portal_status]}`}
              >
                {tSchools(portalStatusLabelKey(detail.portal_status))}
              </span>
            </div>
            {detailMeta ? (
              <p className="mt-[5px] text-sm text-[#7C8698]">{detailMeta}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex" onClick={isReadOnly ? openEdit : undefined}>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full border-[#D8DFEA] px-5 text-[13.5px] font-semibold hover:border-navy-900"
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
        {/* BUG-006 — the design's status banner: radius 20, roomy padding. */}
        <div className="[&_[data-slot=alert]]:rounded-[20px] [&_[data-slot=alert]]:p-[18px_22px]">
        <OpsSchoolLifecycleBanner
          documentId={documentId}
          schoolName={school.name}
          status={detail.portal_status}
          trialEndsAt={detail.trial_ends_at}
          retentionUntil={detail.retention_until}
          suspendedAt={detail.suspended_at}
          enabled={hydrated && Boolean(token)}
        />
        </div>
        {/* The design drops the badge row: plan is already in the meta line and
            onboarding moved into the Overview details card. The invitation panel
            (KEEP-PROTECTED, retire-ledger R-18) restyles into the card language. */}
        <section
          data-slot="ops-invitation-card"
          className="rounded-card bg-card px-[30px] py-[26px] shadow-sm"
        >
          <OpsSchoolInvitationPanel documentId={documentId} enabled={hydrated && Boolean(token)} />
        </section>
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
