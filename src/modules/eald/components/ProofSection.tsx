import { getTranslations } from 'next-intl/server';

import { Badge, Container, Section } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing';
import { STATS } from '@/modules/eald/constants/components.constants';

async function ProofSection() {
  const t = await getTranslations('Eald');

  return (
    <Section>
      <Container className="max-w-eald">
        <ScrollReveal>
          <div className="rounded-4xl border border-border bg-surface-inset p-10 sm:p-12">
            <Badge
              variant="outline"
              // `max-w-full whitespace-normal` overrides the primitive's nowrap
              // + w-fit: at 375px this badge's copy is wider than the column and
              // pushed the whole page 8px sideways.
              className="h-auto max-w-full rounded-full px-4 py-1.5 text-body-sm font-semibold whitespace-normal text-navy-800"
            >
              {t('home.proof.badge')}
            </Badge>
            <div className="mt-8 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.valueKey}>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {t(stat.valueKey)}
                  </p>
                  <p className="mt-1.5 text-body-sm leading-relaxed text-body">
                    {t(stat.labelKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { ProofSection };
