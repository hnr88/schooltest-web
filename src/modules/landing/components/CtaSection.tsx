import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button, Container, Logo, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';

async function CtaSection() {
  const t = await getTranslations('Home');

  return (
    <Section id="cta">
      <Container>
        <ScrollReveal variant="scale">
          <div className="relative overflow-hidden rounded-4xl bg-cta-gradient p-10 sm:p-16">
            <div aria-hidden="true" className="absolute -top-10 -left-12 opacity-10">
              <Logo variant="mark" theme="white" alt="" height={240} />
            </div>
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-cta-title font-bold text-balance text-white">{t('cta.title')}</h2>
              <p className="mt-4 text-base text-blue-100/85">{t('cta.subtitle')}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button variant="white" size="xl" href="#pricing">
                  {t('cta.primary')}
                  <ArrowRight aria-hidden="true" />
                </Button>
                <Button variant="outline-white" size="xl" href="#pricing">
                  {t('cta.secondary')}
                </Button>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { CtaSection };
