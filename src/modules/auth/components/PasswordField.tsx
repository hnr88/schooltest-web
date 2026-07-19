'use client';

import { Eye, EyeOff } from 'lucide-react';
import type { UseFormRegisterReturn } from 'react-hook-form';

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
}: PasswordFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 pr-12"
          {...registration}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleVisible}
          aria-pressed={visible}
          aria-label={toggleLabel}
          className="absolute top-0 right-0 size-11 text-muted-foreground"
        >
          {visible ? (
            <EyeOff aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
        </Button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
