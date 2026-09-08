import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { BarChart, Container, Eyebrow, Section } from '@/modules/design-system';
import { DIAGNOSE_COMPARISON } from '@/modules/eald/constants/eald.constants';

import { FigureCard } from './FigureCard';

async function SameScoreSection() {
  const t = await getTranslations('Eald');
  const chart = DIAGNOSE_COMPARISON;
  return (
    <>
      <Section id="same-score" className="scroll-mt-24 border-y border-border bg-muted py-18">
        <Container className="max-w-eald sm:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <figure className="flex h-full min-w-0 flex-col">
              <div className="relative min-h-95 flex-1 overflow-hidden rounded-2xl">
                <Image
                  src="/images/diagnose-classroom.jpg"
                  alt={t('diagnose.sameScore.imageAlt')}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-2.5 text-meta text-muted-foreground">
                {t('diagnose.sameScore.caption')}
              </figcaption>
            </figure>
            <div>
              <Eyebrow tone="teal">{t('diagnose.sameScore.eyebrow')}</Eyebrow>
              <h2 className="mt-3.5 text-h2 font-bold text-balance text-foreground">
                {t.rich('diagnose.sameScore.title', { br: () => <br /> })}
              </h2>
              <div aria-hidden="true" className="mt-4.5 h-0.75 w-14 rounded-sm bg-teal-600" />
              <p className="mt-5.5 text-body-lg leading-relaxed text-pretty text-body">
                {t('diagnose.sameScore.body')}
              </p>
              <p className="mt-5.5 rounded-2xl border border-teal-100 bg-teal-50 px-4.5 py-4 text-body-md text-foreground">
                {t.rich('diagnose.sameScore.callout', {
                  strong: (chunks) => <strong className="font-bold">{chunks}</strong>,
                })}
              </p>
            </div>
          </div>
        </Container>
      </Section>
      <Section id="profile-comparison" className="scroll-mt-24 py-18">
        <Container className="max-w-eald sm:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <Eyebrow tone="teal">{t('diagnose.comparison.eyebrow')}</Eyebrow>
              <h2 className="mt-3.5 text-h2 font-bold text-balance text-foreground">
                {t('diagnose.comparison.title')}
              </h2>
              <p className="mt-5 text-body-lg leading-relaxed text-pretty text-body">
                {t('diagnose.comparison.bodyOne')}
              </p>
              <p className="mt-3.5 text-body-lg leading-relaxed text-pretty text-body">
                {t('diagnose.comparison.bodyTwo')}
              </p>
            </div>
            <FigureCard
              title={t('diagnose.comparison.figureTitle')}
              context={t('diagnose.comparison.figureContext')}
              footnote={t('diagnose.comparison.footnote')}
            >
              <BarChart
                ariaLabel={t('diagnose.comparison.ariaLabel')}
                max={100}
                series={chart.seriesKeys.map((key) => t(key))}
                bands={chart.bandKeys.map((key) => t(key))}
                items={chart.categories.map((category) => ({
                  label: t(category.labelKey),
                  value: category.values[0],
                  display: String(category.values[0]),
                  bars: category.values.map((value) => ({ value, display: String(value) })),
                }))}
              />
            </FigureCard>
          </div>
        </Container>
      </Section>
    </>
  );
}

export { SameScoreSection };
