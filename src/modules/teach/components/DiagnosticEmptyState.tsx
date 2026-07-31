'use client';

import { useTranslations } from 'next-intl';
import { LayoutGrid, Users } from 'lucide-react';

import { EmptyState } from '@/modules/design-system';

// WYSIWYG empty state (task 75, mvp-updates §4.9 "what you see is what you
// get"): from first login the teacher sees the full dashboard shape — both
// panels present but unpopulated until Test A results exist.
export function DiagnosticEmptyState() {
  const t = useTranslations('Teach.diagnostic');

  return (
    <div data-slot="diagnostic-empty-state" className="flex flex-col gap-6">
      <section className="flex flex-col gap-3" aria-label={t('masteryTitle')}>
        <h2 className="text-lg font-semibold text-foreground">{t('masteryTitle')}</h2>
        <p className="max-w-xl text-sm text-body">{t('masteryDescription')}</p>
        <EmptyState
          icon={Users}
          title={t('emptyMasteryTitle')}
          description={t('emptyMasteryBody')}
        />
      </section>
      <section className="flex flex-col gap-3" aria-label={t('heatmapTitle')}>
        <h3 className="text-base font-semibold text-foreground">{t('heatmapTitle')}</h3>
        <p className="max-w-xl text-sm text-body">{t('heatmapDescription')}</p>
        <EmptyState
          icon={LayoutGrid}
          title={t('emptyHeatmapTitle')}
          description={t('emptyHeatmapBody')}
        />
      </section>
    </div>
  );
}
