'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';

import { AuthFieldError } from '@/modules/auth/components/AuthFieldError';
import {
  AUTH_FIELD_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
} from '@/modules/auth/constants/auth-field.constants';
import { Input, Label } from '@/modules/design-system';

interface TextFieldProps {
  id: string;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  error?: string;
  registration: UseFormRegisterReturn;
}

// Shared label + input + field-level error, extracted so SignUpForm (username,
// email, password, confirm password) stays under the 120-line component cap.
export function TextField({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  error,
  registration,
}: TextFieldProps) {
  return (
    <div className={AUTH_FIELD_CLASS}>
      <Label htmlFor={id} className={AUTH_LABEL_CLASS}>
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={AUTH_INPUT_CLASS}
        {...registration}
      />
      {error ? <AuthFieldError id={`${id}-error`} message={error} /> : null}
    </div>
  );
}
