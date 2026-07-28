import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';

async function SameScoreSection() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="relative min-h-96 overflow-hidden rounded-3xl bg-navy-900">
            <Image
              src="/images/just-daisy-BlCJi8walFQ-unsplash.jpg"
              alt=""
              fill
              sizes="(min-width: 1120px) 520px, calc(100vw - 3rem)"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-eald-hero-scrim"
            />
          </div>

          <div>
            <Eyebrow>{t('diagnose.sameScore.eyebrow')}</Eyebrow>

            <h2 className="mt-4 text-h2 font-bold text-foreground">
              {t.rich('diagnose.sameScore.title', {
                br: () => <br />,
              })}
            </h2>

            <p className="mt-4 text-button leading-relaxed text-body">
              {t('diagnose.sameScore.body')}
            </p>

            <p className="mt-5 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3.5 text-body-md text-foreground">
              {t.rich('diagnose.sameScore.callout', {
                strong: (chunks) => (
                  <strong className="font-bold">{chunks}</strong>
                ),
              })}
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}

export { SameScoreSection };
