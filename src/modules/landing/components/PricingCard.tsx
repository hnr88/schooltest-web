import { Check, X } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { Button, Card } from '@/modules/design-system';
import type { PRICING_TIERS } from '@/modules/landing/constants/landing.constants';

type PricingTier = (typeof PRICING_TIERS)[number];

async function PricingCard({ tier }: { tier: PricingTier }) {
  const t = await getTranslations('Home');

  return (
    <div className="relative h-full">
      {tier.badgeKey ? (
        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-accent-on-dark px-3.5 py-1.5 text-micro font-bold tracking-overline text-teal-950 uppercase">
          {t(tier.badgeKey)}
        </span>
      ) : null}
      <Card
        className={cn(
          'h-full rounded-3xl p-8 transition-[transform,box-shadow] duration-200 ease-out-expo hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          tier.featured &&
            'relative border-navy-900 bg-navy-900 text-white shadow-dark-lift hover:shadow-dark-lift',
        )}
      >
        <h3 className="text-button font-bold">{t(tier.nameKey)}</h3>
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className="text-h1 font-bold">{t(tier.priceKey)}</span>
          {tier.suffixKey ? (
            <span
              className={cn('text-caption', tier.featured ? 'text-navy-muted' : 'text-slate-400')}
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
                  tier.featured ? 'text-accent-on-dark' : 'text-success dark:text-green-400',
                )}
              />
              <span className={cn('text-body-md', tier.featured ? 'text-navy-soft' : 'text-body')}>
                {t(featureKey)}
              </span>
            </li>
          ))}
          {tier.excludedFeatureKeys.map((featureKey) => (
            <li key={featureKey} className="flex items-center gap-2.5">
              <X
                aria-hidden="true"
                strokeWidth={2.75}
                className="size-3.5 shrink-0 text-input"
              />
              <span className="text-body-md text-slate-400">{t(featureKey)}</span>
            </li>
          ))}
        </ul>
        <Button
          variant={tier.featured ? 'default' : 'outline'}
          href="#cta"
          className="mt-auto h-11 w-full rounded-lg transition-[transform,background-color,border-color] duration-150 ease-out-expo hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          {t(tier.ctaKey)}
        </Button>
      </Card>
    </div>
  );
}

export { PricingCard };
