import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

import { Badge, Container, ScrollReveal, Section } from '@/modules/design-system';
import { cn } from '@/lib/utils';
import { PROGRAMME_FACTS } from '@/modules/eald/constants/components.constants';

// Home v2:112–141 — the About the programme band (#programme): the existing
// problem/solution copy in the design's two-column layout with the captioned
// classroom photo, plus the five-cell fact table from PROGRAMME_FACTS. The
// lead-in label and the photo caption are the band's only new strings (D-02:
// headings and bodies render the shipped catalogue keys).
async function ProblemSection() {
  const t = await getTranslations('Eald');

  return (
    <Section id="programme" className="scroll-mt-24">
      <Container className="max-w-eald">
        <div className="grid items-start gap-14 lg:grid-cols-2">
          <ScrollReveal>
            <div>
              <h2 className="text-h2 font-bold tracking-tight text-balance text-foreground sm:text-display">
                {t.rich('home.problem.title', {
                  br: () => <br />,
                })}
              </h2>
              <div
                aria-hidden="true"
                className="mt-4 h-1 w-14 rounded-full bg-teal-600"
              />
              <p className="mt-6 text-body-lg leading-relaxed text-body">
                {t('home.problem.bodyOne')}
              </p>
              <p className="mt-3 text-body-lg leading-relaxed text-body">
                {t('home.problem.bodyTwo')}
              </p>
              <p className="mt-3 text-body-lg leading-relaxed text-body">
                {t('home.solution.body')}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <span className="mr-1 text-body-sm text-body">
                  {t('home.about.eyebrow')}
                </span>
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
            <figure className="relative flex min-h-80 flex-col overflow-hidden rounded-2xl bg-navy-900 lg:min-h-96">
              <Image
                src="/images/erika-fletcher-MZxqc6n9qCw-unsplash.jpg"
                alt={t('home.about.photoCaption')}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-navy-950/0 to-navy-950/80 px-5 pb-4 pt-10 text-body-sm text-white">
                {t('home.about.photoCaption')}
              </figcaption>
            </figure>
          </ScrollReveal>
        </div>

        <dl className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
          {PROGRAMME_FACTS.map((fact) => (
            <div key={fact.labelKey} className="bg-surface-inset p-6">
              <dt className="text-xs font-bold uppercase tracking-eyebrow text-body">
                {t(fact.labelKey)}
              </dt>
              <dd
                className={cn(
                  'mt-2 text-body-md font-semibold',
                  fact.tone === 'teal' ? 'text-teal-600' : 'text-foreground',
                )}
              >
                {t(fact.valueKey)}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}

export { ProblemSection };
