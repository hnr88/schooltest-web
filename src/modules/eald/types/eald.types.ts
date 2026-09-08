import type { ReactNode } from 'react';

type EaldPage = 'home' | 'diagnose' | 'teach' | 'track' | 'predict';

interface EaldNavLink {
  readonly href: string;
  readonly key: string;
  // Absent for entries that can never be the current page (anchors such as
  // `/#evidence`), so `activePage === page` never highlights them.
  readonly page?: EaldPage;
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
  // Task 05 (Home v2:74–97): the full-bleed home band renders the public
  // breadcrumb INSIDE the hero and the four-cell StatStrip beneath it. Both
  // slots are optional — every existing consumer omits them and gets the
  // centred card unchanged.
  readonly eyebrow?: string;
  readonly breadcrumb?: ReactNode;
  readonly stats?: ReactNode;
}

interface QuoteBandProps {
  readonly quote: ReactNode;
  readonly footer?: ReactNode;
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
