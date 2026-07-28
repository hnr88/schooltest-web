import { getTranslations } from 'next-intl/server';

import { Button, Container } from '@/modules/design-system';

async function EaldCtaBand() {
  const t = await getTranslations('Eald');

  return (
    <Container className="max-w-eald">
      <div className="rounded-4xl bg-navy-promo p-12 text-center sm:p-16">
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
    </Container>
  );
}

export { EaldCtaBand };
