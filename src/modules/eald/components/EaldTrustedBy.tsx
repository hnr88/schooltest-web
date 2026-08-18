import { getTranslations } from 'next-intl/server';

import { Container } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';

async function EaldTrustedBy() {
  const t = await getTranslations('Eald');

  return (
    <section data-slot="eald-trusted-by" className="py-8 sm:py-12">
      <ScrollReveal>
        <Container className="max-w-eald text-center">
          <p className="text-xs font-semibold tracking-eyebrow text-slate-400 uppercase">
            {t('home.trustedBy.label')}
          </p>
          {/* Honest by design (same rule as the landing TrustedByStrip): no school
              is listed as a pilot partner until it agrees to be named. The three
              real Australian school names this band used to render were invented
              pilot claims about real schools, and are gone. */}
          <span
            data-slot="pilot-evidence-placeholder"
            className="mt-4 inline-block rounded-full bg-surface-inset px-3 py-1 text-meta font-semibold tracking-wide text-body uppercase"
          >
            {t('home.trustedBy.placeholder')}
          </span>
        </Container>
      </ScrollReveal>
    </section>
  );
}

export { EaldTrustedBy };
