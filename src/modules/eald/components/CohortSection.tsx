import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { BarChart, Container, Eyebrow, Section } from '@/modules/design-system';
import { PREDICT_COHORT } from '@/modules/eald/constants/components.constants';

import { FigureCard } from './FigureCard';

async function CohortSection() {
  const t = await getTranslations('Eald');
  const chart = PREDICT_COHORT;
  return (
    <>
      <Section id="cohort" className="scroll-mt-24 border-y border-border bg-muted">
        <Container className="max-w-eald sm:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <Eyebrow tone="teal">{t('predict.cohort.eyebrow')}</Eyebrow>
              <h2 className="mt-3.5 text-h2 font-bold text-balance text-foreground">
                {t('predict.cohort.title')}
              </h2>
              <p className="mt-5 text-body-lg leading-relaxed text-pretty text-body">
                {t('predict.cohort.body')}
              </p>
              <div className="mt-5.5 flex flex-wrap gap-2.5">
                <span className="rounded-lg border border-border bg-card px-3.5 py-2 text-meta font-semibold text-foreground">
                  {t('predict.cohort.cohortBadge')}
                </span>
                <span className="rounded-lg border border-teal-100 bg-teal-50 px-3.5 py-2 text-meta font-bold text-teal-700">
                  {t('predict.cohort.exitBadge')}
                </span>
              </div>
              <p className="mt-5.5 rounded-2xl border border-teal-100 bg-teal-50 px-4.5 py-4 text-body-md text-foreground">
                {t.rich('predict.cohort.callout', {
                  strong: (chunks) => <strong className="font-bold">{chunks}</strong>,
                })}
              </p>
            </div>
            <FigureCard
              title={t('predict.cohort.figureTitle')}
              context={t('predict.cohort.figureContext')}
              footnote={t('predict.cohort.figureFootnote')}
            >
              <BarChart
                ariaLabel={t('predict.cohort.figureAriaLabel')}
                max={10}
                series={[t('predict.individual.term1Label'), t('predict.individual.term3Label')]}
                bands={['0', '2', '4', '6', '8', t('predict.cohort.figureAxisCeiling')]}
                items={chart.map((category) => ({
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
      <Section id="cohort-photo" className="scroll-mt-24 bg-card">
        <Container className="max-w-eald sm:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <figure className="flex h-full min-w-0 flex-col">
              <div className="relative min-h-90 flex-1 overflow-hidden rounded-2xl">
                <Image
                  src="/images/diagnose-classroom.jpg"
                  alt={t('diagnose.sameScore.imageAlt')}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-2.5 text-meta text-muted-foreground">
                {t('predict.cohort.photoCaption')}
              </figcaption>
            </figure>
            <div>
              <Eyebrow tone="teal">{t('predict.cohort.photoEyebrow')}</Eyebrow>
              <h2 className="mt-3.5 text-h2 font-bold text-balance text-foreground">
                {t('predict.cohort.photoTitle')}
              </h2>
              <div aria-hidden="true" className="mt-4.5 h-0.75 w-14 rounded-sm bg-teal-600" />
              <p className="mt-5.5 text-body-lg leading-relaxed text-pretty text-body">
                {t('predict.cohort.photoBody')}
              </p>
              <Link
                href="/diagnose"
                className="mt-5.5 inline-flex items-center gap-2 text-body-md font-semibold text-blue-700 hover:underline"
              >
                {t('predict.cohort.photoLink')}
                <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

export { CohortSection };
