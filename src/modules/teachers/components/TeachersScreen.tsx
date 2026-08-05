'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuthStore } from '@/modules/auth';
import { useSchoolClassesQuery } from '@/modules/classes';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { useParticipationQuery } from '@/modules/school-admin';
import { InviteTeacherDialog } from '@/modules/teachers/components/InviteTeacherDialog';
import { TeachersTable } from '@/modules/teachers/components/TeachersTable';
import { useStaffRows } from '@/modules/teachers/hooks/use-staff-rows';
import { useInvitationsQuery } from '@/modules/teachers/queries/use-invitations.query';
import { useTeachersQuery } from '@/modules/teachers/queries/use-teachers.query';

// School admin Teachers screen (task 23, st-mvp-pivot): the merged staff +
// invitations table (C-TCH-01 + C-INV-02) with the add dialog (C-INV-01). Row
// actions (edit/remove/reissue/revoke/deactivate/reactivate) live in the rows.
// The subtitle counts live staff ACCOUNTS only — an invitation is a person who
// has not joined yet — and waits for the real count rather than showing a zero.
//
// Two supporting reads join the roster: C-CLS-01 completes the Classes column
// (C-TCH-01 only groups by the singular class owner) and C-RPT-04 answers
// whether removing someone touches reporting. Neither is fatal — only the staff
// and invitation reads can empty this screen — but both are awaited so the
// Classes column and the removal warning are right the first time they render.
export function TeachersScreen() {
  const t = useTranslations('Teachers');
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
  const [inviteOpen, setInviteOpen] = useState(false);

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

  return (
    <main
      data-slot="school-teachers"
      data-surface="school-admin-teachers"
      className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
          {isPending ? <Skeleton className="h-4 w-48" /> : null}
          {!isPending && !isError ? (
            <p className="text-sm text-body">
              {t('subtitle', { count: teachersQuery.data?.length ?? 0 })}
            </p>
          ) : null}
        </div>
        <Button size="lg" onClick={() => setInviteOpen(true)}>
          <Plus className="size-4" aria-hidden />
          {t('addButton')}
        </Button>
      </div>
      {isPending ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
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
      ) : (
        <TeachersTable rows={rows} />
      )}
      <InviteTeacherDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </main>
  );
}
