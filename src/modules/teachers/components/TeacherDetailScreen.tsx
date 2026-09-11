'use client';

import { ChevronRight, MoreHorizontal, XIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link, useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { useSchoolClassesQuery, useUpdateClassTeachersMutation } from '@/modules/classes';
import {
  Alert,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IconButton,
  PanelHeaderRow,
  PersonCell,
  Skeleton,
  StatusPill,
} from '@/modules/design-system';
import { useParticipationQuery } from '@/modules/school-admin';
import { ProgressDeltaPill, progressDelta } from '@/modules/teacher';
import { AssignClassesDialog } from '@/modules/teachers/components/AssignClassesDialog';
import { ConfirmStaffActionDialog } from '@/modules/teachers/components/ConfirmStaffActionDialog';
import { EditTeacherDialog } from '@/modules/teachers/components/EditTeacherDialog';
import { STATUS_PILL_TONES } from '@/modules/teachers/constants/components.constants';
import { useStaffRows } from '@/modules/teachers/hooks/use-staff-rows';
import { useStaffTableActions } from '@/modules/teachers/hooks/use-staff-row-actions';
import { removeTeacherPatch } from '@/modules/teachers/lib/teacher-class-membership';
import { useInvitationsQuery } from '@/modules/teachers/queries/use-invitations.query';
import { useTeacherNeedsAttentionQuery } from '@/modules/teachers/queries/use-teacher-needs-attention.query';
import { useTeachersQuery, type ParsedSchoolTeacher } from '@/modules/teachers/queries/use-teachers.query';

// R-16: the role TYPE maps to the invite flow's existing role labels — value
// → i18n key, the raw enum never reaches the DOM.
const ROLE_TYPE_LABEL_KEYS: Record<
  NonNullable<ParsedSchoolTeacher['role']>,
  'roleTeacher' | 'roleSchoolAdmin'
> = {
  teacher: 'roleTeacher',
  school_admin: 'roleSchoolAdmin',
};

// School admin Teacher detail, design VIEW 4b (School Admin Portal.dc.html
// 611-735): back link, navy avatar + name + status pill + meta line, the
// action row (edit · assign · ⋯ menu over the same confirm-guarded account
// actions the list rows serve), the KPI tiles (label-over-value, white 20px
// cards), the Assigned classes card (year-band tile, name+sub, per-class
// completion from C-RPT-04, students, chevron — plus the remove control the
// real contract needs), and the Account details / Students-needing-attention
// pair on the design's side-by-side grid. That attention panel keeps its
// three states strictly distinct: PENDING is a skeleton, ERROR is an alert
// with retry, and only a SUCCESSFUL empty list renders "Everyone is on
// track." Renders ONLY what the existing API serves; deliberately absent, as
// unserved contract gaps (C-TCH-06/07, task 17): the avg-reading-score tile
// and the Recent activity panel.
function initialsOf(first: string, last: string, email: string): string {
  const initials = `${first.trim().charAt(0)}${last.trim().charAt(0)}`.trim();
  return (initials || email.trim().charAt(0)).toUpperCase();
}

// The design's KPI tile: white 20px-radius card, uppercase micro-label over a
// 28px bold value.
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-result bg-card px-6 py-5.5 shadow-[0_1px_2px_rgba(14,35,80,0.04)]">
      <span className="truncate text-meta font-semibold uppercase tracking-[0.05em] text-[#9AA6B8]">
        {label}
      </span>
      <span className="text-[28px] leading-[1.15] font-bold tracking-[-0.02em] text-foreground">
        {value}
      </span>
    </div>
  );
}

// The design's white 24px-radius card with the kit list card's hairline shadow.
const CARD_CLASS =
  'rounded-card bg-card shadow-[0_1px_2px_rgba(14,35,80,0.04)]';

