'use client';

import { UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Button, EmptyState } from '@/modules/design-system';

import type { ClassStudentsEmptyProps } from '@/modules/classes/types/components.types';

// Spec §1 empty state — replaces the old "No active children at your school
// yet" copy. Both actions are real: the import opens this class's CSV flow, and
// "Add student" goes to the existing student-create page.
export function ClassStudentsEmpty({ onImport }: ClassStudentsEmptyProps) {
  const t = useTranslations('Classes.detail.empty');

  return (
    <EmptyState
      icon={UsersIcon}
      title={t('title')}
      description={t('description')}
      action={
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" size="lg" variant="accent" onClick={onImport}>
            {t('import')}
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/dashboard/school/students/new" />}>
            {t('addStudent')}
          </Button>
        </div>
      }
    />
  );
}
