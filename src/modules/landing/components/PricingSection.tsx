import { getTranslations } from 'next-intl/server';

import { Container, Eyebrow, Section } from '@/modules/design-system';
import { PricingCard } from '@/modules/landing/components/PricingCard';
import { PRICING_TIERS } from '@/modules/landing/constants/landing.constants';

async function PricingSection() {
  const t = await getTranslations('Home');

  return (
    <Section id="pricing">
      <Container>
        <div className="mx-auto max-w-xl text-center">
          <Eyebrow>{t('pricing.eyebrow')}</Eyebrow>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-balance">
            {t('pricing.title')}
          </h2>
        </div>
        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <PricingCard key={tier.key} tier={tier} />
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { PricingSection };
