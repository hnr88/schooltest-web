import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';
import { TRUSTED_WORDMARKS } from '@/modules/landing/constants/landing.constants';

async function TrustedByStrip() {
  const t = await getTranslations('Home');

  return (
    <section data-slot="trusted-by" className="py-10">
      <ScrollReveal>
        <Container className="flex flex-col items-center gap-4 text-center">
          <Eyebrow>{t('trustedBy.pilotLabel')}</Eyebrow>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <span className="text-meta font-semibold tracking-overline text-slate-600 uppercase dark:text-slate-400">
              {t('trustedBy.label')}
            </span>
            {TRUSTED_WORDMARKS.map((key) => (
              <span key={key} className="text-body-lg font-bold text-slate-600 dark:text-slate-400">
                {t(key)}
              </span>
            ))}
          </div>
          {/* The client's draft marks this slot explicitly: real pilot evidence replaces it
              once a partner school agrees to be named. Labelling it is deliberate — an
              invented statistic here would be a fabricated claim on a real marketing page. */}
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
