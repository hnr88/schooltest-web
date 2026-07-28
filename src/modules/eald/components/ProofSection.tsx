import { getTranslations } from 'next-intl/server';

import { Badge, Container } from '@/modules/design-system';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';

const STATS = [
  { valueKey: 'home.proof.skillsValue', labelKey: 'home.proof.skillsLabel' },
  { valueKey: 'home.proof.yearsValue', labelKey: 'home.proof.yearsLabel' },
  { valueKey: 'home.proof.scalesValue', labelKey: 'home.proof.scalesLabel' },
  { valueKey: 'home.proof.durationValue', labelKey: 'home.proof.durationLabel' },
] as const;

async function ProofSection() {
  const t = await getTranslations('Eald');

  return (
    <section data-slot="proof" className="pt-16 sm:pt-20">
      <Container className="max-w-eald">
        <ScrollReveal>
          <div className="rounded-4xl border border-border bg-surface-inset p-10 sm:p-12">
            <Badge
              variant="outline"
              className="rounded-full px-4 py-1.5 text-body-sm font-semibold text-navy-800"
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
    </section>
  );
}

export { ProofSection };
