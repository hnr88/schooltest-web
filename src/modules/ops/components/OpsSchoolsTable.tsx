'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  formatResourceVersion,
  type PortalStatus,
} from '@schooltest/ops-contracts';

import { restFailureOf, strapi } from '@/lib/axios/strapi';
import { useRouter } from '@/i18n/navigation';
import {
  showOpsToast,
  useOpsActionRunner,
  useOpsConfirmAction,
  useOpsWriteGate,
} from '@/modules/ops/actions';
import type { OpsActionDefinition, OpsActionTarget } from '@/modules/ops/actions';
import {
  ARCHIVE_SCHOOL_ACTION,
  SUSPEND_SCHOOL_ACTION,
} from '@/modules/ops/lib/school-lifecycle-bulk.lib';

import type { SchoolsListRow } from '@schooltest/ops-contracts';

import { useAuthStore } from '@/modules/auth';
import { Badge, Input, MediaCover } from '@/modules/design-system';
import { OpsConfirmDialog } from '@/modules/ops/components/OpsConfirmDialog';
import { OpsCreateSchoolDialog } from '@/modules/ops/components/OpsCreateSchoolDialog';
import {
  DIRECTORY_ALL,
  OpsDirectoryTable,
  useOpsDirectoryState,
  type DirectoryColumnDef,
  type DirectoryFilterDef,
  type DirectoryRowAction,
} from '@/modules/ops/directory';
import { OpsSchoolsPills } from '@/modules/ops/components/OpsSchoolsPills';
import {
  PORTAL_STATUS_VARIANTS,
  portalPlanLabelKey,
  portalStatusLabelKey,
} from '@/modules/ops/lib/portal-lifecycle.lib';
import {
  schoolLifecycleActions,
  type SchoolLifecycleAction,
  type SchoolLifecycleActionKey,
} from '@/modules/ops/lib/school-lifecycle-actions';
import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';
import { useSchoolsListQuery } from '@/modules/ops/queries/use-schools-list.query';
import { useSchoolLifecycleUndoMutation } from '@/modules/ops/queries/use-school-lifecycle-undo.mutation';
import {
  archiveSchool,
  suspendSchool,
} from '@/modules/ops/queries/use-school-suspend.mutation';
import { fetchSchoolDetail } from '@/modules/ops/queries/use-school-detail.query';
import { fetchSchoolVersion } from '@/modules/ops/queries/use-school-version.query';
import { getSchoolCrestSource } from '@/modules/ops/lib/school-crest';
import { formatRelativeTime } from '@/modules/ops/lib/relative-time';
import {
  parseSchoolsExportScope,
  schoolsExportRowCount,
} from '@/modules/ops/lib/schools-export.lib';
import { useSchoolsExportQuery } from '@/modules/ops/queries/use-schools-export.query';
import { saveCsvDownload } from '@/modules/school-admin';

const SCHOOL_STATES = ['VIC', 'NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'] as const;
const SCHOOL_SECTORS = ['government', 'non-government', 'catholic'] as const;
const PORTAL_PLANS = ['pilot', 'standard', 'enterprise'] as const;
const ONBOARDING = ['not_started', 'link_sent', 'in_progress', 'submitted', 'complete'] as const;

/** The five status-conditional lifecycle keys; edit/invite are navigations. */
type LifecycleActionKey = Exclude<SchoolLifecycleActionKey, 'editDetails' | 'inviteAdmin'>;

interface LifecycleTarget extends OpsActionTarget {
  lifecycleAction: LifecycleActionKey;
  targetStatus: PortalStatus;
}

/** The server-minted handle C-OPS-PORTAL-018 undoes (suspend and archive only). */
interface LifecycleActionHandle {
  actionDocumentId: string;
}

/** The row + action the open confirm acts on — what the operator saw, never re-read. */
interface SchoolsConfirmTarget {
  school: SchoolsListRow;
  action: SchoolLifecycleAction;
}

