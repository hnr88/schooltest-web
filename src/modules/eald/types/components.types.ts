import type { ReactNode } from 'react';
import type { useTranslations } from 'next-intl';

import type { EaldPage, NextSectionCard } from '@/modules/eald/types/eald.types';

export interface EaldHeaderProps {
  readonly activePage?: EaldPage;
}

export interface EaldMobileNavProps {
  readonly activePage?: EaldPage;
}

export interface ReadinessCardProps {
  readonly label: string;
  readonly term1Label: string;
  readonly term1Value: string;
  readonly term3Label: string;
  readonly term3Value: string;
  readonly footer: string;
}

export interface NextSectionNavProps {
  readonly sections: readonly NextSectionCard[];
}

type EaldT = ReturnType<typeof useTranslations<'Eald'>>;

export interface RegisterCardProps {
  t: EaldT;
}

export interface RegisterFormCardProps extends RegisterCardProps {
  onSuccess: () => void;
}

export interface RegisterFieldWrapperProps extends RegisterCardProps {
  label: string;
  error: string | undefined;
  children: ReactNode;
}

export interface FigureCardProps {
  readonly title: string;
  readonly context?: string;
  readonly footnote?: string;
  readonly children?: ReactNode;
  readonly className?: string;
}

export interface HomeEvidenceChartBar {
  readonly value: number;
  readonly display: string;
}

export interface HomeEvidenceChartCategory {
  readonly labelKey: string;
  readonly bars: readonly HomeEvidenceChartBar[];
}

// Task 07's HOME_EVIDENCE_CHART (Home v2:247–264): three sittings per skill,
// values on the 0–100 ACARA band scale; band labels are listed bottom-up.
export interface HomeEvidenceChartConfig {
  readonly seriesLabelKeys: readonly string[];
  readonly bandLabelKeys: readonly string[];
  readonly categories: readonly HomeEvidenceChartCategory[];
}

export interface WhatYouGetCard {
  readonly titleKey: string;
  readonly descKey: string;
  /** Absent for rows with no destination (row 05) — never a dead `#`. */
  readonly href?: string;
  readonly tone: 'blue' | 'teal' | 'navy';
}

export interface ProgrammeFact {
  readonly labelKey: string;
  readonly valueKey: string;
  /** Only the Status cell tints its value. */
  readonly tone?: 'teal';
}

export interface TeachGroupingCategory {
  readonly labelKey: string;
  readonly bars: readonly { readonly value: number; readonly display: string }[];
}

// Task 11's TEACH_GROUPING (Teach:139–206): two series over four categories,
// counts on a numeric axis (max 10) — no ACARA bands.
export interface TeachGroupingConfig {
  readonly seriesLabelKeys: readonly string[];
  readonly categories: readonly TeachGroupingCategory[];
}

export interface TrackProgressCategory {
  readonly labelKey: string;
  readonly bars: readonly { readonly value: number; readonly display: string }[];
}

// Task 12's TRACK_PROGRESS (Track:172–187): four sittings over four subskills,
// values on the 0–100 ACARA band scale (BarChart max=100); band labels listed
// bottom-up.
export interface TrackProgressConfig {
  readonly seriesLabelKeys: readonly string[];
  readonly bandLabelKeys: readonly string[];
  readonly categories: readonly TrackProgressCategory[];
}
