import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';

async function PredictHero() {
  const t = await getTranslations('Eald');

  return (
    <Section className="bg-gradient-to-b from-white to-background pt-16 sm:pt-20">
      <Container className="max-w-eald">
        <div className="grid items-end gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>{t('predict.hero.eyebrow')}</Eyebrow>
            <h1 className="mt-4 text-display font-bold tracking-tight text-balance text-foreground">
              {t.rich('predict.hero.title', {
                blue: (chunks) => (
                  <span className="text-blue-600">{chunks}</span>
                ),
              })}
            </h1>
          </div>
          <p className="text-lg leading-relaxed text-body">
            {t('predict.hero.body')}
          </p>
        </div>
      </Container>

      <div className="mx-auto mt-12 max-w-7xl px-6">
        <div className="relative flex min-h-96 items-end overflow-hidden rounded-4xl bg-navy-900 shadow-xl">
          <Image
            src="/images/sangga-rima-roman-selia-bgQgAKagQB4-unsplash.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1380px) 1320px, calc(100vw - 3rem)"
            className="object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-navy-900/10 via-navy-900/35 to-navy-900/70"
          />
          <div className="relative z-10 flex flex-wrap gap-12 p-10 sm:p-12">
            <div>
              <p className="text-4xl font-bold tracking-tight text-white">
                {t('predict.hero.domainsValue')}
              </p>
              <p className="mt-1 text-sm text-blue-200">
                {t('predict.hero.domainsLabel')}
              </p>
            </div>
            <div>
              <p className="text-4xl font-bold tracking-tight text-teal-400">
                {t('predict.hero.termValue')}
              </p>
              <p className="mt-1 text-sm text-blue-200">
                {t('predict.hero.termLabel')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export { PredictHero };
