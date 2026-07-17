import { getTranslations } from 'next-intl/server';

import { Card, Container, Eyebrow, Section } from '@/modules/design-system';
import { TestimonialCard } from '@/modules/landing/components/TestimonialCard';
import { HOW_IT_WORKS_STEPS } from '@/modules/landing/constants/landing.constants';

async function HowItWorksSection() {
  const t = await getTranslations('Home');

  return (
    <Section id="for-schools">
      <Container className="grid gap-6 lg:grid-cols-2">
        <Card className="p-8">
          <Eyebrow>{t('howItWorks.eyebrow')}</Eyebrow>
          <ol className="mt-2 flex flex-col gap-6">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <li key={step.titleKey} className="flex items-start gap-4">
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-50 text-sm font-bold text-blue-600"
                >
                  {index + 1}
                </span>
                <div>
                  <p className="text-base font-semibold">{t(step.titleKey)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t(step.descriptionKey)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <TestimonialCard />
      </Container>
    </Section>
  );
}

export { HowItWorksSection };
