'use client';

import type { HTMLInputTypeAttribute } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { Input } from '@/modules/design-system';
import { WizardField } from '@/modules/student-wizard/components/WizardField';

interface WizardTextFieldProps {
  id: string;
  label: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  helper?: string;
  error?: string;
  max?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  registration: UseFormRegisterReturn;
}

// Label + §5.1 Input + helper/error, wired to a RHF `register()` return. Baked
// error messages (StudentWizardSchema namespace) are already localized upstream.
export function WizardTextField({
  id,
  label,
  type = 'text',
  placeholder,
  helper,
  error,
  max,
  autoComplete,
  inputMode,
  registration,
}: WizardTextFieldProps) {
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined;

  return (
    <WizardField htmlFor={id} label={label} helper={helper} error={error}>
      <Input
        id={id}
        type={type}
        max={max}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="h-11"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...registration}
      />
    </WizardField>
  );
}
