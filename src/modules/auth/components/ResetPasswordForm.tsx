'use client';

import { useTranslations } from 'next-intl';

import { PasswordField } from '@/modules/auth/components/PasswordField';
import { ResetPasswordRuleChecklist } from '@/modules/auth/components/ResetPasswordRuleChecklist';
import { useResetPasswordForm } from '@/modules/auth/hooks/use-reset-password-form';
import { Alert, Button } from '@/modules/design-system';

import type { ResetPasswordFormProps } from '@/modules/auth/types/components.types';

// Form state of the reset-password card (design 'reset' scenario): title, two
// plain PasswordFields (no visibility toggle per the kit's hideToggle), the
// three-rule checklist and the primary submit. The reset API never exposes the
// code-linked email before success, so the design's email subtitle is omitted.
export function ResetPasswordForm({
  code,
  onExpiredCode,
  onInvalidCode,
  onSuccess,
}: ResetPasswordFormProps) {
  const t = useTranslations('Auth');
  const { register, errors, onSubmit, formError, ruleStates, isPending } = useResetPasswordForm({
    code,
    onExpiredCode,
    onInvalidCode,
    onSuccess,
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-auth-title font-bold text-foreground">{t('portal.resetTitle')}</h1>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError ? (
          <Alert variant="error" title={t(formError)}>
            {null}
          </Alert>
        ) : null}
        <PasswordField
          id="reset-password"
          label={t('newPasswordLabel')}
          placeholder=""
          autoComplete="new-password"
          visible={false}
          onToggleVisible={() => {}}
          toggleLabel=""
          hideToggle
          error={errors.password?.message ? t(errors.password.message) : undefined}
          registration={register('password')}
        />
        <ResetPasswordRuleChecklist states={ruleStates} />
        <PasswordField
          id="reset-confirm-password"
          label={t('portal.confirmLabel')}
          placeholder=""
          autoComplete="new-password"
          visible={false}
          onToggleVisible={() => {}}
          toggleLabel=""
          hideToggle
          error={
            errors.passwordConfirmation?.message ? t(errors.passwordConfirmation.message) : undefined
          }
          registration={register('passwordConfirmation')}
        />
        <Button
          type="submit"
          size="xl"
          loading={isPending}
          className="w-full rounded-lg shadow-sm transition-[transform,background-color,box-shadow] duration-150 ease-out-expo hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          {isPending ? t('resettingPassword') : t('resetButton')}
        </Button>
      </form>
    </div>
  );
}
