import { getTranslations } from 'next-intl/server';

import { Card, Container, Eyebrow, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';
import { TestimonialCard } from '@/modules/landing/components/TestimonialCard';
import { HOW_IT_WORKS_STEPS } from '@/modules/landing/constants/landing.constants';

async function HowItWorksSection() {
  const t = await getTranslations('Home');

  return (
    <Section id="for-schools">
      <Container className="grid gap-6 lg:grid-cols-2">
        <ScrollReveal>
          <Card className="rounded-3xl bg-background p-8 sm:p-9">
            <Eyebrow>{t('howItWorks.eyebrow')}</Eyebrow>
            <ol className="mt-2 flex flex-col gap-6">
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <li key={step.titleKey} className="flex items-start gap-4.5">
                  <span
                    aria-hidden="true"
                    className="grid size-9 shrink-0 place-items-center rounded-lg bg-blue-600 text-button font-bold text-white"
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-panel-title font-bold">{t(step.titleKey)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{t(step.descriptionKey)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </ScrollReveal>
        <ScrollReveal delay={100} variant="scale">
          <TestimonialCard />
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { HowItWorksSection };
