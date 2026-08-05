'use client';

import { Plus, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button } from '@/modules/design-system';

import type { StudentsHeaderProps } from '@/modules/school-students/types/components.types';

// Spec §4 header: the roster totals in the subtitle and the accent import CTA.
// "Add student" stays alongside it as the secondary path — it is the only entry
// point to the single-student form at /students/new.
export function StudentsHeader({ studentCount, classCount, onImport }: StudentsHeaderProps) {
  const t = useTranslations('SchoolStudents');

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('title')}</h1>
        <p className="text-sm text-body">{t('subtitle', { studentCount, classCount })}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" variant="outline" render={<Link href="/dashboard/school/students/new" />}>
          <Plus className="size-4" aria-hidden />
          {t('addButton')}
        </Button>
        <Button type="button" size="lg" variant="accent" onClick={onImport}>
          <Upload className="size-4" aria-hidden />
          {t('importButton')}
        </Button>
      </div>
    </div>
  );
}
