'use client';

import { Plus, Users } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { AddStudentDialog } from '@/modules/dashboard/components/AddStudentDialog';
import { useStudentsQuery } from '@/modules/dashboard/queries/use-students.query';
import { useDashboardSearchStore } from '@/modules/dashboard/stores/use-dashboard-search.store';

// Dashboard's core section (task 16 list + task 17 add-student dialog + task
// 18 search filter): real students fed by C-STUDENT-LIST, narrowed to the
// dashboard search bar's selection (if any), with the header button and the
// empty state's action both opening the SAME AddStudentDialog instance
// (C-STUDENT-CREATE).
export function StudentsSection() {
  const t = useTranslations('Dashboard');
  const tCommon = useTranslations('Common');
  const format = useFormatter();
  const { data, isLoading, isError, isFetching, refetch } = useStudentsQuery();
  const selectedStudentId = useDashboardSearchStore((state) => state.selectedStudentId);
  const students = (data?.data ?? []).filter(
    (student) => !selectedStudentId || student.documentId === selectedStudentId,
  );
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);

  return (
    <section data-slot="students-section" className="flex flex-col gap-4">
      <div data-slot="students-heading" className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{t('title')}</h2>
          {students.length > 0 ? <Badge variant="accent">{students.length}</Badge> : null}
        </div>
        <Button type="button" size="sm" onClick={() => setIsAddStudentOpen(true)}>
          <Plus aria-hidden="true" className="size-4" />
          {t('addStudent')}
        </Button>
      </div>
      <p className="text-muted-foreground">{t('subtitle')}</p>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : null}

      {!isLoading && isError ? (
        <Alert
          variant="error"
          title={t('studentsError')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={isFetching}
              onClick={() => refetch()}
            >
              {t('retry')}
            </Button>
          }
        >
          {tCommon('errorDescription')}
        </Alert>
      ) : null}

      {!isLoading && !isError && students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('studentsEmptyTitle')}
          description={t('studentsEmptySubtitle')}
          action={
            <Button type="button" onClick={() => setIsAddStudentOpen(true)}>
              <Plus aria-hidden="true" className="size-4" />
              {t('addStudent')}
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && students.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnName')}</TableHead>
              <TableHead>{t('columnYearLevel')}</TableHead>
              <TableHead>{t('columnEmail')}</TableHead>
              <TableHead>{t('columnAdded')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.documentId}>
                <TableCell className="font-medium">
                  {student.given_name} {student.family_name}
                </TableCell>
                <TableCell>{student.year_level ?? '—'}</TableCell>
                <TableCell className={student.email ? undefined : 'text-muted-foreground'}>
                  {student.email ?? '—'}
                </TableCell>
                <TableCell>
                  {format.dateTime(new Date(student.createdAt), { dateStyle: 'medium' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <AddStudentDialog open={isAddStudentOpen} onOpenChange={setIsAddStudentOpen} />
    </section>
  );
}
