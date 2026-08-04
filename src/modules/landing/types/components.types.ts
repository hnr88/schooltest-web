import type { PRICING_TIERS } from '@/modules/landing/constants/landing.constants';

export type LandingIconProps = {
  className?: string;
  strokeWidth?: number;
};

export type PricingTier = (typeof PRICING_TIERS)[number];

export type SocialIconProps = {
  className?: string;
};
