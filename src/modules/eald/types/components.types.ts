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
