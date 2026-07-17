import { ClipboardListIcon, FileTextIcon, GaugeIcon, SparklesIcon, UsersIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/modules/design-system/components/badge';
import { Button } from '@/modules/design-system/components/button';
import { EmptyState } from '@/modules/design-system/components/empty-state';
import { FeatureCard } from '@/modules/design-system/components/feature-card';
import { Section } from '@/modules/design-system/components/layout';
import { StatCard } from '@/modules/design-system/components/stat-card';

async function CardsSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="cards">
      <h2 className="text-2xl font-bold tracking-tight">{t('sectionCards')}</h2>
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
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <FeatureCard
          icon={SparklesIcon}
          tone="light"
          title={t('featureDemoTitle')}
          description={t('featureDemoBody')}
        />
        <FeatureCard
          icon={SparklesIcon}
          tone="navy"
          title={t('featureDemoTitle')}
          description={t('featureDemoBody')}
        />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('tableCaption')}</CardTitle>
            <CardDescription>{t('tabsOverviewPanel')}</CardDescription>
            <CardAction>
              <Badge variant="accent">{t('tagGrade')}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>{t('emptyBody')}</CardContent>
          <CardFooter className="gap-2">
            <Button variant="outline" size="sm">
              {t('buttonCancel')}
            </Button>
            <Button size="sm">{t('buttonSave')}</Button>
          </CardFooter>
        </Card>
        <EmptyState
          icon={ClipboardListIcon}
          title={t('emptyTitle')}
          description={t('emptyBody')}
          action={<Button>{t('emptyAction')}</Button>}
        />
      </div>
    </Section>
  );
}

export { CardsSection };
