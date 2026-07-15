import { ArrowRight, Check, Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { AssessmentPreview } from '@/modules/landing/components/AssessmentPreview';

export async function LandingHero() {
  const t = await getTranslations('Home');
  const benefits = [t('benefits.adaptive'), t('benefits.skills'), t('benefits.progress')];

  return (
    <main id="main-content" tabIndex={-1}>
      <section className="relative isolate overflow-hidden px-6 py-12 sm:py-16 lg:px-8 lg:py-24">
        <span aria-hidden className="absolute top-16 -left-24 size-64 rounded-full bg-rausch-50" />
        <span
          aria-hidden
          className="absolute -right-16 bottom-16 size-48 rounded-full bg-babu-50"
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div id="why-schooltest" className="flex flex-col items-start gap-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-semibold text-rausch-600 shadow-sm">
                <Sparkles aria-hidden className="size-4" />
                {t('eyebrow')}
              </p>
              <div className="flex max-w-xl flex-col gap-5">
                <h1 className="text-display font-semibold tracking-tight text-ink">
                  {t('heroTitle')}
                </h1>
                <p className="max-w-lg text-lg leading-8 text-ink-muted">{t('heroDescription')}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#assessment-preview"
                  className="inline-flex items-center gap-2 rounded-full bg-rausch-500 px-6 py-4 text-sm font-semibold text-on-rausch hover:bg-rausch-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rausch-500"
                >
                  {t('primaryCta')}
                  <ArrowRight aria-hidden className="size-4" />
                </a>
                <a
                  href="#what-to-expect"
                  className="inline-flex items-center gap-2 rounded-full border border-divider bg-background px-6 py-4 text-sm font-semibold text-ink hover:bg-rausch-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rausch-500"
                >
                  {t('secondaryCta')}
                </a>
              </div>
              <p className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted">
                <Check aria-hidden className="size-4 text-babu-700" strokeWidth={3} />
                {t('trust')}
              </p>
            </div>

            <div id="assessment-preview" className="scroll-mt-8">
              <AssessmentPreview />
            </div>
          </div>

          <ul
            id="what-to-expect"
            className="grid gap-3 rounded-3xl border border-divider bg-background p-4 md:grid-cols-3"
            aria-label={t('benefits.label')}
          >
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-center gap-3 rounded-2xl bg-canvas p-4 text-sm leading-6 font-medium text-ink"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-babu-50 text-babu-700">
                  <Check aria-hidden className="size-4" strokeWidth={3} />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
