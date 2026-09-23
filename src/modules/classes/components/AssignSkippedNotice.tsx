'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Alert } from '@/modules/design-system';

// BUG-006 follow-up: with an invited teacher picked, the bulk assign SKIPS every
// selected class that already has a teacher (it never removes them) and names
// those classes here before anything is sent.
export function AssignSkippedNotice({ classNames }: { classNames: readonly string[] }) {
  const t = useTranslations('Classes.assignTeachers');
  const format = useFormatter();
  if (classNames.length === 0) return null;
  return (
    <div className="px-7 pb-4" data-slot="assign-teachers-skipped">
      <Alert variant="warning" title={t('skippedTitle', { count: classNames.length })}>
        {t('skippedDescription', { classes: format.list(classNames) })}
      </Alert>
    </div>
  );
}
