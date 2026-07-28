import type { ReactNode } from 'react';

type EaldPage = 'home' | 'diagnose' | 'teach' | 'track' | 'predict';

interface EaldNavLink {
  readonly href: string;
  readonly key: string;
  readonly page: EaldPage;
}

interface EaldFooterColumn {
  readonly titleKey: string;
  readonly links: readonly { readonly href: string; readonly labelKey: string }[];
}

interface EaldHeroProps {
  readonly badge?: string;
  readonly title: ReactNode;
  readonly subtitle?: string;
  readonly primaryCta?: { label: string; href: string };
  readonly secondaryCta?: { label: string; href: string };
  readonly subText?: string;
  readonly imageSrc?: string;
  readonly imageAlt?: string;
  readonly centered?: boolean;
  readonly minHeight?: string;
}

interface QuoteBandProps {
  readonly quote: ReactNode;
}

interface NextSectionCard {
  readonly number: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly href: string;
}

type SubskillPhase = 'consolidating' | 'developing' | 'emerging' | 'beginning';

interface SubskillBar {
  readonly labelKey: string;
  readonly percent: number;
  readonly phaseKey: string;
  readonly phase: SubskillPhase;
}

export type {
  EaldPage,
  EaldNavLink,
  EaldFooterColumn,
  EaldHeroProps,
  QuoteBandProps,
  NextSectionCard,
  SubskillPhase,
  SubskillBar,
};
