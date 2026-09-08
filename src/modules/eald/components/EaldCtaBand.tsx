import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button, Container, Eyebrow, ScrollReveal, Section } from '@/modules/design-system';

async function EaldCtaBand() {
  const t = await getTranslations('Eald');

  return (
    <Section className="bg-navy-900">
      <Container className="max-w-eald">
        <ScrollReveal variant="scale">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <Eyebrow tone="teal" className="text-teal-300">
                {t('home.register.foundingEyebrow')}
              </Eyebrow>
              <h2 className="mt-3.5 max-w-2xl text-h2 font-bold text-balance text-white">
                {t('shared.cta.title')}
              </h2>
              <p className="mt-4 max-w-xl text-body-lg text-navy-body">
                {t('shared.cta.body')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <Button size="xl" href="/#register">
                {t('shared.cta.button')}
                <ArrowRight aria-hidden="true" />
              </Button>
              <Button size="xl" variant="outline-white" href="/#evidence">
                {t('shared.cta.secondary')}
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { EaldCtaBand };
