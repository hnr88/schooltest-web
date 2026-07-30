'use client';

import { useTranslations } from 'next-intl';

import { Alert } from '@/modules/design-system';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/modules/design-system';
import type { ViewAsTeacher } from '@/modules/ops/schemas/surfaces.schema';

interface OpsViewAsTeacherDataProps {
  view: ViewAsTeacher;
}

/** Display name for the banner: "Vee Twentyone", falling back to the email. */
function teacherName(view: ViewAsTeacher): string {
  const name = [view.teacher.first_name, view.teacher.last_name]
    .filter((part): part is string => Boolean(part))
    .join(' ');
  return name !== '' ? name : (view.teacher.email ?? view.teacher.documentId);
}

// Read-only rendering of the view-as-teacher payload (task 70, C-OPS-04):
// the recording banner, then the teacher's exact classes and sittings. The
// per-sitting monitor payloads travel in the same response; the board itself
// stays on the teacher surfaces.
export function OpsViewAsTeacherData({ view }: OpsViewAsTeacherDataProps) {
  const t = useTranslations('Ops.tools.viewAs');

  return (
    <div className="flex flex-col gap-4" data-surface="ops-view-as-teacher-data">
      <Alert variant="warning" title={t('title')}>
        {t('banner', { name: teacherName(view) })}
      </Alert>
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-foreground">{t('classesHeading')}</h3>
        {view.classes.length === 0 ? (
          <p className="text-sm text-body">{t('emptyClasses')}</p>
        ) : (
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columnName')}</TableHead>
                  <TableHead>{t('columnYearBand')}</TableHead>
                  <TableHead>{t('columnStudents')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.classes.map((row) => (
                  <TableRow key={row.documentId}>
                    <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                    <TableCell>{row.year_band ?? '-'}</TableCell>
                    <TableCell>{row.student_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-semibold text-foreground">{t('sittingsHeading')}</h3>
        {view.sittings.length === 0 ? (
          <p className="text-sm text-body">{t('emptySittings')}</p>
        ) : (
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('columnCode')}</TableHead>
                  <TableHead>{t('columnStatus')}</TableHead>
                  <TableHead>{t('columnClass')}</TableHead>
                  <TableHead>{t('columnForm')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.sittings.map((row) => (
                  <TableRow key={row.documentId}>
                    <TableCell className="font-medium text-foreground">
                      {row.code ?? row.documentId}
                    </TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.class?.name ?? '-'}</TableCell>
                    <TableCell>{row.form?.form_code ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
