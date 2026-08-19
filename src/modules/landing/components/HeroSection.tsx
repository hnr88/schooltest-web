import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Button, Container, Section } from '@/modules/design-system';
import { HeroFlow } from '@/modules/landing/components/HeroFlow';
import { PlayIcon } from '@/modules/landing/components/LandingIcons';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';

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
            {/* The "Trusted by 1,200+ schools and language centers" badge was REMOVED here.
                It was a fabricated customer statistic rendering on a real public marketing page.
                Commit 4820898's subject claims it removed "the 1,200+ badge" — it did NOT: that
                commit never touched this file and the badge stayed live for three more hours.
                No count of schools goes back on this page until someone can name the source of
                the number. Same rule as TrustedByStrip and EaldTrustedBy. */}
            <h1 className="max-w-3xl text-display font-bold text-balance text-white text-shadow-lg">
              {t.rich('hero.title', { br: () => <br /> })}
            </h1>
            <p className="max-w-xl text-lg text-white text-shadow-sm">{t('hero.subtitle')}</p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button size="xl" href="#pricing">
                {t('hero.primaryCta')}
                <ArrowRight aria-hidden="true" />
              </Button>
              <Button variant="white" size="xl" href="#product">
                <PlayIcon />
                {t('hero.secondaryCta')}
              </Button>
            </div>
            <p className="text-sm text-white">{t('hero.microcopy')}</p>
          </div>
        </div>
        <Container>
          <ScrollReveal delay={80}>
            <HeroFlow className="pt-16 sm:pt-24" />
          </ScrollReveal>
        </Container>
      </div>
    </Section>
  );
}

export { HeroSection };
