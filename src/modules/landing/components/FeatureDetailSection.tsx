import { Check } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';
import { AiFeedbackCard } from '@/modules/landing/components/AiFeedbackCard';
import { FEATURE_CHECKLIST } from '@/modules/landing/constants/landing.constants';

async function FeatureDetailSection() {
  const t = await getTranslations('Home');

  return (
    <Section id="ai-feedback" className="bg-white dark:bg-background">
      <Container className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <Eyebrow tone="teal">{t('featureDetail.eyebrow')}</Eyebrow>
          <h3 className="mt-3 text-h2 font-bold text-balance">
            {t('featureDetail.title')}
          </h3>
          <p className="mt-4 text-muted-foreground">{t('featureDetail.description')}</p>
          <ul className="mt-6 flex flex-col gap-3">
            {FEATURE_CHECKLIST.map((key) => (
              <li key={key} className="flex items-center gap-2.5">
                <Check
                  aria-hidden="true"
                  strokeWidth={2.75}
                  className="size-4 shrink-0 text-green-600 dark:text-green-400"
                />
                <span className="text-sm font-medium">{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
        <AiFeedbackCard />
      </Container>
    </Section>
  );
}

export { FeatureDetailSection };
