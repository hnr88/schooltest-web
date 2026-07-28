import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Badge, Container, Eyebrow, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';

async function ProblemSection() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <ScrollReveal>
            <div>
              <Eyebrow>{t('home.problem.eyebrow')}</Eyebrow>
              <h2 className="mt-3 text-h2 font-bold tracking-tight text-balance text-foreground sm:text-display">
                {t.rich('home.problem.title', {
                  br: () => <br />,
                })}
              </h2>
              <p className="mt-4 text-body-md leading-relaxed text-body">
                {t('home.problem.bodyOne')}
              </p>
              <p className="mt-3 text-body-md leading-relaxed text-body">
                {t('home.problem.bodyTwo')}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <Badge variant="navy" className="rounded-full px-4 py-2 text-body-md font-bold">
                  {t('home.problem.badgeScore')}
                </Badge>
                <Badge className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-body-md font-bold text-navy-800">
                  {t('home.problem.badgeCefr')}
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full px-4 py-2 text-body-md font-bold text-body"
                >
                  {t('home.problem.badgePhase')}
                </Badge>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120}>
            <div className="relative min-h-80 overflow-hidden rounded-4xl bg-navy-900 lg:min-h-96">
              <Image
                src="/images/university-of-mobile-ZPkG0EdWQa8-unsplash.jpg"
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-navy-900/10 via-navy-900/30 to-navy-900/70"
              />
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </Section>
  );
}

export { ProblemSection };
