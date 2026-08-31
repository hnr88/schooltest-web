'use client';

import { ArrowLeft } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import { Link } from '@/i18n/navigation';
import { useAuthStore } from '@/modules/auth';
import { useSchoolClassesQuery } from '@/modules/classes';
import {
  Alert,
  AvatarTint,
  Badge,
  Button,
  DataPanel,
  MiniStatTile,
  Skeleton,
  getAvatarTone,
} from '@/modules/design-system';
import { useParticipationQuery } from '@/modules/school-admin';
import { ProgressDeltaPill, progressDelta } from '@/modules/teacher';
import { EditTeacherDialog } from '@/modules/teachers/components/EditTeacherDialog';
import { STATUS_VARIANTS } from '@/modules/teachers/constants/components.constants';
import { useStaffRows } from '@/modules/teachers/hooks/use-staff-rows';
import { useInvitationsQuery } from '@/modules/teachers/queries/use-invitations.query';
import { useTeacherNeedsAttentionQuery } from '@/modules/teachers/queries/use-teacher-needs-attention.query';
import { useTeachersQuery } from '@/modules/teachers/queries/use-teachers.query';

// School admin Teacher detail (mission tasks 013 + 019, design-audit.md
// "Teachers list and Teacher detail"). Renders ONLY what the existing API
// serves: the header (identity, status, email), three KPI tiles (Classes /
// Students / Test A completed — each a count or sum of server-computed
// per-class figures, never a client-recomputed aggregate), the Assigned
// classes list with per-class completion from C-RPT-04 buckets, Account
// details, and (task 019) the Students-needing-attention panel from GAP-01's
// GET /schools/me/teachers/:documentId/needs-attention. That panel keeps its
// three states strictly distinct: PENDING is a skeleton, ERROR is an alert
// with retry, and only a SUCCESSFUL empty list renders "Everyone is on
// track." — an absent or failed read must never read as all-clear. Still
// deliberately absent, as unserveable contract gaps (GAP-02/03/04): the
// Recent activity panel, the avg-reading-score tile, and the role/last-active
// header fields.
function initialsOf(first: string, last: string, email: string): string {
  const initials = `${first.trim().charAt(0)}${last.trim().charAt(0)}`.trim();
  return (initials || email.trim().charAt(0)).toUpperCase();
}

