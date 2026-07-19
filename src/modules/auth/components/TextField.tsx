'use client';

import type { UseFormRegisterReturn } from 'react-hook-form';

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
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-11"
        {...registration}
      />
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
