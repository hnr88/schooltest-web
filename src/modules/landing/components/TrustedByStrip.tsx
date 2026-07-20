import { getTranslations } from 'next-intl/server';

import { Container } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';
import { TRUSTED_WORDMARKS } from '@/modules/landing/constants/landing.constants';

async function TrustedByStrip() {
  const t = await getTranslations('Home');

  return (
    <section data-slot="trusted-by" className="py-10">
      <ScrollReveal>
        <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <span className="text-xs font-semibold tracking-widest text-slate-600 uppercase dark:text-slate-400">
            {t('trustedBy.label')}
          </span>
          {TRUSTED_WORDMARKS.map((key) => (
            <span key={key} className="text-lg font-semibold text-slate-600 dark:text-slate-400">
              {t(key)}
            </span>
          ))}
        </Container>
      </ScrollReveal>
    </section>
  );
}

export { TrustedByStrip };
