'use client';

import { Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button, EmptyState } from '@/modules/design-system';

// C-UI-MYCHILDREN empty state (§13.5): Users icon, "No children yet", CTA to the
// add-student wizard.
export function ChildrenEmptyState() {
  const t = useTranslations('Children');

  return (
    <EmptyState
      icon={Users}
      title={t('emptyTitle')}
      description={t('emptyDescription')}
      action={
        <Button href="/dashboard/children/new">
          <Plus aria-hidden="true" className="size-4" />
          {t('addStudent')}
        </Button>
      }
    />
  );
}
