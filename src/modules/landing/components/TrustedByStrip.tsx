import { getTranslations } from 'next-intl/server';

import { Container } from '@/modules/design-system';
import { TRUSTED_WORDMARKS } from '@/modules/landing/constants/landing.constants';

async function TrustedByStrip() {
  const t = await getTranslations('Home');

  return (
    <section className="py-10">
      <Container className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {t('trustedBy.label')}
        </span>
        {TRUSTED_WORDMARKS.map((key) => (
          <span key={key} className="text-lg font-semibold text-muted-foreground/70">
            {t(key)}
          </span>
        ))}
      </Container>
    </section>
  );
}

export { TrustedByStrip };
