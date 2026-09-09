'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { OpsStaffUsersTable } from '@/modules/ops/components/OpsStaffUsersTable';
import { useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';

/**
 * ops/12 (D-29): moved verbatim out of OpsSchoolTables.tsx so tasks 15-18 and
 * 25 own one tab file each.
 */
export function OpsTeachersTab({
  schoolDocumentId,
  active,
  onManage,
  onInvite,
}: {
  schoolDocumentId: string;
  active: boolean;
  onManage: () => void;
  onInvite: () => void;
}) {
  const t = useTranslations('Ops.schoolTables');
  // Class membership stays with the staff directory that owns it; the accepted
  // accounts, their status and their real activity come from C-OPS-PORTAL-015.
  // Neither read invents the other's data. The query only runs while its own
  // tab is selected, so opening the page does not fetch four tabs' worth.
  const teachers = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, active);
  const classCounts = Object.fromEntries(
    (teachers.data?.data ?? []).map((teacher) => [teacher.documentId, teacher.classes.length]),
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-body">{t('teachersNote')}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onManage}>
          {t('manageTeachers')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          data-testid="ops-teachers-invite"
          onClick={onInvite}
        >
          {t('inviteStaff')}
        </Button>
      </div>
      <OpsStaffUsersTable
        schoolDocumentId={schoolDocumentId}
        role="teacher"
        enabled={active}
        emptyTitle={t('teachersEmptyTitle')}
        emptyDescription={t('teachersEmptyDescription')}
        classCounts={classCounts}
      />
    </div>
  );
}
