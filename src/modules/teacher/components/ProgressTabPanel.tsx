'use client';

import { useTranslations } from 'next-intl';

import { ProgressAcaraSection } from '@/modules/teacher/components/ProgressAcaraSection';
import { ProgressSubskillTrends } from '@/modules/teacher/components/ProgressSubskillTrends';
import { ProgressWatchList } from '@/modules/teacher/components/ProgressWatchList';
import { KpiCard } from '@/modules/teacher/components/v2/KpiCard';
import { SectionCard } from '@/modules/teacher/components/v2/SectionCard';
import { PROGRESS_I18N_NAMESPACE } from '@/modules/teacher/constants/progress-tab.constants';
import { PROGRESS_TILE_THRESHOLD } from '@/modules/teacher/constants/v2-thresholds.constants';
import { progressTabView } from '@/modules/teacher/lib/progress-tab';
import type { ProgressTabPanelProps, ProgressTileDisplay } from '@/modules/teacher/types/progress-tab.types';

// Class progress (`Teacher Portal v2.dc.html:873–1002`), from the ONE roster read the class
// detail holds: the tiles and both lists from the server's own deltas, the chart and the
// subskill sparklines from the class average of each sitting the roster history really
// holds. The design's "Subskill mastery shift" table is not drawn: history carries scores,
// not bands, per sitting, so nothing true could fill it.
function ProgressTabPanel({ rows, classDocumentId }: ProgressTabPanelProps) {
  const t = useTranslations(PROGRESS_I18N_NAMESPACE);
  const tKit = useTranslations('TeacherPortal.kit');
  const view = progressTabView(rows);
  const tileValue = (tile: ProgressTileDisplay) => {
    if (tile.text === null) return tKit('noValue');
    return tile.points ? t('points', { value: tile.text }) : tile.text;
  };

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
      <div data-slot="progress-tiles" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        {view.tiles.map((tile) => (
          <KpiCard
            key={tile.id}
            variant="progress"
            tone={tile.tone}
            label={t(`tiles.${tile.id}.label`)}
            value={
              <span data-slot="progress-tile-value" data-tile={tile.id}>
                {tileValue(tile)}
              </span>
            }
            sub={t(`tiles.${tile.id}.sub`, { threshold: PROGRESS_TILE_THRESHOLD })}
          />
        ))}
      </div>
      <SectionCard
        aria-labelledby="progress-chart-heading"
        padding="none"
        className="gap-0 rounded-[12px] px-6 py-[22px]"
      >
        <div className="flex flex-wrap items-stretch gap-6">
          <ProgressAcaraSection chart={view.chart} summary={view.summary} />
          <div className="flex min-w-[min(230px,100%)] flex-[1_1_240px] flex-col gap-3.5">
            <ProgressWatchList variant="gains" movers={view.topProgress} />
            <ProgressWatchList variant="support" movers={view.watch} />
          </div>
        </div>
      </SectionCard>
      {view.trends.length > 0 ? <ProgressSubskillTrends trends={view.trends} /> : null}
      <p className="max-w-[90ch] text-[13px] leading-[1.65] text-[#6B7280]">{t('footnote')}</p>
    </div>
  );
}

export { ProgressTabPanel };