export function TeacherDetailScreen({ documentId }: { documentId: string }) {
  const t = useTranslations('Teachers.detail');
  const tStatus = useTranslations('Teachers.table.status');
  const format = useFormatter();
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
  const [editOpen, setEditOpen] = useState(false);

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
        className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
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
        className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
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
        className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-4 rounded-panel border border-border bg-card p-6 text-center">
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
  const studentsTotal = row.classes.reduce(
    (sum, klass) => sum + (classesById.get(klass.documentId)?.student_count ?? 0),
    0,
  );
  const testATotal = row.classes.reduce(
    (sum, klass) => sum + (participationById.get(klass.documentId)?.test_a.submitted ?? 0),
    0,
  );

  return (
    <main
      data-slot="school-teacher-detail"
      data-surface="school-admin-teacher-detail"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-3">
        <Link
          href="/dashboard/school/teachers"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-body hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('back')}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <AvatarTint
              initials={initialsOf(row.first_name, row.last_name, row.email)}
              tone={getAvatarTone(row.email)}
              size="lg"
            />
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold text-foreground">{displayName}</h1>
                <Badge variant={STATUS_VARIANTS[row.status]}>{tStatus(row.status)}</Badge>
              </div>
              <p className="truncate text-sm text-body">{row.email}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
              {t('editButton')}
            </Button>
            <Button type="button" render={<Link href="/dashboard/school/classes" />}>
              {t('assignButton')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MiniStatTile value={String(row.classes.length)} label={t('stats.classes')} />
        <MiniStatTile value={String(studentsTotal)} label={t('stats.students')} />
        <MiniStatTile value={String(testATotal)} label={t('stats.testA')} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <DataPanel className="lg:col-span-2" aria-label={t('classesPanel.title')}>
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">{t('classesPanel.title')}</h2>
            <span className="text-meta text-body">
              {t('classesPanel.count', { count: row.classes.length })}
            </span>
          </div>
          {row.classes.length === 0 ? (
            <div className="flex flex-col gap-1 border-t border-border px-4 py-6 text-center">
              <p className="text-sm font-semibold text-foreground">{t('classesPanel.emptyTitle')}</p>
              <p className="text-sm text-body">{t('classesPanel.emptyDescription')}</p>
            </div>
          ) : (
            <ul data-slot="teacher-detail-classes">
              {row.classes.map((klass) => {
                const schoolClass = classesById.get(klass.documentId);
                const participation = participationById.get(klass.documentId);
                const facts: string[] = [];
                if (participation) {
                  facts.push(
                    t('classesPanel.completed', {
                      done: participation.test_a.submitted,
                      total: participation.roster_count,
                    }),
                  );
                }
                if (schoolClass) {
                  facts.push(
                    t('classesPanel.students', { count: schoolClass.student_count }),
                  );
                }
                return (
                  <li key={klass.documentId} className="border-t border-border first:border-t-0">
                    <Link
                      href={`/dashboard/school/classes/${klass.documentId}`}
                      aria-label={t('classesPanel.openLabel', { name: klass.name })}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-hover"
                    >
                      {schoolClass?.year_band ? (
                        <Badge variant="outline">{schoolClass.year_band}</Badge>
                      ) : null}
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {klass.name}
                        </span>
                        {facts.length > 0 ? (
                          <span className="truncate text-meta text-body">{facts.join(' · ')}</span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </DataPanel>

        <DataPanel aria-label={t('accountPanel.title')}>
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">{t('accountPanel.title')}</h2>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              {t('accountPanel.edit')}
            </Button>
          </div>
          <dl className="border-t border-border">
            <div className="flex items-baseline justify-between gap-4 px-4 py-3">
              <dt className="text-meta text-body">{t('accountPanel.email')}</dt>
              <dd className="truncate text-sm font-medium text-foreground">{row.email}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-4 border-t border-border px-4 py-3">
              <dt className="text-meta text-body">{t('accountPanel.status')}</dt>
              <dd>
                <Badge variant={STATUS_VARIANTS[row.status]}>{tStatus(row.status)}</Badge>
              </dd>
            </div>
          </dl>
        </DataPanel>
      </div>

      <DataPanel aria-label={t('attention.title')} data-slot="teacher-needs-attention">
        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">{t('attention.title')}</h2>
          <span className="text-meta text-body">{t('attention.subtitle')}</span>
        </div>
        {attentionQuery.isPending ? (
          <div className="border-t border-border px-4 py-5">
            <Skeleton className="h-10 w-full" />
          </div>
        ) : attentionQuery.isError ? (
          <div className="border-t border-border px-4 py-5">
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
          </div>
        ) : (attentionQuery.data?.students.length ?? 0) === 0 ? (
          <div className="border-t border-border px-4 py-6 text-center">
            <p className="text-sm font-semibold text-foreground">{t('attention.empty')}</p>
          </div>
        ) : (
          <ul data-slot="teacher-needs-attention-rows">
            {attentionQuery.data?.students.map((student) => {
              const delta = progressDelta(student.delta);
              return (
                <li
                  key={student.student_document_id}
                  className="border-t border-border first:border-t-0"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {student.display_name}
                      </span>
                      <span className="truncate text-meta text-body">
                        {student.class.name ?? '—'}
                      </span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-body-sm text-body tabular-nums">
                        {t('attention.scores', { from: student.score_a, to: student.score_b })}
                      </span>
                      <ProgressDeltaPill
                        direction={delta.direction}
                        change={format.number(delta.magnitude, { maximumFractionDigits: 0 })}
                      />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DataPanel>

      {editOpen ? <EditTeacherDialog row={row} onClose={() => setEditOpen(false)} /> : null}
    </main>
  );
}
