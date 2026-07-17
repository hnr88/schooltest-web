import { ArrowRight, Play } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Badge, Button, Container, Section } from '@/modules/design-system';
import { HeroFlow } from '@/modules/landing/components/HeroFlow';

async function HeroSection() {
  const t = await getTranslations('Home');

  return (
    <main id="main-content">
      <Section className="py-6 sm:py-8">
        <Container>
          <div className="relative overflow-hidden rounded-4xl bg-navy-900 shadow-xl">
            <Image
              src="/brand/hero-field.webp"
              alt={t('hero.imageAlt')}
              fill
              priority
              sizes="(min-width: 1248px) 1152px, calc(100vw - 3rem)"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-r from-navy-950/90 via-navy-900/70 to-navy-900/40"
            />
            <div className="relative flex min-h-150 flex-col items-center justify-center gap-6 px-6 py-16 text-center sm:px-12 sm:py-20">
              <Badge className="h-auto bg-white/10 px-4 py-1.5 text-white ring-1 ring-white/20">
                {t('hero.badge')}
              </Badge>
              <h1 className="max-w-3xl text-display font-bold text-balance text-white">
                {t.rich('hero.title', { br: () => <br /> })}
              </h1>
              <p className="max-w-xl text-lg text-blue-100/90">{t('hero.subtitle')}</p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button variant="white" size="xl" render={<a href="#pricing" />}>
                  {t('hero.primaryCta')}
                  <ArrowRight aria-hidden="true" />
                </Button>
                <Button variant="outline-white" size="xl" render={<a href="#product" />}>
                  <Play aria-hidden="true" />
                  {t('hero.secondaryCta')}
                </Button>
              </div>
              <p className="text-sm text-blue-100/80">{t('hero.microcopy')}</p>
            </div>
            <HeroFlow />
          </div>
        </Container>
      </Section>
    </main>
  );
}

export { HeroSection };
