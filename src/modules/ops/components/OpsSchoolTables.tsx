'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button } from '@/modules/design-system';
import { OpsStaffUsersTable } from '@/modules/ops/components/OpsStaffUsersTable';
import { OpsClassesTab } from '@/modules/ops/components/OpsClassesTab';
import { OpsStudentsTab } from '@/modules/ops/components/OpsStudentsTab';
import { OpsTeachersDialog } from '@/modules/ops/components/OpsTeachersDialog';
import { useTeachersListQuery } from '@/modules/ops/queries/use-teachers-list.query';

import type { OpsSchoolTablesProps } from '@/modules/ops/types/components.types';

// Ops School detail — the four tabular screens (task 024): Admins / Teachers /
// Classes / Students. Same discipline as task 015: only columns and actions a
// real ops endpoint serves are rendered; everything else is omitted and named
// as a contract gap rather than a dead control or a fabricated value.
// OPS-025 moved Admins and Teachers onto the paginated C-OPS-PORTAL-015 read,
// so specialty and last activity are now real served columns; the remaining
// unserved surfaces (bulk bars, Export, Add/Create class) still carry an
// explicit note instead of a button wired to nothing. OPS-045 moved the
// Students tab onto the real C-OPS-PORTAL-035 roster read (OpsStudentsTab).
type Tab = 'admins' | 'teachers' | 'classes' | 'students';

const TAB_ORDER: readonly Tab[] = ['admins', 'teachers', 'classes', 'students'];

export function OpsSchoolTables({ schoolDocumentId }: OpsSchoolTablesProps) {
  const t = useTranslations('Ops.schoolTables');
  const [tab, setTab] = useState<Tab>('admins');
  const [teachersOpen, setTeachersOpen] = useState(false);

  return (
    <section className="flex flex-col gap-4" aria-label={t('title')}>
      <div
        role="tablist"
        aria-label={t('title')}
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {TAB_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              'h-11 flex-none rounded-none border-b-2 -mb-px px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-body hover:text-foreground',
            )}
          >
            {t(`tab.${key}`)}
          </button>
        ))}
      </div>

      {tab === 'admins' ? (
        <AdminsTab schoolDocumentId={schoolDocumentId} />
      ) : tab === 'teachers' ? (
        <TeachersTab schoolDocumentId={schoolDocumentId} onManage={() => setTeachersOpen(true)} />
      ) : tab === 'classes' ? (
        // OPS-038: the real C-OPS-PORTAL-028 list, which includes classes with no
        // teacher — the staff-directory derivation this replaced could not.
        <OpsClassesTab schoolDocumentId={schoolDocumentId} />
      ) : (
        <OpsStudentsTab schoolDocumentId={schoolDocumentId} />
      )}

      <OpsTeachersDialog
        schoolDocumentId={schoolDocumentId}
        open={teachersOpen}
        onOpenChange={setTeachersOpen}
      />
    </section>
  );
}

function AdminsTab({ schoolDocumentId }: { schoolDocumentId: string }) {
  const t = useTranslations('Ops.schoolTables');

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-body">{t('adminsNote')}</p>
      <OpsStaffUsersTable
        schoolDocumentId={schoolDocumentId}
        role="school_admin"
        enabled
        emptyTitle={t('adminsEmptyTitle')}
        emptyDescription={t('adminsEmptyDescription')}
      />
    </div>
  );
}

function TeachersTab({
  schoolDocumentId,
  onManage,
}: {
  schoolDocumentId: string;
  onManage: () => void;
}) {
  const t = useTranslations('Ops.schoolTables');
  // Class membership stays with the staff directory that owns it; the accepted
  // accounts, their status and their real activity come from C-OPS-PORTAL-015.
  // Neither read invents the other's data.
  const teachers = useTeachersListQuery(schoolDocumentId, { page: 1, pageSize: 200 }, true);
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
      </div>
      <OpsStaffUsersTable
        schoolDocumentId={schoolDocumentId}
        role="teacher"
        enabled
        emptyTitle={t('teachersEmptyTitle')}
        emptyDescription={t('teachersEmptyDescription')}
        classCounts={classCounts}
      />
    </div>
  );
}
