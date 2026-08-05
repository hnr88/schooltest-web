'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import type { SchoolStudentsPagination } from '@/modules/school-students/types/school-students.types';

import type { StudentsPaginationProps } from '@/modules/school-students/types/components.types';

// C-CHD-01 pager: previous/next within meta.pagination bounds. Rendered only
// when more than one page exists.
export function StudentsPagination({ pagination, onPage }: StudentsPaginationProps) {
  const t = useTranslations('SchoolStudents.pagination');
  const { page, pageCount } = pagination;

  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        {t('previous')}
      </Button>
      <p className="text-sm text-body">{t('pageOf', { page, pageCount })}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPage(page + 1)}
      >
        {t('next')}
      </Button>
    </div>
  );
}
