import Image from 'next/image';

import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';

async function TeachEmpiricalSection() {
  const t = await getTranslations('Eald.track.teachEmpirical');

  return (
    <Section>
      <Container className="max-w-eald">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <ScrollReveal>
            <div className="relative min-h-96 overflow-hidden rounded-3xl bg-navy-900">
              <Image
                src="/images/sangga-rima-roman-selia-bgQgAKagQB4-unsplash.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-navy-950/10 via-navy-950/35 to-navy-950/70"
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <Eyebrow>{t('eyebrow')}</Eyebrow>
            <h2 className="mt-4 text-h2 font-bold text-foreground">{t('title')}</h2>
            <p className="mt-4 text-body-lg leading-relaxed text-body">{t('body')}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <span className="rounded-full border border-border bg-surface-inset px-4 py-2 text-sm font-semibold text-foreground">
                {t('focusBadge')}
              </span>
              <span className="rounded-full border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-bold text-teal-600">
                {t('resultBadge')}
              </span>
            </div>

            <p className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4 text-sm leading-relaxed text-foreground">
              {t.rich('callout', {
                strong: (chunks) => <strong className="font-bold">{chunks}</strong>,
              })}
            </p>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
}

export { TeachEmpiricalSection };
