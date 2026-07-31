'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';

import { EmptyState } from '@/modules/design-system';

// WYSIWYG progress empty state (task 76, mvp-updates §4.9): the panel is
// visible from first login, unpopulated until Test B results exist - the
// contracted copy ("progress data coming once Test B has been completed")
// comes from the server payload's reason, not from inferred empty arrays.
export function ProgressEmptyState() {
  const t = useTranslations('Teach.progress');

  return (
    <div data-slot="progress-empty-state">
      <EmptyState icon={TrendingUp} title={t('emptyTitle')} description={t('emptyBody')} />
    </div>
  );
}
