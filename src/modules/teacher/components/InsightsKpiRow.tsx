'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { KpiCard } from '@/modules/teacher/components/v2/KpiCard';
import { INSIGHTS_DAY_FORMAT, INSIGHTS_MONTH_FORMAT } from '@/modules/teacher/constants/results.constants';
import { formatDelta } from '@/modules/teacher/lib/teacher-kit';
import type { InsightsKpiRowProps, InsightsKpiTileProps } from '@/modules/teacher/types/class-analytics.types';

// Teaching insights KPI tiles (`:734–742`), every value from `teachingInsights().kpis`
// (the roster plus the class diagnostic). A missing value is the kit's "—", never a number.
function InsightsKpiRow({ kpis }: InsightsKpiRowProps) {
  const t = useTranslations('TeacherPortal.insights');
  const tv = useTranslations('TeacherPortal.viewModel');
  const noValue = useTranslations('TeacherPortal.kit')('noValue');
  const format = useFormatter();
  const { lastSitting, classAverage, upSinceLast, topGap, participation } = kpis;
  const satAt = lastSitting.satAt === null ? null : new Date(lastSitting.satAt);
  const satDay = satAt === null ? null : format.dateTime(satAt, INSIGHTS_DAY_FORMAT);
  const percent = (value: number | null) => (value === null ? noValue : t('percent', { value }));

  return (
    <div data-slot="insights-kpis" className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      <InsightsKpiTile
        kpi="last-sitting"
        dataValue={lastSitting.satAt}
        label={t('kpi.lastSitting')}
        value={satAt === null ? noValue : format.dateTime(satAt, INSIGHTS_MONTH_FORMAT)}
        sub={
          satDay !== null && lastSitting.formCode !== null
            ? t('kpi.lastSittingSub', { form: lastSitting.formCode, date: satDay })
            : satDay
        }
      />
      <InsightsKpiTile
        kpi="class-average"
        dataValue={classAverage}
        label={t('kpi.classAverage')}
        value={percent(classAverage)}
        sub={t('kpi.classAverageSub')}
      />
      <InsightsKpiTile
        kpi="up-since-last"
        dataValue={upSinceLast.value}
        label={t('kpi.upSinceLast')}
        value={
          upSinceLast.value === null
            ? noValue
            : t('kpi.upSinceLastValue', { value: formatDelta(upSinceLast.value, 'signed').text })
        }
        sub={upSinceLast.paired === 0 ? t('kpi.upSinceLastNone') : t('kpi.upSinceLastSub', { count: upSinceLast.paired })}
      />
      <InsightsKpiTile
        kpi="top-gap"
        dataValue={topGap?.skill ?? null}
        label={t('kpi.topGap')}
        value={topGap === null ? noValue : tv(topGap.labelKey)}
        sub={t('kpi.topGapSub')}
      />
      <InsightsKpiTile
        kpi="participation"
        dataValue={participation.percent}
        label={t('kpi.participation')}
        value={percent(participation.percent)}
        sub={t('kpi.participationSub', { scored: participation.scored, total: participation.total })}
      />
    </div>
  );
}

function InsightsKpiTile({ kpi, dataValue, ...card }: InsightsKpiTileProps) {
  return (
    <div data-kpi={kpi} data-value={dataValue ?? undefined} className="min-w-0">
      <KpiCard variant="insight" className="h-full" {...card} />
    </div>
  );
}

export { InsightsKpiRow };
