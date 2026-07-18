import { ArrowRight, Play } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Badge, Button, Container, Section } from '@/modules/design-system';
import { HeroFlow } from '@/modules/landing/components/HeroFlow';

async function HeroSection() {
  const t = await getTranslations('Home');

  return (
    <Section className="bg-gradient-to-b from-white to-background py-5 sm:py-6">
      <div className="mx-auto w-full max-w-hero px-5">
        <div className="relative overflow-hidden rounded-4xl bg-navy-900 shadow-xl">
          <Image
            src="/brand/hero-field.webp"
            alt={t('hero.imageAlt')}
            fill
            priority
            sizes="(min-width: 1380px) 1320px, calc(100vw - 2.5rem)"
            className="object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-hero-scrim" />
          <div className="relative flex min-h-150 flex-col items-center justify-center gap-6 px-6 py-16 text-center sm:px-12 sm:py-20">
            <Badge className="h-auto gap-2 bg-white/10 px-4 py-1.5 text-white ring-1 ring-white/20">
              <span aria-hidden="true" className="size-1.5 rounded-full bg-teal-400" />
              {t('hero.badge')}
            </Badge>
            <h1 className="max-w-3xl text-display font-bold text-balance text-white text-shadow-lg">
              {t.rich('hero.title', { br: () => <br /> })}
            </h1>
            <p className="max-w-xl text-lg text-blue-100/90 text-shadow-sm">{t('hero.subtitle')}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button size="xl" href="#pricing">
                {t('hero.primaryCta')}
                <ArrowRight aria-hidden="true" />
              </Button>
              <Button variant="white" size="xl" href="#product">
                <Play aria-hidden="true" />
                {t('hero.secondaryCta')}
              </Button>
            </div>
            <p className="text-sm text-blue-100/80">{t('hero.microcopy')}</p>
          </div>
        </div>
        <Container>
          <HeroFlow />
        </Container>
      </div>
    </Section>
  );
}

export { HeroSection };
