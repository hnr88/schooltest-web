'use client';

import { Eye, EyeOff } from 'lucide-react';
import type { ReactNode } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { AuthFieldError } from '@/modules/auth/components/AuthFieldError';
import {
  AUTH_FIELD_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
} from '@/modules/auth/constants/auth-field.constants';
import { Button, Input, Label } from '@/modules/design-system';

interface PasswordFieldProps {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: string;
  visible: boolean;
  onToggleVisible: () => void;
  toggleLabel: string;
  error?: string;
  registration: UseFormRegisterReturn;
  labelAccessory?: ReactNode;
}

// Shared password input + show/hide toggle, extracted so SignUpForm (username,
// email, password, confirm password) stays under the 120-line component cap.
export function PasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  visible,
  onToggleVisible,
  toggleLabel,
  error,
  registration,
  labelAccessory,
}: PasswordFieldProps) {
  return (
    <div className={AUTH_FIELD_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id} className={AUTH_LABEL_CLASS}>
          {label}
        </Label>
        {labelAccessory}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(AUTH_INPUT_CLASS, 'pr-12')}
          {...registration}
        />
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
      </div>
      {error ? <AuthFieldError id={`${id}-error`} message={error} /> : null}
    </div>
  );
}
