import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';

async function DiagnoseHero() {
  const t = await getTranslations('Eald');

  return (
    <Section className="bg-gradient-to-b from-white to-background py-0 sm:py-0">
      <Container className="max-w-eald pt-16 text-center">
        <Eyebrow>{t('diagnose.hero.eyebrow')}</Eyebrow>

        <h1 className="mx-auto mt-4 max-w-3xl text-display font-bold text-balance text-foreground">
          {t.rich('diagnose.hero.title', {
            blue: (chunks) => <span className="text-blue-600">{chunks}</span>,
          })}
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg text-body">
          {t('diagnose.hero.body')}
        </p>
      </Container>

      <Container className="max-w-hero mt-12">
        <div className="relative min-h-64 overflow-hidden rounded-4xl bg-navy-900 shadow-xl sm:min-h-80 lg:min-h-115">
          <Image
            src="/images/kaleb-tapp-1deQbU6DhBg-unsplash.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1380px) 1320px, calc(100vw - 2.5rem)"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-eald-hero-scrim"
          />
        </div>
      </Container>
    </Section>
  );
}

export { DiagnoseHero };
