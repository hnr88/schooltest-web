'use client';

import { AuthFieldError } from '@/modules/auth/components/AuthFieldError';
import { Input, Label } from '@/modules/design-system';

import type { TextFieldProps } from '@/modules/auth/types/components.types';

const FIELD_CLASS = 'flex flex-col gap-2';
const LABEL_CLASS = 'text-[13px] font-semibold text-[#0E2350]';
const INPUT_CLASS =
  'h-[50px] rounded-[10px] border-[#CBD5E1] bg-[#F7F9FC] px-[15px] text-[15px] md:text-[15px] text-[#0E2350] placeholder:text-[#94A3B8] focus-visible:border-[#2563EB] focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(37,99,235,.15)] aria-invalid:border-[1.5px] aria-invalid:border-[#DC2626] aria-invalid:bg-white aria-invalid:ring-[rgba(220,38,38,.15)]';

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
    <div className={FIELD_CLASS}>
      <Label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={INPUT_CLASS}
        {...registration}
      />
      {error ? <AuthFieldError id={`${id}-error`} message={error} /> : null}
    </div>
  );
}
