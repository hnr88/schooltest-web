import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, FeatureCard, Section } from '@/modules/design-system';
import {
  BarChartIcon,
  FileTextIcon,
  SparklesIcon,
} from '@/modules/landing/components/LandingIcons';

async function FeaturesSection() {
  const t = await getTranslations('Home');

  return (
    <Section id="product" className="bg-white dark:bg-background">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <Eyebrow>{t('features.eyebrow')}</Eyebrow>
          <h2 className="mt-3 text-h1 font-bold text-balance">
            {t('features.title')}
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={FileTextIcon}
            tone="light"
            title={t('features.questionTypes.title')}
            description={t('features.questionTypes.description')}
            className="bg-background transition hover:-translate-y-0.75 hover:shadow-lg"
          />
          <FeatureCard
            icon={SparklesIcon}
            tone="navy"
            title={t('features.aiGrading.title')}
            description={t('features.aiGrading.description')}
            className="transition hover:-translate-y-0.75 hover:shadow-xl"
          />
          <FeatureCard
            icon={BarChartIcon}
            tone="light"
            title={t('features.analytics.title')}
            description={t('features.analytics.description')}
            className="bg-background transition hover:-translate-y-0.75 hover:shadow-lg"
          />
        </div>
      </Container>
    </Section>
  );
}

export { FeaturesSection };
