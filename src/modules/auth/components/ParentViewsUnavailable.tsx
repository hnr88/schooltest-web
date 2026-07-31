'use client';

import { Hourglass } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';

// Task 46 (st-mvp-pivot): the single "not part of this release" state a parent
// sees while PARENT_VIEWS_ENABLED is off. The parent portal is masked, never
// deleted — flipping the flag restores every route without touching this copy.
export function ParentViewsUnavailable() {
  const t = useTranslations('Auth.parentViewsUnavailable');

  return (
    <main
      data-slot="parent-views-unavailable"
      className="flex flex-1 items-center justify-center px-6 py-16"
    >
      <EmptyState icon={Hourglass} title={t('title')} description={t('body')} />
    </main>
  );
}
