import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { Link } from '@/i18n/navigation';
import { Badge, BarChart, Container, ScrollReveal, Section } from '@/modules/design-system';
import { HOME_EVIDENCE_CHART, STATS } from '@/modules/eald/constants/components.constants';
import { FigureCard } from '@/modules/eald';

async function ProofSection() {
  const t = await getTranslations('Eald');
  const chart = HOME_EVIDENCE_CHART;

  return (
    <>
      {/* Home v2:211–277 — the progress chart, anchored #evidence so the
          masthead's "Evidence base" link lands here below the sticky header.
          scroll-mt-24 follows the repo convention (RegisterSection), not the
          design export's inline 20px artifact. */}
      <Section id="evidence" className="scroll-mt-24">
        <Container className="max-w-eald">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-bold tracking-wider text-teal-600 uppercase">
                {t('home.evidenceChart.eyebrow')}
              </p>
              <h2 className="mt-3.5 text-balance text-3xl font-bold tracking-tight text-navy-900">
                {t('home.evidenceChart.heading')}
              </h2>
              <p className="mt-5 max-w-prose text-body-md leading-relaxed text-body">
                {t('home.evidenceChart.bodyOne')}
              </p>
              <p className="mt-3.5 max-w-prose text-body-md leading-relaxed text-body">
                {t('home.evidenceChart.bodyTwo')}
              </p>
              <Link
                href="/track"
                className="mt-6 inline-flex items-center gap-2 text-body-md font-semibold text-blue-600 transition-colors hover:text-navy-900"
              >
                {t('home.evidenceChart.trackLink')}
                <ArrowRight aria-hidden="true" />
              </Link>
            </div>
            <FigureCard
              title={t('home.evidenceChart.figureTitle')}
              context={t('home.evidenceChart.figureContext')}
              footnote={t('home.evidenceChart.footnote')}
            >
              <BarChart
                ariaLabel={t('home.evidenceChart.ariaLabel')}
                max={100}
                series={chart.seriesLabelKeys.map((key) => t(key))}
                bands={chart.bandLabelKeys.map((key) => t(key))}
                items={chart.categories.map((category) => {
                  const top = category.bars[category.bars.length - 1];
                  return {
                    label: t(category.labelKey),
                    value: top.value,
                    display: top.display,
                    current: true,
                    bars: category.bars.map((bar) => ({ value: bar.value, display: bar.display })),
                  };
                })}
              />
            </FigureCard>
          </div>
        </Container>
      </Section>
      {/* Home v2:279–295 — the navy Evidence base band; the four cells are the
          STATS this component already fed, keys and values unchanged (D-02). */}
      <Section>
        <Container className="max-w-eald">
          <ScrollReveal>
            <div className="rounded-4xl bg-navy-800 p-10 sm:p-12">
              <div className="grid items-end gap-8 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-bold tracking-wider text-teal-400 uppercase">
                    {t('nav.evidence')}
                  </p>
                  <h2 className="mt-3.5">
                    <Badge
                      variant="outline"
                      // `max-w-full whitespace-normal` overrides the primitive's nowrap
                      // + w-fit: at 375px this badge's copy is wider than the column and
                      // pushed the whole page 8px sideways.
                      className="h-auto max-w-full rounded-full border-white/25 px-4 py-1.5 text-body-sm font-semibold whitespace-normal text-white"
                    >
                      {t('home.proof.badge')}
                    </Badge>
                  </h2>
                </div>
                <p className="max-w-prose text-body-sm leading-relaxed text-navy-muted">
                  {t('home.evidenceChart.bandIntro')}
                </p>
              </div>
              <div className="mt-9 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
                {STATS.map((stat) => (
                  <div key={stat.valueKey} className="bg-navy-900 p-6">
                    <p className="text-2xl font-bold tracking-tight text-white">
                      {t(stat.valueKey)}
                    </p>
                    <p className="mt-2 text-body-sm leading-relaxed text-navy-muted">
                      {t(stat.labelKey)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </Section>
    </>
  );
}

export { ProofSection };
