'use client';

import type { HTMLInputTypeAttribute } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { describedBy, Input } from '@/modules/design-system';
import { WizardField } from '@/modules/student-wizard/components/WizardField';
import { WIZARD_CONTROL } from '@/modules/student-wizard/constants/wizard-control.constants';

interface WizardTextFieldProps {
  id: string;
  label: string;
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  helper?: string;
  error?: string;
  max?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  registration: UseFormRegisterReturn;
}

// Portal field stack (spec 03 §1.4) over the 48px `PortalInput` box.
export function WizardTextField({
  id,
  label,
  type = 'text',
  placeholder,
  helper,
  error,
  max,
  required,
  autoComplete,
  inputMode,
  registration,
}: WizardTextFieldProps) {
  return (
    <WizardField id={id} label={label} helper={helper} error={error} required={required}>
      <Input
        id={id}
        type={type}
        max={max}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className={cn(WIZARD_CONTROL, error && 'border-destructive')}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, helper, error)}
        {...registration}
      />
    </WizardField>
  );
}
