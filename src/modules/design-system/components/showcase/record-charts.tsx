import { getTranslations } from 'next-intl/server';

import { BarChart } from '@/modules/design-system/components/bar-chart';
import { PanelHeaderRow } from '@/modules/design-system/components/panel-header-row';
import { ScoreProgressRow } from '@/modules/design-system/components/score-progress-row';
import { SkillBreakdownRow } from '@/modules/design-system/components/skill-breakdown-row';
import { Sparkline } from '@/modules/design-system/components/sparkline';

const PANEL = 'flex flex-col gap-3 rounded-panel border border-border bg-card p-5.5 shadow-sm';

async function RecordCharts() {
  const t = await getTranslations('DesignSystem');
  const percent = (value: number) => t('primitivePercent', { percent: value });
  return (
    <>
      <section className={PANEL}>
        <PanelHeaderRow title={t('recordScoreTitle')} />
        <ScoreProgressRow label={t('primitiveSubjectMath')} value={91} display={percent(91)} />
        <ScoreProgressRow
          label={t('primitiveSubjectEnglish')}
          value={62}
          display={percent(62)}
          tone="warning"
          orientation="stacked"
        />
        <SkillBreakdownRow
          label={t('recordSkillListening')}
          value={88}
          verdict={t('recordVerdictMastered')}
          tone="mastered"
        />
        <SkillBreakdownRow
          label={t('recordSkillReading')}
          value={54}
          verdict={t('recordVerdictEmerging')}
          tone="emerging"
        />
        <SkillBreakdownRow
          label={t('recordSkillWriting')}
          value={null}
          verdict={t('recordVerdictNotAssessed')}
        />
      </section>
      <section className={PANEL}>
        <PanelHeaderRow title={t('recordChartTitle')} />
        <BarChart
          ariaLabel={t('recordChartTitle')}
          items={[
            { label: t('recordMonthMar'), value: 62, display: percent(62) },
            { label: t('recordMonthApr'), value: 71, display: percent(71) },
            { label: t('recordMonthMay'), value: 68, display: percent(68) },
            { label: t('recordMonthJun'), value: 84, display: percent(84) },
            { label: t('recordMonthJul'), value: 91, display: percent(91), current: true },
          ]}
        />
        <Sparkline points={[62, 71, 68, 84, 91]} ariaLabel={t('recordTrendLabel')} />
      </section>
    </>
  );
}

export { RecordCharts };
