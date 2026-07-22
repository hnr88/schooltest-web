import { ClipboardListIcon, FileTextIcon, GaugeIcon, UsersIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { MetricCard } from '@/modules/design-system/components/metric-card';
import { StatCard } from '@/modules/design-system/components/stat-card';

// The two figure rows of the Cards section, split out of cards-section.tsx for the
// 120-line component limit. Both rows stay in one file because they are read as a
// pair: StatCard is the light-only KPI, MetricCard is the same figure with the navy
// account-state variant available.
async function MetricCardsRow() {
  const t = await getTranslations('DesignSystem');
  return (
    <>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={FileTextIcon}
          iconTone="blue"
          label={t('statTests')}
          value="24"
          delta={t('statTestsDelta')}
          deltaTone="positive"
        />
        <StatCard
          icon={UsersIcon}
          iconTone="teal"
          label={t('statStudents')}
          value="312"
          delta={t('statStudentsDelta')}
          deltaTone="positive"
        />
        <StatCard
          icon={GaugeIcon}
          iconTone="navy"
          label={t('statScore')}
          value="8.4"
          progress={84}
        />
      </div>
      {/* MetricCard row, canonical Billing composition: NAVY · white · white. The navy
          card is the account-state figure carrying the account's primary action — see
          THE RULE quoted in constants/metric-card.constants.ts. Exactly one navy per
          row, never two. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <MetricCard
          icon={UsersIcon}
          tone="navy"
          label={t('metricAccountLabel')}
          value="10"
          action={{ href: '/dashboard/children', label: t('metricAccountAction') }}
        />
        <MetricCard
          icon={ClipboardListIcon}
          iconTone="teal"
          label={t('metricPlansLabel')}
          value="5/10"
          delta={t('metricPlansDelta')}
          progress={50}
          progressLabel={t('metricPlansLabel')}
        />
        <MetricCard
          icon={GaugeIcon}
          label={t('metricReadyLabel')}
          value="83%"
          delta={t('statTestsDelta')}
          deltaTone="positive"
        />
      </div>
    </>
  );
}

export { MetricCardsRow };
