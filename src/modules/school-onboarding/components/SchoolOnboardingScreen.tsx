'use client';

import { useTranslations } from 'next-intl';

import { Spinner } from '@/modules/design-system';
import { OnboardingStatusScreen } from '@/modules/school-onboarding/components/OnboardingStatusScreen';
import { SchoolOnboardingWizard } from '@/modules/school-onboarding/components/SchoolOnboardingWizard';
import { useStoreHydration } from '@/modules/school-onboarding/hooks/use-store-hydration';
import { classifyLinkError } from '@/modules/school-onboarding/lib/classify-link-error';
import { useSchoolOnboardingQuery } from '@/modules/school-onboarding/queries/use-school-onboarding.query';

import type { SchoolOnboardingScreenProps } from '@/modules/school-onboarding/types/components.types';

// Guest entry point for the tokenised onboarding link (spec section 4). The
// wizard renders only after the link state is known AND the persisted store
// has rehydrated from localStorage, so a reload mid-wizard restores the step.
export function SchoolOnboardingScreen({ token }: SchoolOnboardingScreenProps) {
  const t = useTranslations('SchoolOnboarding');
  const hydrated = useStoreHydration(token);
  const { data, error, isPending } = useSchoolOnboardingQuery(token);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-10 sm:py-16">
      <p className="text-lg font-semibold text-foreground">SchoolTest</p>
      <div className="mt-8 flex-1">
        {isPending || !hydrated ? (
          <div className="flex items-center gap-3 py-16 text-muted-foreground">
            <Spinner className="size-5" />
            <span className="text-body-sm">{t('loading')}</span>
          </div>
        ) : error ? (
          <OnboardingStatusScreen state={classifyLinkError(error)} />
        ) : data ? (
          <SchoolOnboardingWizard token={token} data={data} />
        ) : null}
      </div>
    </main>
  );
}
