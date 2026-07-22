import { Award, CalendarCheck, Pencil, Trash2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import {
  ActivityFeedRow,
  DotActivityRow,
} from '@/modules/design-system/components/activity-feed-row';
import { AvatarStack } from '@/modules/design-system/components/avatar-stack';
import { CompletionCell } from '@/modules/design-system/components/completion-cell';
import { IconButton } from '@/modules/design-system/components/icon-button';
import { PanelHeaderRow } from '@/modules/design-system/components/panel-header-row';
import { RankRow } from '@/modules/design-system/components/rank-row';
import { RowActionsCluster } from '@/modules/design-system/components/row-actions-cluster';
import { StatusPill } from '@/modules/design-system/components/status-pill';
import { UpcomingEventRow } from '@/modules/design-system/components/upcoming-event-row';
import { RecordCharts } from './record-charts';
import { ScrollAffordanceDemo } from './scroll-affordance-demo';

const PANEL = 'flex flex-col gap-3 rounded-panel border border-border bg-card p-5.5 shadow-sm';

async function RecordRows() {
  const t = await getTranslations('DesignSystem');
  const percent = (value: number) => t('primitivePercent', { percent: value });
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className={PANEL}>
        <PanelHeaderRow title={t('recordActivityTitle')} />
        <ActivityFeedRow icon={Award} tone="success" timestamp={t('recordActivityTime')}>
          {t('recordActivity')}
        </ActivityFeedRow>
        <ActivityFeedRow icon={CalendarCheck} timestamp={t('recordActivityTime')}>
          {t('recordActivitySecond')}
        </ActivityFeedRow>
        <DotActivityRow tone="accent">{t('recordDotActivity')}</DotActivityRow>
        <DotActivityRow tone="warning">{t('recordDotActivitySecond')}</DotActivityRow>
      </section>
      <section className={PANEL}>
        <PanelHeaderRow title={t('recordRankTitle')} />
        <RankRow rank={1} name={t('primitivePersonName')} initials="EH" score={percent(94)} />
        <RankRow rank={2} name={t('recordRankTwo')} initials="LH" score={percent(88)} tone="teal" />
        <RankRow
          rank={3}
          name={t('recordRankThree')}
          initials="MA"
          score={percent(81)}
          tone="violet"
        />
      </section>
      <RecordCharts />
      <section className={PANEL}>
        <PanelHeaderRow
          title={t('recordRosterTitle')}
          action={
            <RowActionsCluster>
              <IconButton icon={Pencil} label={t('dropdownEdit')} size="sm" />
              <IconButton icon={Trash2} label={t('dropdownDelete')} size="sm" tone="danger" />
            </RowActionsCluster>
          }
        />
        <CompletionCell
          value={71}
          display={t('recordCompletionValue')}
          ariaLabel={t('recordCompletionLabel')}
        />
        <AvatarStack
          ariaLabel={t('recordStackLabel')}
          entries={[
            { initials: 'EH' },
            { initials: 'LH', tone: 'teal' },
            { initials: 'MA', tone: 'violet' },
            { initials: 'JS', tone: 'amber' },
            { initials: 'RB', tone: 'pink' },
          ]}
        />
        <UpcomingEventRow
          month={t('recordEventMonth')}
          day={t('recordEventDay')}
          title={t('recordEventTitle')}
          meta={t('recordEventMeta')}
          trailing={<StatusPill tone="info">{t('badgeScheduled')}</StatusPill>}
        />
      </section>
      <ScrollAffordanceDemo />
    </div>
  );
}

export { RecordRows };
