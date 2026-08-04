'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { OnboardingStepDefinition } from '@/modules/school-onboarding/types/school-onboarding.types';

import type { OnboardingStepperProps } from '@/modules/school-onboarding/types/components.types';

// Four-step indicator (school, teachers, review, admin). Display only —
// navigation happens through each step's Back/Continue buttons.
export function OnboardingStepper({ steps, current }: OnboardingStepperProps) {
  const t = useTranslations('SchoolOnboarding');

  return (
    <nav aria-label={t('stepLabel', { current: current + 1, total: steps.length })}>
      <p className="text-body-sm text-muted-foreground">
        {t('stepLabel', { current: current + 1, total: steps.length })}
      </p>
      <ol className="mt-2 flex items-center gap-2">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step.key} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span
                className={cn(
                  'h-1.5 rounded-full',
                  done || active ? 'bg-primary' : 'bg-muted',
                )}
                aria-hidden
              />
              <span className="flex items-center gap-1.5 truncate text-xs font-medium">
                {done ? (
                  <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
                ) : null}
                <span
                  className={cn(
                    'truncate',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {step.label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
