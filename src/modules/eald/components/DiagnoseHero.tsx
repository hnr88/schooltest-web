import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button, Container, Eyebrow, Section, StatStrip } from '@/modules/design-system';

async function DiagnoseHero() {
  const t = await getTranslations('Eald');
  return (
    <Section
      id="diagnose-hero"
      className="scroll-mt-24 border-b border-border bg-background pt-9 pb-16 sm:pt-9 sm:pb-16"
    >
      <Container className="max-w-eald sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Eyebrow tone="teal">
              {t('diagnose.hero.componentLabel')} · {t('diagnose.hero.eyebrow')}
            </Eyebrow>
            <h1 className="mt-4 text-display font-bold text-balance text-foreground">
              {t.rich('diagnose.hero.title', {
                blue: (chunks) => <span className="text-blue-600">{chunks}</span>,
              })}
            </h1>
            <div aria-hidden="true" className="mt-5 h-0.75 w-14 rounded-sm bg-teal-600" />
            <p className="mt-5.5 text-lg leading-relaxed text-pretty text-body">
              {t('diagnose.hero.body')}
            </p>
            <div className="mt-7.5 flex flex-wrap gap-3">
              <Button href="/eald#register" className="h-auto rounded-xl px-6 py-3.5">
                {t('diagnose.hero.registerCta')}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
              <Button
                href="/eald/teach"
                variant="outline"
                className="h-auto rounded-xl px-6 py-3.5"
              >
                {t('diagnose.hero.teachCta')}
              </Button>
            </div>
          </div>
          <div className="relative min-h-105 overflow-hidden rounded-2xl bg-muted lg:h-full">
            <Image
              src="/images/diagnose-hero.webp"
              alt={t('diagnose.hero.imageAlt')}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>
        <StatStrip
          ariaLabel={t('diagnose.hero.statsLabel')}
          size="sm"
          className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border *:flex-col-reverse *:gap-2 *:bg-card *:px-6 *:py-5.5 sm:grid-cols-2 lg:grid-cols-4"
          items={[1, 2, 3, 4].map((index) => ({
            label: t(`diagnose.hero.stat${index}Label`),
            value: t(`diagnose.hero.stat${index}Value`),
          }))}
        />
      </Container>
    </Section>
  );
}

export { DiagnoseHero };
