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
