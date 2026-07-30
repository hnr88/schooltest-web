'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { ClassRowActions } from '@/modules/classes/components/ClassRowActions';
import { isYearBand } from '@/modules/classes/constants/year-bands.constants';
import type { SchoolClass } from '@/modules/classes/types/classes.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from '@/modules/design-system';

interface ClassesTableProps {
  rows: SchoolClass[];
  onEdit: (schoolClass: SchoolClass) => void;
}

function teacherName(firstName: string | null, lastName: string | null): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim();
}

// C-CLS-01 roster: name, year band chip, teacher chips and the live student
// count. Dumb renderer — edit/delete wiring lives in ClassRowActions.
export function ClassesTable({ rows, onEdit }: ClassesTableProps) {
  const t = useTranslations('Classes.table');
  const tb = useTranslations('Classes.yearBands');

  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('columnName')}</TableHead>
            <TableHead>{t('columnYearBand')}</TableHead>
            <TableHead>{t('columnTeachers')}</TableHead>
            <TableHead>{t('columnStudents')}</TableHead>
            <TableHead className="text-right">
              <span className="sr-only">{t('columnActions')}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.documentId}>
              <TableCell className="font-medium">
                <Link
                  href={`/dashboard/school/classes/${row.documentId}`}
                  className="rounded-sm underline-offset-4 transition-colors duration-150 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  {row.name}
                </Link>
              </TableCell>
              <TableCell>
                {row.year_band
                  ? isYearBand(row.year_band)
                    ? tb(row.year_band)
                    : row.year_band
                  : t('yearBandNone')}
              </TableCell>
              <TableCell>
                {row.teachers.length === 0 ? (
                  <span className="text-muted-foreground">{t('teachersNone')}</span>
                ) : (
                  <span className="flex flex-wrap gap-1.5">
                    {row.teachers.map((teacher) => (
                      <Tag
                        key={teacher.documentId}
                        label={teacherName(teacher.first_name, teacher.last_name)}
                      />
                    ))}
                  </span>
                )}
              </TableCell>
              <TableCell>{row.student_count}</TableCell>
              <TableCell className="text-right">
                <ClassRowActions schoolClass={row} onEdit={() => onEdit(row)} />
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                {t('empty')}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
