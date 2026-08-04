'use client';

import { CircleCheck, Clock, Link2Off, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { OnboardingLinkState } from '@/modules/school-onboarding/types/school-onboarding.types';

const STATE_ICONS: Record<OnboardingLinkState, LucideIcon> = {
  invalid: Link2Off,
  expired: Clock,
  revoked: Link2Off,
  used: CircleCheck,
  unavailable: TriangleAlert,
};

interface OnboardingStatusScreenProps {
  state: OnboardingLinkState;
}

// Terminal link states (C-ONB-01 404/410/409 + network failure): each renders
// its own screen instead of the wizard.
export function OnboardingStatusScreen({ state }: OnboardingStatusScreenProps) {
  const t = useTranslations('SchoolOnboarding.errors');
  const Icon = STATE_ICONS[state];

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold text-foreground">{t(`${state}Title`)}</h1>
      <p className="max-w-md text-body-sm text-muted-foreground">{t(`${state}Message`)}</p>
    </div>
  );
}
