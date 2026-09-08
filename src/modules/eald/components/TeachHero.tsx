import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Button, Section, StatStrip } from '@/modules/design-system';

// Teach:67–91 — the navy hero panel beside the photo, and the four-cell fact
// table on the StatStrip primitive. The h1 keeps its t.rich blue chunk (the
// catalogue copy is unchanged); only the chunk's tint is retuned for the dark
// panel. Photo alt stays empty: the copy carries the meaning, the image is
// presentational.
async function TeachHero() {
  const t = await getTranslations('Eald');

  return (
    <Section className="py-0">
      <div className="grid lg:grid-cols-2">
        <div className="flex justify-end bg-navy-950">
          <div className="w-full max-w-2xl px-6 py-14 sm:px-12">
            <p className="text-xs font-bold uppercase tracking-eyebrow text-teal-300">
              {t('teach.hero.eyebrow')}
            </p>
            <h1 className="mt-4 text-display font-bold text-balance text-white">
              {t.rich('teach.hero.title', {
                blue: (chunks) => (
                  <span className="text-blue-300">{chunks}</span>
                ),
              })}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-navy-soft">
              {t('teach.hero.body')}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="xl" href="/#register">
                {t('teach.hero.primaryCta')}
                <ArrowRight aria-hidden="true" />
              </Button>
              <Button variant="outline-white" size="xl" href="/diagnose">
                {t('teach.hero.secondaryCta')}
              </Button>
            </div>
          </div>
        </div>

        <div className="relative min-h-80 lg:min-h-0">
          <Image
            src="/images/university-of-mobile-ZPkG0EdWQa8-unsplash.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="border-y border-border bg-surface-inset">
        <div className="mx-auto max-w-eald px-5 sm:px-8">
          <StatStrip
            ariaLabel={t('teach.hero.eyebrow')}
            className="grid grid-cols-1 gap-x-8 gap-y-4 py-6 sm:grid-cols-2 lg:grid-cols-4"
            items={[
              { label: t('teach.hero.statExportLabel'), value: t('teach.hero.statExportValue') },
              { label: t('teach.hero.statNamesLabel'), value: t('teach.hero.statNamesValue') },
              { label: t('teach.hero.statGroupingLabel'), value: t('teach.hero.statGroupingValue') },
              { label: t('teach.hero.statAiLabel'), value: t('teach.hero.statAiValue') },
            ]}
          />
        </div>
      </div>
    </Section>
  );
}

export { TeachHero };
