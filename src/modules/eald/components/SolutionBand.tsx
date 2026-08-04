import { getTranslations } from 'next-intl/server';

import { Container, Logo, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';

async function SolutionBand() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <ScrollReveal variant="scale">
          <div className="relative overflow-hidden rounded-4xl bg-navy-900 p-12 text-center sm:p-16">
            <div aria-hidden="true" className="absolute -right-10 -bottom-12 opacity-10">
              <Logo variant="mark" theme="white" alt="" height={220} />
            </div>
            <p className="text-body-md font-semibold text-navy-muted">
              {t('home.solution.intro')}
            </p>
            <p className="mx-auto mt-4 max-w-3xl text-flow font-bold text-white">
              {t('home.solution.body')}
            </p>
            <p className="mt-4 text-body-md text-navy-muted">
              {t('home.solution.tagline')}
            </p>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { SolutionBand };
