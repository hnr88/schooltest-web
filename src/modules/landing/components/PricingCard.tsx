import { Check, X } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { Button, Card } from '@/modules/design-system';
import type { PRICING_TIERS } from '@/modules/landing/constants/landing.constants';

type PricingTier = (typeof PRICING_TIERS)[number];

async function PricingCard({ tier }: { tier: PricingTier }) {
  const t = await getTranslations('Home');

  return (
    <Card
      className={cn(
        'h-full p-8',
        tier.featured && 'relative border-navy-900 bg-navy-900 text-white shadow-xl',
      )}
    >
      {tier.badgeKey ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-300 px-3.5 py-1.5 text-micro font-bold tracking-wider text-teal-950 uppercase">
          {t(tier.badgeKey)}
        </span>
      ) : null}
      <h3 className="font-bold">{t(tier.nameKey)}</h3>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="text-4xl font-bold tracking-tight">{t(tier.priceKey)}</span>
        {tier.suffixKey ? (
          <span
            className={cn('text-sm', tier.featured ? 'text-slate-400' : 'text-muted-foreground')}
          >
            {t(tier.suffixKey)}
          </span>
        ) : null}
      </p>
      <ul className="mt-6 flex flex-col gap-2.5">
        {tier.includedFeatureKeys.map((featureKey) => (
          <li key={featureKey} className="flex items-center gap-2.5">
            <Check
              aria-hidden="true"
              strokeWidth={2.75}
              className={cn(
                'size-3.5 shrink-0',
                tier.featured ? 'text-teal-300' : 'text-green-600 dark:text-green-400',
              )}
            />
            <span className={cn(tier.featured && 'text-blue-200')}>{t(featureKey)}</span>
          </li>
        ))}
        {tier.excludedFeatureKeys.map((featureKey) => (
          <li key={featureKey} className="flex items-center gap-2.5">
            <X aria-hidden="true" strokeWidth={2.75} className="size-3.5 shrink-0 text-slate-300" />
            <span className="text-muted-foreground line-through">{t(featureKey)}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={tier.featured ? 'default' : 'outline'}
        href="#cta"
        className="mt-auto h-11 w-full"
      >
        {t(tier.ctaKey)}
      </Button>
    </Card>
  );
}

export { PricingCard };
