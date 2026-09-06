'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { toast } from 'sonner';

import type { SchoolsListRow } from '@schooltest/ops-contracts';

import { useAuthStore } from '@/modules/auth';
import { Badge } from '@/modules/design-system';
import {
  DIRECTORY_ALL,
  OpsDirectoryTable,
  useOpsDirectoryState,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
} from '@/modules/ops/directory';
import { OpsSchoolsPills } from '@/modules/ops/components/OpsSchoolsPills';
import {
  PORTAL_STATUS_VARIANTS,
  portalPlanLabelKey,
  portalStatusLabelKey,
} from '@/modules/ops/lib/portal-lifecycle.lib';
import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';
import { useSchoolsListQuery } from '@/modules/ops/queries/use-schools-list.query';

const SCHOOL_STATES = ['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'] as const;
const SCHOOL_SECTORS = ['government', 'non-government', 'catholic'] as const;
const PORTAL_PLANS = ['pilot', 'standard', 'enterprise'] as const;
const ONBOARDING = ['not_started', 'link_sent', 'in_progress', 'submitted', 'complete'] as const;

/** Nulls never reach a formatter: a school with no suburb still renders a row. */
function metaLine(school: SchoolsListRow): string {
  return [school.suburb, school.state].filter((part): part is string => Boolean(part)).join(' ');
}

/**
 * The Schools screen, on the task 04 directory kit.
 *
 * Search, filters, sort, pagination, empty states, the error/stale banner and
 * URL round-tripping all belong to the kit — none of them is re-implemented
 * here, and the local OpsSchoolsFilters/OpsSchoolsPagination copies were
 * deleted rather than left beside it. What stays local is what is genuinely
 * domain-specific: the columns, the row actions and the counted status pills,
 * which the kit has no concept of.
 *
 * `status` IS a kit filter, so it round-trips through the URL and Clear filters
 * resets it, but it is deliberately not passed to the table's filter row: the
 * design renders it as the pill bar instead, and offering it twice would be two
 * controls writing one value.
 */
