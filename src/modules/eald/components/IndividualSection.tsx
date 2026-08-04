import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';

import type { ReadinessCardProps } from '@/modules/eald/types/components.types';

async function IndividualSection() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <Eyebrow tone="teal">{t('predict.individual.eyebrow')}</Eyebrow>
            <h2 className="mt-4 text-h2 font-bold tracking-tight text-balance text-foreground">
              {t('predict.individual.title')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-body">
              {t('predict.individual.body')}
            </p>
            <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm leading-relaxed text-foreground dark:border-teal-900 dark:bg-teal-950">
              {t.rich('predict.individual.callout', {
                strong: (chunks) => (
                  <strong className="font-bold">{chunks}</strong>
                ),
              })}
            </div>
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

function ReadinessCard({
  label,
  term1Label,
  term1Value,
  term3Label,
  term3Value,
  footer,
}: ReadinessCardProps) {
  return (
    <div className="rounded-3xl border border-border bg-white p-7 shadow-sm dark:bg-surface">
      <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <div className="mt-5 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-background p-5">
          <p className="text-xs font-semibold text-muted-foreground">
            {term1Label}
          </p>
          <p className="mt-1 text-stat-xl font-bold tracking-tight text-muted-foreground">
            {term1Value}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-xs font-semibold text-blue-600 dark:text-blue-300">
            {term3Label}
          </p>
          <p className="mt-1 text-stat-xl font-bold tracking-tight text-foreground">
            {term3Value}
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {footer}
      </p>
    </div>
  );
}

export { IndividualSection };
