'use client';

import { Plus, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button } from '@/modules/design-system';

import type { StudentsHeaderProps } from '@/modules/school-students/types/components.types';

// School Admin Portal design (VIEW 5, :738-747): the 30px/500 title with the
// 14px #7C8698 subtitle 7px under it, and the two 44px actions right-aligned
// to the title's baseline — "Import students" as the white outline button,
// "Add student" as the solid navy primary. "Add student" stays the only entry
// point to the single-student form at /students/new.
export function StudentsHeader({ studentCount, classCount, onImport }: StudentsHeaderProps) {
  const t = useTranslations('SchoolStudents');

  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div>
        <h1 className="text-[30px] leading-tight font-medium tracking-[-0.02em] text-foreground">
          {t('title')}
        </h1>
        <p className="mt-[7px] text-sm text-[#7C8698]">
          {t('subtitle', { studentCount, classCount })}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl border-[#D8DFEA] px-[18px] text-sm font-semibold text-[#3D4A5C] hover:border-navy-900 hover:text-navy-900 hover:bg-transparent"
          onClick={onImport}
        >
          <Upload className="size-3.5" aria-hidden />
          {t('importButton')}
        </Button>
        <Button
          variant="navy"
          className="h-11 rounded-xl px-5 text-sm font-semibold"
          render={<Link href="/dashboard/school/students/new" />}
        >
          <Plus className="size-4" aria-hidden />
          {t('addButton')}
        </Button>
      </div>
    </div>
  );
}
