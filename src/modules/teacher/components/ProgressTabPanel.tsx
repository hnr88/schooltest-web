'use client';

import { useTranslations } from 'next-intl';

import { ProgressClassAnalysis } from '@/modules/teacher/components/ProgressClassAnalysis';
import { ProgressDotMap } from '@/modules/teacher/components/ProgressDotMap';
import { ProgressGainsCards } from '@/modules/teacher/components/ProgressGainsCards';
import { ProgressSubskillGrowth } from '@/modules/teacher/components/ProgressSubskillGrowth';
import { PROGRESS_I18N_NAMESPACE } from '@/modules/teacher/constants/progress-tab.constants';
import { progressTabView } from '@/modules/teacher/lib/progress-tab';
import type { ProgressTabPanelProps } from '@/modules/teacher/types/progress-tab.types';

/**
 * Spec 03 — the rebuilt Class progress tab body (§3): heading, the §3b dot map,
 * the §3c gains cards, the §3d subskill growth chips and the §3e coming-soon
 * class analysis. The retired tiles / chart / watch-lists / subskill trends are
 * gone from this composition; their components stay in the tree for reference.
 */
function ProgressTabPanel({ rows, classDocumentId }: ProgressTabPanelProps) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const view = progressTabView(rows);

  return (
    <div
      data-slot="class-progress"
      data-status={view.status}
      data-sittings={view.sittings}
      data-class-id={classDocumentId}
      className="flex flex-col gap-[18px] leading-[normal]"
    >
      <div>
        <h2 className="text-[20px] font-semibold text-navy-900">{t('title')}</h2>
        <p className="mt-1.5 text-[13.5px] text-[#6B7280]">{t('subtitle', { count: view.sittings })}</p>
      </div>
      <ProgressDotMap dotMap={view.dotMap} />
      <ProgressGainsCards top={view.gainTop} low={view.gainLow} />
      <ProgressSubskillGrowth maps={view.subMap} />
      <ProgressClassAnalysis counts={view.analysis} />
    </div>
  );
}

export { ProgressTabPanel };
