import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';
import { PricingCard } from '@/modules/landing/components/PricingCard';
import { ScrollReveal } from '@/modules/landing/components/ScrollReveal';
import { PRICING_TIERS } from '@/modules/landing/constants/landing.constants';

async function PricingSection() {
  const t = await getTranslations('Home');

  return (
    <Section id="pricing">
      <Container>
        <ScrollReveal>
          <div className="mx-auto max-w-xl text-center">
            <Eyebrow>{t('pricing.eyebrow')}</Eyebrow>
            <h2 className="mt-3 text-h1 font-bold text-balance">{t('pricing.title')}</h2>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={90}>
          <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
            {PRICING_TIERS.map((tier) => (
              <PricingCard key={tier.key} tier={tier} />
            ))}
          </div>
        </ScrollReveal>
      </Container>
    </Section>
  );
}

export { PricingSection };
