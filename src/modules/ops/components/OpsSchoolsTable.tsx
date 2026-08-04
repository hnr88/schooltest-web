'use client';

import { useTranslations } from 'next-intl';

import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import {
  Alert,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import { OpsSchoolRow } from '@/modules/ops/components/OpsSchoolRow';
import { useOpsSchoolsQuery } from '@/modules/ops/queries/use-ops-schools.query';

// Ops console schools screen (task 66, st-mvp-pivot): the C-OPS-01 cross-school
// table — name, lifecycle chips and the live teacher/class/student/result
// counts, each row linking to the school detail.
export function OpsSchoolsTable() {
  const t = useTranslations('Ops.schools');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const schoolsQuery = useOpsSchoolsQuery(hydrated && Boolean(token));

  if (schoolsQuery.isPending) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-64 w-full" />
      </main>
    );
  }

  if (schoolsQuery.isError) {
    return (
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={schoolsQuery.isFetching}
              onClick={() => schoolsQuery.refetch()}
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

  const schools = schoolsQuery.data;

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
      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('columnName')}</TableHead>
              <TableHead>{t('columnAccountStatus')}</TableHead>
              <TableHead>{t('columnOnboarding')}</TableHead>
              <TableHead>{t('columnTeachers')}</TableHead>
              <TableHead>{t('columnClasses')}</TableHead>
              <TableHead>{t('columnStudents')}</TableHead>
              <TableHead>{t('columnResults')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map((school) => (
              <OpsSchoolRow key={school.documentId} school={school} />
            ))}
            {schools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {t('empty')}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