export function OpsSchoolsTable() {
  const t = useTranslations('Ops.schools');
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  // The pictured Status page action reads the URL the RELEASE configured, which
  // the capabilities operation already serves as `status_page_url`. Nothing is
  // hardcoded here. Per that contract a null is "the release configured none" —
  // an explicit setup failure to surface, not a licence to drop the control, so
  // the action stays and says what is missing instead of doing nothing.
  const capabilities = useCapabilitiesQuery(hydrated && Boolean(token));
  const statusPageUrl = capabilities.data?.status_page_url ?? null;

  const statusFilter: DirectoryFilterDef = useMemo(
    () => ({
      key: 'status',
      label: t('filterStatus'),
      options: [
        { value: DIRECTORY_ALL, label: t('pillAllSchools') },
        { value: 'active', label: t('portalStatus.active') },
        { value: 'trial', label: t('portalStatus.trial') },
        { value: 'pending_setup', label: t('portalStatus.pending_setup') },
        { value: 'suspended', label: t('portalStatus.suspended') },
        { value: 'archived', label: t('portalStatus.archived') },
      ],
    }),
    [t],
  );

  const visibleFilters: readonly DirectoryFilterDef[] = useMemo(
    () => [
      {
        key: 'state',
        label: t('filterState'),
        options: [
          { value: DIRECTORY_ALL, label: t('filterStateAll') },
          ...SCHOOL_STATES.map((value) => ({ value, label: value })),
        ],
      },
      {
        key: 'sector',
        label: t('filterSector'),
        options: [
          { value: DIRECTORY_ALL, label: t('filterSectorAll') },
          ...SCHOOL_SECTORS.map((value) => ({ value, label: t(`sector.${value}`) })),
        ],
      },
      {
        key: 'plan',
        label: t('filterPlan'),
        options: [
          { value: DIRECTORY_ALL, label: t('filterPlanAll') },
          ...PORTAL_PLANS.map((value) => ({ value, label: t(`portalPlan.${value}`) })),
        ],
      },
      {
        key: 'onboarding',
        label: t('filterOnboarding'),
        options: [
          { value: DIRECTORY_ALL, label: t('filterOnboardingAll') },
          ...ONBOARDING.map((value) => ({ value, label: t(`onboardingStatus.${value}`) })),
        ],
      },
    ],
    [t],
  );

  const allFilters = useMemo(
    () => [statusFilter, ...visibleFilters],
    [statusFilter, visibleFilters],
  );

  const sorts = useMemo(
    () => [
      { value: 'name:asc', label: t('sortName') },
      { value: 'student_count:desc', label: t('sortStudents') },
      { value: 'createdAt:desc', label: t('sortCreated') },
    ],
    [t],
  );

  // `pageCount` is deliberately NOT passed. The kit's clamp option wants the
  // live pageCount, but the query carrying it is built from this hook's own
  // params, so a consumer can only supply it from a previous render — and the
  // ways to do that (a ref written during render, or setState in an effect) are
  // both genuinely wrong in React 19, not merely lint-flagged. The kit already
  // receives `meta` on the table, so the clamp belongs there; reported upstream
  // rather than worked around here, since four more surfaces copy this file.
  const state = useOpsDirectoryState({ filters: allFilters, sorts, defaultSort: 'name:asc' });
  const live = useSchoolsListQuery(state.params, hydrated && Boolean(token));

  const columns: readonly DirectoryColumnDef<SchoolsListRow>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('columnName'),
        sortable: true,
        sortValues: { asc: 'name:asc', desc: 'name:asc' },
        cell: (school) => (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{school.name ?? t('unnamedSchool')}</span>
            <span className="text-meta text-body">{metaLine(school)}</span>
          </div>
        ),
      },
      {
        key: 'portal_status',
        header: t('columnStatus'),
        // Same mapping the detail page uses — one status, one label, one tone.
        cell: (school) => (
          <Badge variant={PORTAL_STATUS_VARIANTS[school.portal_status]}>
            {t(portalStatusLabelKey(school.portal_status))}
          </Badge>
        ),
      },
      {
        key: 'portal_plan',
        header: t('columnPlan'),
        cell: (school) => t(portalPlanLabelKey(school.portal_plan)),
      },
      {
        key: 'portal_teacher_count',
        header: t('columnTeachers'),
        cell: (school) => school.portal_teacher_count,
      },
      { key: 'admin_count', header: t('columnAdmins'), cell: (school) => school.admin_count },
      { key: 'class_count', header: t('columnClasses'), cell: (school) => school.class_count },
      {
        key: 'student_count',
        header: t('columnStudents'),
        sortable: true,
        sortValues: { asc: 'student_count:desc', desc: 'student_count:desc' },
        cell: (school) => school.student_count,
      },
      { key: 'results_count', header: t('columnResults'), cell: (school) => school.results_count },
    ],
    [t],
  );

  // Every action closes over the row it was built for, so the target is the
  // school actually clicked. Two schools sharing a name stay separate targets
  // because the documentId, not the label, is what is captured.
  const rowActions = () => [
    {
      label: t('actionOpen'),
      onSelect: (target: SchoolsListRow) =>
        router.push(`/dashboard/ops/schools/${target.documentId}`),
    },
    {
      label: t('actionStatusPage'),
      onSelect: () => {
        if (statusPageUrl === null) {
          toast.error(t('statusPageUnconfigured'));
          return;
        }
        window.open(statusPageUrl, '_blank', 'noopener,noreferrer');
      },
    },
  ];

  return (
    <main
      data-slot="ops-schools"
      data-surface="ops-schools"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-body">{t('description')}</p>
      </div>

      <OpsSchoolsPills
        counts={live.data?.meta.status_counts}
        selected={state.params.filters.status ?? DIRECTORY_ALL}
        onSelect={(value) => state.setFilter('status', value)}
      />

      <OpsDirectoryTable
        state={state}
        query={live}
        rows={live.data?.data ?? []}
        getRowTarget={(school) => ({ kind: 'school', documentId: school.documentId })}
        meta={live.data?.meta.pagination}
        filters={visibleFilters}
        sorts={sorts}
        columns={columns}
        rowActions={rowActions}
        labels={{
          searchPlaceholder: t('searchPlaceholder'),
          searchLabel: t('searchLabel'),
          emptyNoneTitle: t('emptyNoneTitle'),
          emptyNoneDescription: t('emptyNoneDescription'),
          emptyNoMatchesTitle: t('noMatches'),
          errorTitle: t('errorTitle'),
          errorDescription: t('errorDescription'),
          retry: t('retry'),
        }}
      />
    </main>
  );
}
