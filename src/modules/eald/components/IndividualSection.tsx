import { getTranslations } from 'next-intl/server';

import { Container, DataPanel, Eyebrow, PanelHeaderRow, Section } from '@/modules/design-system';
import type { ReadinessCardProps } from '@/modules/eald/types/components.types';

async function IndividualSection() {
  const t = await getTranslations('Eald');
  return (
    <Section id="individual" className="scroll-mt-24 bg-card">
      <Container className="max-w-eald sm:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Eyebrow tone="teal">{t('predict.individual.eyebrow')}</Eyebrow>
            <h2 className="mt-3.5 text-h2 font-bold text-balance text-foreground">
              {t('predict.individual.title')}
            </h2>
            <div aria-hidden="true" className="mt-4.5 h-0.75 w-14 rounded-sm bg-teal-600" />
            <p className="mt-5.5 text-body-lg leading-relaxed text-pretty text-body">
              {t('predict.individual.body')}
            </p>
            <p className="mt-5.5 rounded-2xl border border-teal-100 bg-teal-50 px-4.5 py-4 text-body-md text-foreground">
              {t.rich('predict.individual.callout', {
                strong: (chunks) => <strong className="font-bold">{chunks}</strong>,
              })}
            </p>
          </div>
          <ReadinessCard
            label={t('predict.individual.readinessLabel')}
            term1Label={t('predict.individual.term1Label')}
            term1Value={t('predict.individual.term1Value')}
            term3Label={t('predict.individual.term3Label')}
            term3Value={t('predict.individual.term3Value')}
            footer={t('predict.individual.readinessFooter')}
          />
        </div>
      </Container>
    </Section>
  );
}

async function ReadinessCard({
  label,
  term1Label,
  term1Value,
  term3Label,
  term3Value,
  footer,
}: ReadinessCardProps) {
  const t = await getTranslations('Eald.predict.individual');
  return (
    <DataPanel className="min-w-0">
      <PanelHeaderRow
        title={`${label} · ${t('oneStudent')}`}
        action={<span className="text-meta text-muted-foreground">{t('yearLabel')}</span>}
        as="span"
        className="border-b border-border bg-muted px-6 py-4.5"
      />
      <div className="grid grid-cols-2 gap-px bg-border">
        <div className="bg-card px-6 py-6.5">
          <p className="text-meta font-semibold text-muted-foreground">{term1Label}</p>
          <p className="mt-1 text-stat-xl font-bold text-muted-foreground">{term1Value}</p>
        </div>
        <div className="bg-card px-6 py-6.5">
          <p className="text-meta font-semibold text-blue-600">{term3Label}</p>
          <p className="mt-1 text-stat-xl font-bold text-foreground">{term3Value}</p>
        </div>
      </div>
      <div className="border-t border-border px-6 py-5">
        <p className="text-overline font-bold text-muted-foreground uppercase">
          {t('blockingTitle')}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['blockingVocabulary', 'blockingWriting'].map((key) => (
            <span
              key={key}
              className="rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-1.75 text-meta font-semibold text-navy-800"
            >
              {t(key)}
            </span>
          ))}
        </div>
      </div>
      <p className="border-t border-border px-6 py-3.5 text-meta text-muted-foreground">{footer}</p>
    </DataPanel>
  );
}

export { IndividualSection };
