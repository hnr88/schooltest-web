'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';

import { describedBy, FieldShell, Input } from '@/modules/design-system';

import type { OnboardingTextFieldProps } from '@/modules/school-onboarding/types/components.types';

// Shared label + input + field-level error for the wizard steps (canonical
// DS field stack via FieldShell).
export function OnboardingTextField({
  id,
  label,
  type = 'text',
  autoComplete,
  helperText,
  error,
  registration,
}: OnboardingTextFieldProps) {
  return (
    <FieldShell id={id} label={label} helperText={helperText} errorText={error} required>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, helperText, error)}
        {...registration}
      />
    </FieldShell>
  );
}
