import { CircleCheck, X } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { Badge, Button, Card } from '@/modules/design-system';
import type { PRICING_TIERS } from '@/modules/landing/constants/landing.constants';

type PricingTier = (typeof PRICING_TIERS)[number];

async function PricingCard({ tier }: { tier: PricingTier }) {
  const t = await getTranslations('Home');

  return (
    <Card
      className={cn(
        'h-full p-8',
        tier.featured && 'relative border-navy-900 bg-navy-900 text-white'
      )}
    >
      {tier.badgeKey ? (
        <Badge variant="accent" className="absolute top-4 right-4">
          {t(tier.badgeKey)}
        </Badge>
      ) : null}
      <h3 className="font-semibold">{t(tier.nameKey)}</h3>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{t(tier.priceKey)}</span>
        {tier.suffixKey ? (
          <span className={cn(tier.featured ? 'text-blue-100/85' : 'text-muted-foreground')}>
            {t(tier.suffixKey)}
          </span>
        ) : null}
      </p>
      <ul className="mt-6 flex flex-col gap-2.5">
        {tier.includedFeatureKeys.map((featureKey) => (
          <li key={featureKey} className="flex items-center gap-2">
            <CircleCheck aria-hidden="true" className="size-4 shrink-0 text-teal-600" />
            <span className={cn(tier.featured && 'text-blue-100/85')}>{t(featureKey)}</span>
          </li>
        ))}
        {tier.excludedFeatureKeys.map((featureKey) => (
          <li key={featureKey} className="flex items-center gap-2">
            <X aria-hidden="true" className="size-4 shrink-0 text-slate-300" />
            <span className="text-muted-foreground line-through">{t(featureKey)}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={tier.featured ? 'default' : 'outline'}
        render={<a href="#cta" />}
        className="mt-auto h-11 w-full"
      >
        {t(tier.ctaKey)}
      </Button>
    </Card>
  );
}

export { PricingCard };
