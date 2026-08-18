import { getTranslations } from 'next-intl/server';

import { Button, Container, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';

async function EaldCtaBand() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <ScrollReveal variant="scale">
          <div className="rounded-4xl bg-navy-promo p-10 text-center sm:p-16">
            <h2 className="text-h2 font-bold text-white">
              {t('shared.cta.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-blue-200">
              {t('shared.cta.body')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="xl" href="/eald#register">
                {t('shared.cta.button')}
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { EaldCtaBand };
