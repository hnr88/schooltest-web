import { getTranslations } from 'next-intl/server';

import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

import { Section } from '@/modules/design-system/components/layout';
import { ProgressBar } from '@/modules/design-system/components/progress-bar';

async function FeedbackSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="feedback">
      <h2 className="text-2xl font-bold tracking-tight">{t('sectionFeedback')}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ProgressBar value={62} tone="solid" ariaLabel={t('progressLabel')} />
          <ProgressBar value={84} tone="gradient" ariaLabel={t('progressLabel')} />
          <Progress value={62} aria-label={t('progressLabel')}>
            <ProgressLabel>{t('progressLabel')}</ProgressLabel>
            <ProgressValue />
          </Progress>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Spinner aria-label={t('spinnerLabel')} />
        </div>
      </div>
    </Section>
  );
}

export { FeedbackSection };
