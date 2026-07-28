import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Button, Container, Eyebrow, Section } from '@/modules/design-system';

async function TeachHero() {
  const t = await getTranslations('Eald');

  return (
    <Section className="bg-gradient-to-b from-white to-background pt-16 sm:pt-20">
      <Container className="max-w-eald">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>{t('teach.hero.eyebrow')}</Eyebrow>
            <h1 className="mt-4 text-display font-bold tracking-tight text-balance text-foreground">
              {t.rich('teach.hero.title', {
                blue: (chunks) => (
                  <span className="text-blue-600">{chunks}</span>
                ),
              })}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-body">
              {t('teach.hero.body')}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="xl" href="/#register">
                {t('teach.hero.primaryCta')}
              </Button>
              <Button variant="outline" size="xl" href="/eald/diagnose">
                {t('teach.hero.secondaryCta')}
              </Button>
            </div>
          </div>

          <div className="relative min-h-64 overflow-hidden rounded-4xl bg-navy-900 shadow-xl sm:min-h-80 lg:min-h-120">
            <Image
              src="/images/university-of-mobile-ZPkG0EdWQa8-unsplash.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-navy-900/10 via-navy-900/35 to-navy-900/70"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}

export { TeachHero };
