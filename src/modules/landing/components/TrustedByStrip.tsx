import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';

async function TrustedByStrip() {
  const t = await getTranslations('Home');

  return (
    <section data-slot="trusted-by" className="py-10">
      <ScrollReveal>
        <Container className="flex flex-col items-center gap-4 text-center">
          <Eyebrow>{t('trustedBy.pilotLabel')}</Eyebrow>
          {/* The client's draft marks this slot explicitly: real pilot evidence replaces it
              once a partner school agrees to be named. Labelling it is deliberate — an
              invented statistic or an invented customer here would be a fabricated claim
              on a real marketing page (the five template wordmarks and the 1,200+ badge
              this strip used to render were exactly that, and are gone). */}
          <span
            data-slot="pilot-evidence-placeholder"
            className="rounded-full bg-surface-inset px-3 py-1 text-meta font-semibold tracking-wide text-body uppercase"
          >
            {t('pilot.pilotEvidence')}
          </span>
          <p className="max-w-2xl text-body-md text-body">{t('trustedBy.pilotCaption')}</p>
        </Container>
      </ScrollReveal>
    </section>
  );
}

export { TrustedByStrip };
