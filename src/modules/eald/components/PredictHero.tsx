import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button, Container, Eyebrow, Section, StatStrip } from '@/modules/design-system';

async function PredictHero() {
  const t = await getTranslations('Eald');
  return (
    <Section
      id="predict-hero"
      className="scroll-mt-24 border-b border-border bg-muted pt-10 pb-0 sm:pt-10 sm:pb-0"
    >
      <Container className="max-w-eald pb-15 sm:px-8">
        <Eyebrow tone="teal">
          {t('predict.hero.componentLabel')} · {t('predict.hero.eyebrow')}
        </Eyebrow>
        <h1 className="mt-4 max-w-3xl text-display font-bold text-balance text-foreground">
          {t.rich('predict.hero.title', {
            blue: (chunks) => <span className="text-blue-600">{chunks}</span>,
          })}
        </h1>
        <div aria-hidden="true" className="mt-5 h-0.75 w-14 rounded-sm bg-teal-600" />
        <p className="mt-5.5 max-w-2xl text-lg leading-relaxed text-pretty text-body">
          {t('predict.hero.body')}
        </p>
        <div className="mt-7.5 flex flex-wrap gap-3">
          <Button href="/#register" className="h-auto rounded-xl px-6 py-3.5 whitespace-normal">
            {t('diagnose.hero.registerCta')}
            <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
          </Button>
          <Button
            href="/track"
            variant="outline"
            className="h-auto rounded-xl px-6 py-3.5 whitespace-normal"
          >
            {t('predict.hero.trackCta')}
          </Button>
        </div>
        <StatStrip
          ariaLabel={t('predict.hero.eyebrow')}
          className="mt-8"
          size="sm"
          items={[
            { value: t('predict.hero.domainsValue'), label: t('predict.hero.domainsLabel') },
            { value: t('predict.hero.termValue'), label: t('predict.hero.termLabel') },
          ]}
        />
      </Container>
      <div className="relative h-85 w-full overflow-hidden">
        <Image
          src="/images/diagnose-hero.webp"
          alt={t('diagnose.hero.imageAlt')}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
    </Section>
  );
}

export { PredictHero };
