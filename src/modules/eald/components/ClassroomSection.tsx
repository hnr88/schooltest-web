import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { BarChart, Container, Eyebrow, ScrollReveal, Section } from '@/modules/design-system';
import { TEACH_GROUPING } from '@/modules/eald/constants/components.constants';
import { FigureCard } from '@/modules/eald';

// Teach:124–137 — the photo band with the overlay gradient and the copy +
// callout sitting on it. The design drops the old group chips; the grouping
// basis they gestured at now renders concretely in the chart below (see the
// TeachGroupingSection note and proof/11.md — no key or const entry retired).
async function ClassroomSection() {
  const t = await getTranslations('Eald.teach.classroom');

  return (
    <>
      <Section className="border-y border-border bg-surface-inset">
        <Container className="max-w-7xl">
          <ScrollReveal>
            <div className="relative flex min-h-80 items-end overflow-hidden rounded-4xl bg-navy-900 shadow-xl sm:min-h-96 lg:min-h-140">
              <Image
                src="/images/erika-fletcher-MZxqc6n9qCw-unsplash.jpg"
                alt=""
                fill
                sizes="(min-width: 1380px) 1320px, calc(100vw - 3rem)"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-navy-900/25 via-navy-900/50 to-navy-900/90"
              />

              <div className="relative z-10 max-w-3xl p-10 sm:p-14">
                <Eyebrow tone="teal" className="text-teal-400">
                  {t('eyebrow')}
                </Eyebrow>
                <h2 className="mt-4 text-h2 font-bold text-balance text-white sm:text-4xl">
                  {t('title')}
                </h2>
                <p className="mt-4 max-w-2xl text-body-lg leading-relaxed text-white/90">
                  {t('body')}
                </p>

                <p className="mt-5 text-sm font-bold leading-relaxed text-white">
                  {t.rich('callout', {
                    strong: (chunks) => (
                      <strong className="font-bold">{chunks}</strong>
                    ),
                  })}
                </p>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>

      <TeachGroupingSection />
    </>
  );
}

// Teach:139–206 — "Group by gap": the design's grouped two-series figure from
// task 01's kit, on a numeric axis to a 10-student ceiling (no ACARA bands).
// The heading reuses the relocated teach.classroom.groupCaption; the eyebrow,
// body, track link, aria-label and the top axis label are this task's only
// beyond-budget keys, each with no existing string (decisions.md, tagged 11).
async function TeachGroupingSection() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* min-w-0 lets the grid tracks shrink so the figure's own
              overflow-x-auto scroller engages instead of widening the page. */}
          <div className="min-w-0">
            <ScrollReveal>
              <Eyebrow tone="teal">{t('teach.grouping.eyebrow')}</Eyebrow>
              <h2 className="mt-4 text-h2 font-bold text-balance text-foreground">
                {t('teach.classroom.groupCaption')}
              </h2>
              <p className="mt-5 text-body-lg leading-relaxed text-body">
                {t('teach.grouping.body')}
              </p>
              <Link
                href="/track"
                className="mt-6 inline-flex items-center gap-2 text-body-md font-semibold text-blue-600 transition-colors hover:text-navy-900"
              >
                {t('teach.grouping.trackLink')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </ScrollReveal>
          </div>

          <div className="min-w-0">
            <ScrollReveal delay={120}>
              <FigureCard
                title={t('teach.grouping.figureTitle')}
                context={t('teach.grouping.figureContext')}
                footnote={t('teach.grouping.footnote')}
              >
                <BarChart
                  ariaLabel={t('teach.grouping.ariaLabel')}
                  max={10}
                  series={TEACH_GROUPING.seriesLabelKeys.map((key) => t(key))}
                  bands={[
                    '0',
                    '2',
                    '4',
                    '6',
                    '8',
                    t('teach.grouping.bandMaxStudents'),
                  ]}
                  items={TEACH_GROUPING.categories.map((category) => ({
                    label: t(category.labelKey),
                    value: category.bars[0].value,
                    display: category.bars[0].display,
                    bars: category.bars.map((bar) => ({
                      value: bar.value,
                      display: bar.display,
                    })),
                  }))}
                />
              </FigureCard>
            </ScrollReveal>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export { ClassroomSection };
