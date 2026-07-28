import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';

async function CohortSection() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="relative min-h-96 overflow-hidden rounded-3xl bg-navy-900">
            <Image
              src="/images/university-of-mobile-ZPkG0EdWQa8-unsplash.jpg"
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-b from-navy-900/10 via-navy-900/35 to-navy-900/70"
            />
          </div>

          <div>
            <Eyebrow>{t('predict.cohort.eyebrow')}</Eyebrow>
            <h2 className="mt-4 text-h2 font-bold tracking-tight text-balance text-foreground">
              {t('predict.cohort.title')}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-body">
              {t('predict.cohort.body')}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground">
                {t('predict.cohort.cohortBadge')}
              </span>
              <span className="rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-700 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300">
                {t('predict.cohort.exitBadge')}
              </span>
            </div>
            <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm leading-relaxed text-foreground dark:border-teal-900 dark:bg-teal-950">
              {t.rich('predict.cohort.callout', {
                strong: (chunks) => (
                  <strong className="font-bold">{chunks}</strong>
                ),
              })}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export { CohortSection };