/** Nulls never reach a formatter: a school with no suburb still renders a row. */
function metaLine(
  school: SchoolsListRow,
  translate: (key: string) => string,
  locale: string,
): string {
  const location = [school.suburb, school.state]
    .filter((part): part is string => Boolean(part))
    .join(' ');
  const sector = school.sector ? translate(`sector.${school.sector}`) : null;
  const plan = `${translate(`portalPlan.${school.portal_plan}`)} ${translate('planSuffix')}`;
  const active = `${translate('activePrefix')} ${formatRelativeTime(school.last_active_at, new Date(), locale)}`;
  return [sector, location, plan, active].filter((part): part is string => Boolean(part)).join(' · ');
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
  // The confirm copy is the design's exact contractual wording, under its own
  // `Ops.confirm.*` namespace (`{action}.{title|body|cta}` per transition).
  const tConfirm = useTranslations('Ops.confirm');
  // ops/09 — reused verbatim from the retired page-body export panel (D-33):
  // the failure copy already exists and the CSV endpoint/hook it names are
  // unchanged.
  const tExport = useTranslations('Ops.export');
  const locale = useLocale();
  const router = useRouter();
  // ops/09 — the bulk Export's scope source (see below); `next/navigation`'s
  // raw params, not the i18n-aware one, matching what `useOpsDirectoryState`
  // itself writes into the URL.
  const searchParams = useSearchParams();
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
      { value: 'last_active_at:desc', label: t('sortRecent') },
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

  // ---- the row lifecycle (task 08's list integration of task 10's substrate) --
  const queryClient = useQueryClient();
  const writeGate = useOpsWriteGate();
  const undo = useSchoolLifecycleUndoMutation();
  const actionHandle = useRef<LifecycleActionHandle | null>(null);
  const lastFailure = useRef<unknown>(null);
  const [confirmTarget, setConfirmTarget] = useState<SchoolsConfirmTarget | null>(null);

  // The single-school lifecycle write, defined HERE (not in a shared lib)
  // because the Undo handle must be captured in the caller's closure: the
  // runner discards `perform`'s return value, so the action_documentId the
  // toast needs can only travel through a ref this component owns. Same shape
  // the detail panel (task 10) runs — one transactional endpoint per action,
  // the version the list actually showed quoted in If-Match, and an authorized
  // read-back before anything counts as success.
  const lifecycleActionDefinition = useMemo<OpsActionDefinition<LifecycleTarget>>(() => {
    return {
      write: true,
      async perform(target) {
        try {
          const version = await fetchSchoolVersion(target.documentId);
          const resourceVersion = formatResourceVersion(version.updatedAt);

          if (target.lifecycleAction === 'suspend') {
            const result = await suspendSchool({
              schoolDocumentId: target.documentId,
              version: resourceVersion,
            });
            actionHandle.current = { actionDocumentId: result.action_documentId };
            return result;
          }

          if (target.lifecycleAction === 'archive') {
            const result = await archiveSchool({
              schoolDocumentId: target.documentId,
              version: resourceVersion,
            });
            actionHandle.current = { actionDocumentId: result.action_documentId };
            return result;
          }

          if (target.lifecycleAction === 'restore') {
            const response = await strapi.post<unknown>(
              `/api/ops/schools/${target.documentId}/restore`,
              {},
              { opsPortalVersioned: true, headers: { 'If-Match': resourceVersion } },
            );
            return response.data;
          }

          if (target.lifecycleAction === 'activate' || target.lifecycleAction === 'reactivate') {
            const response = await strapi.post<unknown>(
              `/api/ops/schools/${target.documentId}/activate`,
              {},
              { opsPortalVersioned: true },
            );
            return response.data;
          }

          throw new Error(`Unsupported school lifecycle action: ${target.lifecycleAction}`);
        } catch (error) {
          // Kept for the confirm dialog: the server's own refusal (a 409 says
          // the school is already in the target state) must reach the operator
          // verbatim, not as an invented success or a generic failure.
          lastFailure.current = error;
          throw error;
        }
      },
      async readBack(target) {
        return (await fetchSchoolDetail(target.documentId)).portal_status === target.targetStatus;
      },
      async isEligible(target) {
        return (await fetchSchoolDetail(target.documentId)).portal_status !== target.targetStatus;
      },
    };
  }, []);
  const lifecycleRunner = useOpsActionRunner(lifecycleActionDefinition);

  /** C-OPS-PORTAL-018 with the returned action_documentId. A 410 says the
   * window closed — one plain message, never a retry. */
  const runLifecycleUndo = async (
    school: SchoolsListRow,
    handle: LifecycleActionHandle,
  ): Promise<void> => {
    const displayName = school.name ?? t('unnamedSchool');
    try {
      const version = await fetchSchoolVersion(school.documentId);
      await undo.mutateAsync({
        schoolDocumentId: school.documentId,
        actionDocumentId: handle.actionDocumentId,
        version: formatResourceVersion(version.updatedAt),
      });
      await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
      showOpsToast({ tone: 'ok', message: t('actions.undoSuccess', { name: displayName }) });
    } catch (error) {
      const failure = restFailureOf(error);
      if (failure?.kind === 'contract' && failure.status === 410) {
        showOpsToast({ tone: 'warn', message: t('actions.undoExpired') });
        return;
      }
      showOpsToast({ tone: 'error', message: t('actions.undoError') });
    }
  };

  const runLifecycleWrite = async (): Promise<void> => {
    if (confirmTarget === null) return;
    const { school, action } = confirmTarget;
    if (action.targetStatus === undefined) return;
    actionHandle.current = null;
    lastFailure.current = null;
    const summary = await lifecycleRunner.run([
      {
        kind: 'school',
        documentId: school.documentId,
        lifecycleAction: action.key as LifecycleActionKey,
        targetStatus: action.targetStatus,
      },
    ]);
    if (!summary.allSucceeded) {
      // Rejected writes stay in the dialog: rethrowing makes useOpsConfirmAction
      // surface the server's envelope message (the 409's honest refusal) and
      // keeps the dialog open instead of toasting a fake success.
      throw lastFailure.current ?? new Error('The change could not be saved.');
    }
    // The row must move NOW, not on a later refocus.
    await queryClient.invalidateQueries({ queryKey: ['ops', 'schools'] });
    const displayName = school.name ?? t('unnamedSchool');
    const handle = actionHandle.current as LifecycleActionHandle | null;
    showOpsToast({
      tone: 'ok',
      // The design's own per-transition line (`:1259-1265`): "{name} suspended".
      message: t(`actions.success.${action.key}`, { name: displayName }),
      ...(handle === null
        ? {}
        : {
            action: {
              label: t('actions.undo'),
              run: () => void runLifecycleUndo(school, handle),
            },
          }),
    });
  };

  const confirmAction = useOpsConfirmAction({
    // Present only while an Archive confirm is open — the CTA then stays at
    // 0.55 opacity until the typed name matches (nameSatisfied recomputes per
    // render from the open target).
    typed: confirmTarget?.action.typed === true ? (confirmTarget.school.name ?? '') : undefined,
    onConfirm: runLifecycleWrite,
  });

  /** The design's lock (`:1082`/`:1087`): a locked entry stays in the menu and
   * its click fires the refusal toast with NO request; offline refusals carry
   * Retry, which re-runs the choice (never the write past its confirm). */
  const refuseWhenLocked = (retry: () => void): boolean => {
    const reason = writeGate.blockedReason();
    if (reason === null) return true;
    showOpsToast({
      tone: 'error',
      message: reason,
      ...(writeGate.retryWhenBlocked
        ? { action: { label: writeGate.retryLabel, run: retry } }
        : {}),
    });
    return false;
  };

  const chooseLifecycleAction = (school: SchoolsListRow, action: SchoolLifecycleAction): void => {
    const retry = () => chooseLifecycleAction(school, action);
    if (action.key === 'editDetails' || action.key === 'inviteAdmin') {
      // The design's edit/invite modals belong to tasks 24 and 25; until they
      // exist the entries route to the detail surface where both flows live,
      // gated exactly like the detail panel's own Edit/Invite (write: true).
      if (refuseWhenLocked(retry)) {
        router.push(`/dashboard/ops/schools/${school.documentId}`);
      }
      return;
    }
    if (action.targetStatus === undefined) return;
    if (!refuseWhenLocked(retry)) return;
    // The confirm is raised from the action, not from inside the menu's DOM —
    // the menu closes on outside click and must not take the confirm with it.
    // The typed draft clears per open (the design's askConfirm does the same);
    // it survives errors WITHIN a session because the hook never clears it there.
    confirmAction.setTypedName('');
    setConfirmTarget({ school, action });
    confirmAction.openDialog();
  };

  const columns: readonly DirectoryColumnDef<SchoolsListRow>[] = useMemo(
    () => [
      {
        key: 'name',
        header: t('columnName'),
        sortable: true,
        sortValues: { asc: 'name:asc', desc: 'name:asc' },
        cell: (school) => (
          <div className="flex items-center gap-3">
            <MediaCover
              src={getSchoolCrestSource(school.cover_image_url)}
              alt={school.name ?? t('unnamedSchool')}
              ratio="square"
              sizes="52px"
              className="size-13 shrink-0 rounded-[14px]"
            />
            <div className="flex min-w-0 flex-col">
              <span className="text-[15.5px] font-semibold text-foreground">{school.name ?? t('unnamedSchool')}</span>
              <span className="mt-[3px] truncate text-[12.5px] text-body">{metaLine(school, t, locale)}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'student_count',
        header: t('columnStudents'),
        sortable: true,
        sortValues: { asc: 'student_count:desc', desc: 'student_count:desc' },
        cell: (school) => school.student_count,
      },
      { key: 'admin_count', header: t('columnAdmins'), cell: (school) => school.admin_count },
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
      { key: 'class_count', header: t('columnClasses'), cell: (school) => school.class_count },
      { key: 'results_count', header: t('columnResults'), cell: (school) => school.results_count },
      {
        key: 'portal_status',
        header: t('columnStatus'),
        grid: 'bare',
        // Same mapping the detail page uses — one status, one label, one tone.
        cell: (school) => (
          <Badge
            variant={PORTAL_STATUS_VARIANTS[school.portal_status]}
            className="w-[94px] justify-center rounded-full px-[13px] py-1.5 text-xs font-semibold"
          >
            {t(portalStatusLabelKey(school.portal_status))}
          </Badge>
        ),
      },
    ],
    [locale, t],
  );

  // Every action closes over the row it was built for, so the target is the
  // school actually clicked. Two schools sharing a name stay separate targets
  // because the documentId, not the label, is what is captured.
  //
  // The design's row menu (`:1258-1266`), from task 10's shared status/action
  // table — never a second status→actions map: Open school, then the existing
  // Status page, then Edit details / Invite admin, the ONE status-conditional
  // entry, and Archive school unless already archived. `write` is the
  // substrate's own per-action flag (D-20), carried so the kit's gate sees it.
  const rowActions = (school: SchoolsListRow): readonly DirectoryRowAction<SchoolsListRow>[] => [
    {
      label: t('actionOpen'),
      onSelect: (target: SchoolsListRow) =>
        // The router is next-intl's (`@/i18n/navigation`), NOT the plain
        // next/navigation one: this app runs localePrefix 'as-needed', and the
        // plain router's push used to land on an unprefixed path the
        // locale-aware stack bounced off — the click closed the menu and the
        // URL never left the list (measured over a 3s settle, no pageerror).
        router.push(`/dashboard/ops/schools/${target.documentId}`),
      write: false,
      disabled: false,
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
      write: false,
      disabled: false,
    },
    // ops/28 (D-53) — mirrors OpsClassDetail.tsx:287: greyed pre-emptively
    // for a READ-ONLY session only, never merely offline — offline is
    // transient and must keep its clickable toast-with-Retry path (the menu
    // click still needs to fire so `chooseLifecycleAction`'s own
    // `refuseWhenLocked` raises the exact toast/retry pair). `onSelect`,
    // `write` and the confirm copy below are unchanged.
    ...schoolLifecycleActions(school.portal_status).map((action) => ({
      label: t(action.labelKey),
      destructive: action.danger,
      write: action.write,
      disabled: action.write && writeGate.readOnly,
      onSelect: (target: SchoolsListRow) => chooseLifecycleAction(target, action),
    })),
  ];

  // Bulk Suspend / Archive (task 12 lifecycle through the task 05 runner):
  // every selected school takes the SAME single-school lifecycle write the
  // detail panel uses - transactional, FOR UPDATE-locked, coded errors - and
  // the runner reports an honest per-row outcome (success / failed /
  // uncertain / not started), never a whole-set verdict.
  const suspendRun = useOpsActionRunner(SUSPEND_SCHOOL_ACTION);
  const archiveRun = useOpsActionRunner(ARCHIVE_SCHOOL_ACTION);

  // ops/09 (C-OPS-PORTAL-009, R-07 first half) — the bulk Export re-parented
  // off the retired page-body export panel. It reads the directory's
  // CURRENT FILTER SCOPE straight off the URL — the same source
  // `useOpsDirectoryState` itself writes to — and never the bulk bar's
  // selection (D-16): "Selecting rows then changing a filter does not change
  // what Export produces." The endpoint, the hook and the filename are
  // byte-for-byte what the panel called; only the trigger moved.
  const exportScope = useMemo(
    () => parseSchoolsExportScope(new URLSearchParams(searchParams)),
    [searchParams],
  );
  const exportQuery = useSchoolsExportQuery(exportScope);
  const runExport = async (): Promise<void> => {
    const result = await exportQuery.refetch();
    if (result.data) {
      saveCsvDownload(result.data.csv, result.data.filename);
      showOpsToast({
        tone: 'ok',
        // The row count is read off the file the server actually sent, never
        // the selection size the operator happened to have ticked.
        message: t('actions.exportSuccess', { count: schoolsExportRowCount(result.data.csv) }),
      });
      return;
    }
    showOpsToast({ tone: 'error', message: tExport('errorDescription') });
  };

  // ops/28 (D-53) — `disabled` mirrors OpsClassDetail.tsx:287. bulkSuspend and
  // bulkArchive carry no local `write` literal (unchanged here — Suspend and
  // Archive dispatch through SUSPEND_SCHOOL_ACTION/ARCHIVE_SCHOOL_ACTION,
  // whose OWN `write: true` is what the runner already gates on), so their
  // `disabled` reads the write gate directly rather than through `action.write`.
  // `readOnly` ALONE, never `blockedReason() !== null` — that also trips
  // offline, and a natively-disabled bulk button would silently swallow the
  // toast-with-Retry offline path capabilities.spec.ts:178 requires.
  const locked = writeGate.readOnly;
  const bulkActions = [
    // First, per the design (`:1480`) and the task's `Done when` order.
    // `write: false` (D-20): a GET, so it never goes through the write gate
    // and stays reachable for the read-only `ops_support` account.
    { label: t('bulkExport'), write: false, disabled: false, onRun: () => void runExport() },
    {
      label: t('bulkSuspend'),
      disabled: locked,
      onRun: (targets: readonly OpsActionTarget[]) => void suspendRun.run(targets),
    },
    {
      label: t('bulkArchive'),
      destructive: true,
      disabled: locked,
      onRun: (targets: readonly OpsActionTarget[]) => void archiveRun.run(targets),
    },
  ];

  const openCreateSchool = () => {
    document.querySelector<HTMLButtonElement>('[data-testid="ops-create-school"]')?.click();
  };
  const openStatusPage = () => {
    if (statusPageUrl === null) {
      toast.error(t('statusPageUnconfigured'));
      return;
    }
    window.open(statusPageUrl, '_blank', 'noopener,noreferrer');
  };
  const hasSearch = Boolean(state.params.q);
  const hasFilters = Object.values(state.params.filters).some((value) => value !== DIRECTORY_ALL);

  return (
    <main
      data-slot="ops-schools"
      data-surface="ops-schools"
      className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"
    >
      {/* BUG-004 (journeys-and-bugs) — the design's header row: caption + 32px
          title on the left; the 44px pill search and the 44px pill Create
          school on the right. The search writes the SAME kit state the toolbar
          search used to own, so URL round-tripping and Clear filters are
          unchanged — only the control moved. */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="mb-1.5 text-[13px] text-body">{t('description')}</p>
          <h1 className="text-[32px] leading-tight font-medium tracking-[-0.02em] text-foreground">
            {t('title')}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-[18px] top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              aria-label={t('searchLabel')}
              type="search"
              data-testid="ops-schools-search"
              // The design's header search pill (`:91`): 44px tall, 260px wide,
              // 18px side padding, 16px icon, 10px icon-to-text gap — so the
              // text inset is 18+16+10 = 44px (pl-11), not a bare pl-10.
              className="h-11 w-[260px] rounded-full border-transparent bg-card px-[18px] pl-11 text-sm shadow-sm"
              placeholder={t('searchPlaceholder')}
              value={state.searchInput}
              onChange={(event) => state.setSearchInput(event.target.value)}
            />
          </div>
          <OpsCreateSchoolDialog />
        </div>
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
        selectable
        bulkActions={bulkActions}
        scope={[state.params.page, state.params.q, state.params.filters.status]}
        labels={{
          searchPlaceholder: t('searchPlaceholder'),
          searchLabel: t('searchLabel'),
          emptyNoneTitle: t('emptyNoneTitle'),
          emptyNoneDescription: t('emptyNoneDescription'),
          emptyNoMatchesTitle: hasSearch ? t('emptySearchTitle') : t('emptyFilterTitle'),
          emptyNoMatchesDescription: hasSearch
            ? t('emptySearchDescription')
            : t('emptyFilterDescription'),
          clearFilters: hasSearch && !hasFilters ? t('clearSearch') : t('clearFilters'),
          showingCount: ({ showing, total }) => t('showing', { showing, total }),
          errorTitle: t('errorTitle'),
          errorDescription: t('errorDescription'),
          retry: t('retry'),
        }}
        emptyAction={{ label: t('createSchool'), onRun: openCreateSchool }}
        toolbarVariant="pill"
        search={false}
        errorSecondaryAction={{ label: t('actionStatusPage'), onRun: openStatusPage }}
        rowHref={(school) => `/dashboard/ops/schools/${school.documentId}`}
      />

      {/* The row confirm, raised from the action and rendered at the screen's
          level — never inside the menu's DOM, so an outside click that closes
          the ⋯ menu cannot take the confirm with it. Rendered only while the
          hook holds it open, so each open is a fresh dialog. */}
      {confirmTarget === null || !confirmAction.open ? null : (
        <OpsConfirmDialog
          open
          onOpenChange={(nextOpen) => (nextOpen ? confirmAction.openDialog() : confirmAction.closeDialog())}
          title={tConfirm(`${confirmTarget.action.key}.title`, {
            name: confirmTarget.school.name ?? t('unnamedSchool'),
          })}
          description={tConfirm(`${confirmTarget.action.key}.body`)}
          confirmLabel={tConfirm(`${confirmTarget.action.key}.cta`)}
          cancelLabel={t('actions.cancel')}
          tone={confirmTarget.action.danger ? 'destructive' : 'neutral'}
          pending={confirmAction.pending}
          error={confirmAction.errorMessage}
          typed={
            confirmTarget.action.typed
              ? {
                  requiredName: confirmTarget.school.name ?? '',
                  value: confirmAction.typedName,
                  onChange: confirmAction.setTypedName,
                  mismatchMessage: t('actions.typedMismatch'),
                }
              : undefined
          }
          onConfirm={() => void confirmAction.confirm()}
        />
      )}
    </main>
  );
}
