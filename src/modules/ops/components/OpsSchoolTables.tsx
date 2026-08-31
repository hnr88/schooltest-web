'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Users } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, Badge, Button, EmptyState, Skeleton } from '@/modules/design-system';
import { OpsTeachersDialog } from '@/modules/ops/components/OpsTeachersDialog';
import { noValueIfMissing, opsTeacherLabel } from '@/modules/ops/lib/ops-class-detail.helpers';
import { useOpsSchoolAdminsQuery } from '@/modules/ops/queries/use-ops-school-admins.query';
import { useOpsTeachersQuery } from '@/modules/ops/queries/use-ops-teachers.query';

import type { OpsSchoolTablesProps } from '@/modules/ops/types/components.types';

// Ops School detail — the four tabular screens (task 024): Admins / Teachers /
// Classes / Students. Same discipline as task 015: only columns and actions a
// real ops endpoint serves are rendered; everything else is omitted and named
// as a contract gap rather than a dead control or a fabricated value. The
// unserved surfaces (Students tab, bulk bars, Export, "last seen", admin
// classes, class students-count / test-window, Add/Create class) carry an
// explicit note instead of a button wired to nothing.
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
        <ClassesTab schoolDocumentId={schoolDocumentId} />
      ) : (
        <StudentsTab />
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
  const admins = useOpsSchoolAdminsQuery(schoolDocumentId, true);

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-body">{t('adminsNote')}</p>
      {admins.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : admins.isError ? (
        <Alert variant="error" title={t('errorTitle')}>
          {t('errorDescription')}
        </Alert>
      ) : admins.data.length === 0 ? (
        <div className="rounded-card border border-border bg-card px-6 py-6 shadow-sm">
          <EmptyState
            icon={Users}
            tone="brand"
            title={t('adminsEmptyTitle')}
            description={t('adminsEmptyDescription')}
            className="border-none px-0 py-2"
          />
        </div>
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnName')}</TableHead>
              <TableHead>{t('columnEmail')}</TableHead>
              <TableHead>{t('columnRole')}</TableHead>
              <TableHead>{t('columnStatus')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.data.map((admin) => (
              <TableRow key={admin.documentId}>
                <TableCell className="font-medium text-foreground">
                  {noValueIfMissing([admin.first_name, admin.last_name].filter(Boolean).join(' ').trim() || null)}
                </TableCell>
                <TableCell>{noValueIfMissing(admin.email)}</TableCell>
                <TableCell>
                  <Badge variant="default">{admin.role}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={admin.blocked ? 'error' : 'default'}>
                    {admin.blocked ? t('statusSuspended') : t('statusActive')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
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
  const teachers = useOpsTeachersQuery(schoolDocumentId, true);

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-body">{t('teachersNote')}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onManage}>
          {t('manageTeachers')}
        </Button>
      </div>

      {teachers.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : teachers.isError ? (
        <Alert variant="error" title={t('errorTitle')}>
          {t('errorDescription')}
        </Alert>
      ) : teachers.data.length === 0 ? (
        <div className="rounded-card border border-border bg-card px-6 py-6 shadow-sm">
          <EmptyState
            icon={Users}
            tone="brand"
            title={t('teachersEmptyTitle')}
            description={t('teachersEmptyDescription')}
            className="border-none px-0 py-2"
          />
        </div>
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnName')}</TableHead>
              <TableHead>{t('columnEmail')}</TableHead>
              <TableHead>{t('columnClasses')}</TableHead>
              <TableHead>{t('columnStatus')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.data.map((teacher) => (
              <TableRow key={teacher.documentId}>
                <TableCell className="font-medium text-foreground">
                  {opsTeacherLabel(teacher)}
                </TableCell>
                <TableCell>{noValueIfMissing(teacher.email)}</TableCell>
                <TableCell>{String(teacher.classes.length)}</TableCell>
                <TableCell>
                  <Badge variant={teacher.blocked ? 'error' : 'default'}>
                    {teacher.blocked ? t('statusSuspended') : t('statusActive')}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </div>
  );
}

function ClassesTab({ schoolDocumentId }: { schoolDocumentId: string }) {
  const t = useTranslations('Ops.schoolTables');
  const teachers = useOpsTeachersQuery(schoolDocumentId, true);
  const rows = (teachers.data ?? []).flatMap((teacher) =>
    teacher.classes.map((classRow) => ({ classRow, teacher })),
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-body">{t('classesNote')}</p>
      {teachers.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : teachers.isError ? (
        <Alert variant="error" title={t('errorTitle')}>
          {t('errorDescription')}
        </Alert>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-border bg-card px-6 py-6 shadow-sm">
          <EmptyState
            icon={Users}
            tone="brand"
            title={t('classesEmptyTitle')}
            description={t('classesEmptyDescription')}
            className="border-none px-0 py-2"
          />
        </div>
      ) : (
        <DataTable>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnClass')}</TableHead>
              <TableHead>{t('columnTeacher')}</TableHead>
              <TableHead>{t('columnStudents')}</TableHead>
              <TableHead>{t('columnTestWindow')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ classRow, teacher }) => (
              <TableRow key={classRow.documentId}>
                <TableCell className="font-medium text-foreground">
                  {noValueIfMissing(classRow.name)}
                </TableCell>
                <TableCell>{opsTeacherLabel(teacher)}</TableCell>
                <TableCell>{t('notServed')}</TableCell>
                <TableCell>{t('notServed')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </DataTable>
      )}
    </div>
  );
}

function StudentsTab() {
  const t = useTranslations('Ops.schoolTables');
  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-sm text-body">{t('studentsNote')}</p>
      <div className="rounded-card border border-border bg-card px-6 py-6 shadow-sm">
        <EmptyState
          icon={Users}
          tone="brand"
          title={t('studentsEmptyTitle')}
          description={t('studentsEmptyDescription')}
          className="border-none px-0 py-2"
        />
      </div>
    </div>
  );
}

function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-card shadow-sm">
      <Table>{children}</Table>
    </div>
  );
}
