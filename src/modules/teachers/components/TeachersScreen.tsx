'use client';

import { UserRoundPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Alert, Button, Skeleton } from '@/modules/design-system';
import { InviteTeacherDialog } from '@/modules/teachers/components/InviteTeacherDialog';
import { TeachersTable } from '@/modules/teachers/components/TeachersTable';
import { useStaffRows } from '@/modules/teachers/hooks/use-staff-rows';
import { useInvitationsQuery } from '@/modules/teachers/queries/use-invitations.query';
import { useTeachersQuery } from '@/modules/teachers/queries/use-teachers.query';

// School admin Teachers screen (task 23, st-mvp-pivot): the merged staff +
// invitations table (C-TCH-01 + C-INV-02) with the invite dialog (C-INV-01).
// Row actions (reissue/revoke/deactivate/reactivate) live in the table rows.
export function TeachersScreen() {
  const t = useTranslations('Teachers');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const teachersQuery = useTeachersQuery(enabled);
  const invitationsQuery = useInvitationsQuery(enabled);
  const rows = useStaffRows(teachersQuery.data, invitationsQuery.data);
  const [inviteOpen, setInviteOpen] = useState(false);

  const isPending = !enabled || teachersQuery.isPending || invitationsQuery.isPending;
  const isError = teachersQuery.isError || invitationsQuery.isError;
  const refetch = () => {
    void teachersQuery.refetch();
    void invitationsQuery.refetch();
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
          <p className="text-sm text-body">{t('description')}</p>
        </div>
        <Button size="lg" onClick={() => setInviteOpen(true)}>
          <UserRoundPlus className="size-4" aria-hidden />
          {t('inviteButton')}
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
