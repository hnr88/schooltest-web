'use client';

import { Eye, EyeOff } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { AuthFieldError } from '@/modules/auth/components/AuthFieldError';
import { Button, Input, Label } from '@/modules/design-system';

import type { PasswordFieldProps } from '@/modules/auth/types/components.types';

const FIELD_CLASS = 'flex flex-col gap-2';
const LABEL_CLASS = 'text-[13px] font-semibold text-[#0E2350]';
const INPUT_CLASS =
  'h-[50px] rounded-[10px] border-[#CBD5E1] bg-[#F7F9FC] px-[15px] text-[15px] md:text-[15px] text-[#0E2350] placeholder:text-[#94A3B8] focus-visible:border-[#2563EB] focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(37,99,235,.15)] aria-invalid:border-[1.5px] aria-invalid:border-[#DC2626] aria-invalid:bg-white aria-invalid:ring-[rgba(220,38,38,.15)]';

// Shared password input + optional show/hide toggle, extracted so SignUpForm
// (username, email, password, confirm password) stays under the 120-line cap.
// hideToggle renders a plain password input for portal-style screens.
export function PasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  visible,
  onToggleVisible,
  toggleLabel,
  hideToggle = false,
  error,
  registration,
  labelAccessory,
}: PasswordFieldProps) {
  return (
    <div className={FIELD_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </Label>
        {labelAccessory}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={hideToggle ? 'password' : visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(INPUT_CLASS, !hideToggle && 'pr-12')}
          {...registration}
        />
        {!hideToggle && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleVisible}
            aria-pressed={visible}
            aria-label={toggleLabel}
            className="absolute top-0 right-0 size-11 rounded-lg text-muted-foreground transition-transform duration-150 ease-out-expo hover:scale-110 hover:text-foreground active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            {visible ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </Button>
        )}
      </div>
      {error ? <AuthFieldError id={`${id}-error`} message={error} /> : null}
    </div>
  );
}