export function TeacherDetailScreen({ documentId }: { documentId: string }) {
  const t = useTranslations('Teachers.detail');
  const tStatus = useTranslations('Teachers.table.status');
  const tInvite = useTranslations('Teachers.invite');
  const tTable = useTranslations('Teachers.table');
  const ta = useTranslations('Teachers.actions');
  const format = useFormatter();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const teachersQuery = useTeachersQuery(enabled);
  const invitationsQuery = useInvitationsQuery(enabled);
  const classesQuery = useSchoolClassesQuery(enabled);
  const participationQuery = useParticipationQuery(enabled);
  const rows = useStaffRows({
    teachers: teachersQuery.data,
    invitations: invitationsQuery.data,
    classes: classesQuery.data,
    participation: participationQuery.data,
  });
  // The detail route serves STAFF accounts; an invitation id has no account to
  // detail and lands on the not-found branch below.
  const row = rows.find((candidate) => candidate.documentId === documentId);
  const attentionQuery = useTeacherNeedsAttentionQuery(
    documentId,
    enabled && row?.kind === 'teacher',
  );
  const [assignOpen, setAssignOpen] = useState(false);
  const removeClassTeachers = useUpdateClassTeachersMutation();
  // The header ⋯ menu serves the same confirm-guarded account actions as the
  // list's row menu (edit · deactivate/reactivate · remove); the confirm and
  // edit-dialog state lives in the shared hook.
  const actions = useStaffTableActions();
  const removing =
    actions.confirm?.action === 'remove' && actions.confirmPending;

  const isPending =
    !enabled ||
    teachersQuery.isPending ||
    invitationsQuery.isPending ||
    classesQuery.isPending ||
    participationQuery.isPending;
  const isError = teachersQuery.isError || invitationsQuery.isError;
  const refetch = () => {
    void teachersQuery.refetch();
    void invitationsQuery.refetch();
    void classesQuery.refetch();
    void participationQuery.refetch();
  };

  const classesById = new Map((classesQuery.data ?? []).map((klass) => [klass.documentId, klass]));
  const participationById = new Map(
    (participationQuery.data?.classes ?? []).map((klass) => [klass.documentId, klass]),
  );

  if (isPending) {
    return (
      <main
        data-slot="school-teacher-detail"
        data-surface="school-admin-teacher-detail"
        className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"
      >
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (isError) {
    return (
      <main
        data-slot="school-teacher-detail"
        data-surface="school-admin-teacher-detail"
        className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"
      >
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={teachersQuery.isFetching || invitationsQuery.isFetching}
              onClick={refetch}
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

  if (!row || row.kind !== 'teacher') {
    return (
      <main
        data-slot="school-teacher-detail"
        data-surface="school-admin-teacher-detail"
        className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className={CARD_CLASS + ' flex flex-col gap-4 p-6 text-center'}>
          <h1 className="text-2xl font-semibold text-foreground">{t('notFoundTitle')}</h1>
          <p className="text-sm text-body">{t('notFoundDescription')}</p>
          <div className="flex justify-center">
            <Button type="button" variant="outline" render={<Link href="/dashboard/school/teachers" />}>
              {t('notFoundBack')}
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const displayName = `${row.first_name} ${row.last_name}`.trim() || row.email;
  // C-TCH-01 fields the merged StaffRow does not carry: read them off the
  // parsed list row itself. role/last_active_at/createdAt are optional in the
  // schema (the C-TCH-04 PATCH row serves none), so every one falls back:
  // a NULL last_active_at says "never opened a sitting" — never a creation
  // date and never the bare em dash.
  const teacher = teachersQuery.data?.find((candidate) => candidate.documentId === documentId);
  const roleLabel = teacher?.role ? tInvite(ROLE_TYPE_LABEL_KEYS[teacher.role]) : t('accountPanel.roleNone');
  const addedLabel = teacher?.createdAt
    ? format.dateTime(new Date(teacher.createdAt), { day: 'numeric', month: 'short', year: 'numeric' })
    : tTable('noValue');
  const lastActiveLabel = teacher?.last_active_at
    ? format.dateTime(new Date(teacher.last_active_at), { day: 'numeric', month: 'short', year: 'numeric' })
    : t('accountPanel.neverActive');
  const studentsTotal = row.classes.reduce(
    (sum, klass) => sum + (classesById.get(klass.documentId)?.student_count ?? 0),
    0,
  );
  const testATotal = row.classes.reduce(
    (sum, klass) => sum + (participationById.get(klass.documentId)?.test_a.submitted ?? 0),
    0,
  );
  const statusPill = (
    <StatusPill tone={STATUS_PILL_TONES[row.status]}>{tStatus(row.status)}</StatusPill>
  );

  return (
    <main
      data-slot="school-teacher-detail"
      data-surface="school-admin-teacher-detail"
      className="flex flex-1 flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8"
    >
      {/* Header — back link, navy avatar, name + pill, meta line, actions. */}
      <div className="flex flex-col">
        <Link
          href="/dashboard/school/teachers"
          className="self-start text-body-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <span aria-hidden>←</span> {t('back')}
        </Link>
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4.5 gap-y-3">
          <span
            aria-hidden
            className="grid size-15 shrink-0 place-items-center rounded-full bg-navy-900 text-[20px] font-semibold text-white"
          >
            {initialsOf(row.first_name, row.last_name, row.email)}
          </span>
          <div className="min-w-[220px] flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-foreground">{displayName}</h1>
              {statusPill}
            </div>
            <p data-slot="teacher-detail-meta" className="mt-[5px] truncate text-body-md text-muted-foreground">
              {[row.email, roleLabel, lastActiveLabel].join(' · ')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Button type="button" variant="outline" onClick={() => actions.openEdit(row)}>
              {t('editButton')}
            </Button>
            <Button type="button" variant="navy" onClick={() => setAssignOpen(true)}>
              {t('assignButton')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label={t('moreActions')}
                    className="grid size-10 cursor-pointer place-items-center rounded-[10px] border border-input bg-card text-[#3D4A5C] transition-colors hover:border-foreground"
                  >
                    <MoreHorizontal className="size-[18px]" aria-hidden="true" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-[218px]">
                {actions.rowActionsFor(row).map((action) => (
                  <DropdownMenuItem
                    key={action.label}
                    aria-disabled={action.disabled === true || undefined}
                    className={action.destructive ? 'text-destructive' : undefined}
                    onClick={() => action.onSelect(row)}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* KPI tiles — the design's label-over-value cards. The fourth design
          tile (avg. reading score) stays absent: no endpoint serves it. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <StatTile label={t('stats.classes')} value={String(row.classes.length)} />
        <StatTile label={t('stats.students')} value={String(studentsTotal)} />
        <StatTile label={t('stats.testA')} value={String(testATotal)} />
      </div>

      {/* Assigned classes card. */}
      <section className={CARD_CLASS} aria-label={t('classesPanel.title')} data-slot="teacher-detail-classes">
        <div className="flex items-baseline justify-between gap-2 px-7 pt-5.5 pb-2">
          <h2 className="text-panel-title font-semibold text-foreground">{t('classesPanel.title')}</h2>
          <span className="text-[13px] text-muted-foreground">
            {t('classesPanel.count', { count: row.classes.length })}
          </span>
        </div>
        {removeClassTeachers.isError ? (
          <div className="px-7 pb-3">
            <Alert variant="error" title={t('classesPanel.removeErrorTitle')}>
              {t('classesPanel.removeErrorDescription')}
            </Alert>
          </div>
        ) : null}
        {row.classes.length === 0 ? (
          <div className="flex flex-col gap-1 px-7 pt-3 pb-6 text-center">
            <p className="text-[15px] font-semibold text-foreground">{t('classesPanel.emptyTitle')}</p>
            <p className="text-body-sm text-muted-foreground">{t('classesPanel.emptyDescription')}</p>
          </div>
        ) : (
          <ul className="px-7 pb-4">
            {row.classes.map((klass) => {
              const schoolClass = classesById.get(klass.documentId);
              const participation = participationById.get(klass.documentId);
              const removePatch = removeTeacherPatch(schoolClass, row.documentId);
              const rosterCount = participation?.roster_count ?? 0;
              const submitted = participation?.test_a.submitted ?? 0;
              const percent = rosterCount > 0 ? Math.round((submitted / rosterCount) * 100) : 0;
              return (
                <li
                  key={klass.documentId}
                  className="flex flex-wrap items-center border-b border-[#EEF1F6] pr-2 last:border-b-0"
                >
                  <Link
                    href={`/dashboard/school/classes/${klass.documentId}`}
                    aria-label={t('classesPanel.openLabel', { name: klass.name })}
                    className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3.5 gap-y-2.5 py-3.5"
                  >
                    {schoolClass?.year_band ? (
                      <span
                        aria-hidden
                        className="grid size-9.5 shrink-0 place-items-center rounded-xl bg-[#EEF1F6] px-1 text-center text-[12.5px] font-bold text-foreground"
                      >
                        {schoolClass.year_band}
                      </span>
                    ) : null}
                    <span className="block min-w-[150px] flex-[3_1_200px]">
                      <span className="block truncate text-[14.5px] font-semibold text-foreground">
                        {klass.name}
                      </span>
                      {participation ? (
                        <span className="mt-0.5 block truncate text-[12.5px] text-muted-foreground">
                          {t('classesPanel.completed', {
                            done: submitted,
                            total: rosterCount,
                          })}
                        </span>
                      ) : null}
                    </span>
                    <span className="block min-w-[130px] flex-[2_1_150px]">
                      <span className="block h-1.5 rounded-full bg-[#EEF1F6]">
                        <span
                          className="block h-full rounded-full bg-foreground"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="mt-1.5 block text-[11.5px] text-[#9AA6B8]">
                        {t('classesPanel.percentCompleted', { percent })}
                      </span>
                    </span>
                    {schoolClass ? (
                      <span className="min-w-[96px] flex-[1_1_110px] text-body-sm text-[#3D4A5C]">
                        {t('classesPanel.students', { count: schoolClass.student_count })}
                      </span>
                    ) : null}
                    <ChevronRight className="size-4 shrink-0 text-[#9AA6B8]" aria-hidden />
                  </Link>
                  <IconButton
                    icon={XIcon}
                    label={t('classesPanel.removeLabel', { name: klass.name })}
                    size="sm"
                    tone="ghost"
                    disabled={removeClassTeachers.isPending || removing || removePatch === null}
                    onClick={() => {
                      if (removePatch) removeClassTeachers.mutate(removePatch);
                    }}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Account details + students needing attention, side by side. */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] items-start gap-5">
        <section className={CARD_CLASS + ' px-7.5 py-6.5'} aria-label={t('accountPanel.title')}>
          <PanelHeaderRow
            as="h2"
            title={t('accountPanel.title')}
            action={
              <Button type="button" variant="ghost" size="sm" onClick={() => actions.openEdit(row)}>
                {t('accountPanel.edit')}
              </Button>
            }
          />
          <dl>
            {[
              { label: t('accountPanel.email'), value: row.email },
              { label: t('accountPanel.role'), value: roleLabel },
              { label: t('accountPanel.status'), value: tStatus(row.status) },
              { label: t('accountPanel.added'), value: addedLabel },
              { label: t('accountPanel.lastActive'), value: lastActiveLabel },
            ].map((field) => (
              <div
                key={field.label}
                className="flex items-baseline justify-between gap-4 border-b border-[#EEF1F6] py-3 last:border-b-0"
              >
                <dt className="text-[13px] text-muted-foreground">{field.label}</dt>
                <dd className="truncate text-body-sm text-right font-semibold text-foreground">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={CARD_CLASS + ' px-7.5 py-6.5'} aria-label={t('attention.title')} data-slot="teacher-needs-attention">
          <h2 className="text-panel-title font-semibold text-foreground">{t('attention.title')}</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">{t('attention.subtitle')}</p>
          <div className="mt-3">
            {attentionQuery.isPending ? (
              <Skeleton className="h-10 w-full" />
            ) : attentionQuery.isError ? (
              <Alert
                variant="error"
                title={t('attention.errorTitle')}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={attentionQuery.isFetching}
                    onClick={() => void attentionQuery.refetch()}
                  >
                    {t('retry')}
                  </Button>
                }
              >
                {t('attention.errorDescription')}
              </Alert>
            ) : (attentionQuery.data?.students.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-[13px] text-[#9AA6B8]">{t('attention.empty')}</p>
            ) : (
              <ul data-slot="teacher-needs-attention-rows">
                {attentionQuery.data?.students.map((student) => {
                  const delta = progressDelta(student.delta);
                  return (
                    <li
                      key={student.student_document_id}
                      className="border-b border-[#EEF1F6] py-3.5 last:border-b-0"
                    >
                      <PersonCell
                        name={student.display_name}
                        secondary={student.class.name ?? undefined}
                        trailing={
                          <span className="flex items-center gap-2">
                            <span className="text-body-sm text-body tabular-nums">
                              {t('attention.scores', { from: student.score_a, to: student.score_b })}
                            </span>
                            <ProgressDeltaPill
                              direction={delta.direction}
                              change={format.number(delta.magnitude, { maximumFractionDigits: 0 })}
                            />
                          </span>
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>

      <ConfirmStaffActionDialog
        open={actions.confirm !== null}
        onOpenChange={(open) => {
          if (!open) actions.closeConfirm();
        }}
        title={actions.confirm ? ta(`${actions.confirm.action}Title`, { name: displayName }) : ''}
        description={actions.confirm ? ta(`${actions.confirm.action}Description`) : ''}
        warning={actions.confirmWarning}
        cancelLabel={ta('cancel')}
        confirmLabel={actions.confirm ? ta(`${actions.confirm.action}Confirm`) : ''}
        destructive={actions.confirm?.action !== 'reactivate'}
        pending={actions.confirmPending}
        onConfirm={() => {
          const action = actions.confirm?.action;
          void actions.handleConfirm().then(() => {
            // A removed account has no detail page to stay on.
            if (action === 'remove') router.push('/dashboard/school/teachers');
          });
        }}
      />
      {actions.editRow ? <EditTeacherDialog row={actions.editRow} onClose={actions.closeEdit} /> : null}
      {assignOpen ? (
        <AssignClassesDialog
          teacherDocumentId={row.documentId}
          teacherName={displayName}
          classes={classesQuery.data ?? []}
          onClose={() => setAssignOpen(false)}
          onAssigned={refetch}
        />
      ) : null}
    </main>
  );
}
