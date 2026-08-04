import { getTranslations } from 'next-intl/server';

import { Container } from '@/modules/design-system';
import { EALD_TRUSTED_SCHOOLS } from '@/modules/eald/constants/eald.constants';
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
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:gap-x-10">
            {EALD_TRUSTED_SCHOOLS.map((key) => (
              <span
                key={key}
                className="text-body-md font-bold whitespace-nowrap text-slate-300 sm:text-body-lg"
              >
                {t(`home.${key}`)}
              </span>
            ))}
          </div>
        </Container>
      </ScrollReveal>
    </section>
  );
}

export { EaldTrustedBy };
