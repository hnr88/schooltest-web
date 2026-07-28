import Image from 'next/image';

import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';

async function TrackHero() {
  const t = await getTranslations('Eald.track.hero');

  return (
    <Section className="bg-gradient-to-b from-white to-background py-5 sm:py-6">
      <Container className="max-w-eald">
        <div className="relative flex min-h-72 items-end overflow-hidden rounded-4xl bg-navy-900 shadow-xl sm:min-h-96 lg:min-h-135">
          <Image
            src="/images/azzedine-rouichi-KDM09YR4_bY-unsplash.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1380px) 1320px, calc(100vw - 2.5rem)"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-eald-hero-scrim" />

          <div className="relative z-10 max-w-3xl px-8 py-14 sm:px-12">
            <Eyebrow tone="teal" className="text-teal-400">
              {t('eyebrow')}
            </Eyebrow>
            <h1 className="mt-4 text-display font-bold text-balance text-white text-shadow-lg">
              {t('title')}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/90">
              {t('body')}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export { TrackHero };
