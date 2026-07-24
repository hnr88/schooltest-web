'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getPathname } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';
import { classifyChangePasswordError } from '@/modules/auth/lib/classify-change-password-error';
import { useChangePasswordMutation } from '@/modules/auth/queries/use-change-password.mutation';
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/modules/auth/schemas/change-password.schema';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import type { ChangePasswordErrorKey } from '@/modules/auth/types/auth.types';

type VisibilityKey = 'current' | 'next' | 'confirm';

// A 401 (C-AUTH-CHANGE: present-but-invalid/expired Bearer) means the session
// itself is dead: clear it and leave for /sign-in?error=session via a full
// navigation, so ParentGuard's own plain /sign-in redirect can never outrace
// the sessionExpired one.
export function useChangePasswordForm() {
  const t = useTranslations('Auth');
  const locale = useLocale() as Locale;
  const changePassword = useChangePasswordMutation();
  const setToken = useAuthStore((state) => state.setToken);
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [formError, setFormError] = useState<ChangePasswordErrorKey | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', password: '', passwordConfirmation: '' },
  });

  const toggle = (key: VisibilityKey) =>
    setVisible((state) => ({ ...state, [key]: !state[key] }));

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    changePassword.mutate(values, {
      onSuccess: () => {
        toast.success(t('passwordUpdated'));
        reset();
      },
      onError: (error) => {
        const key = classifyChangePasswordError(error);
        if (key === 'sessionExpired') {
          setToken(null);
          window.location.replace(
            getPathname({
              href: { pathname: '/sign-in', query: { error: 'session' } },
              locale,
            }),
          );
          return;
        }
        setFormError(key);
        toast.error(t(key));
      },
    });
  });

  return {
    errors,
    formError,
    isPending: changePassword.isPending,
    onSubmit,
    register,
    toggle,
    visible,
  };
}
