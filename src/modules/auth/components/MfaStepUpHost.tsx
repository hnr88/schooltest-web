'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';

import { AuthFieldError } from '@/modules/auth/components/AuthFieldError';
import { classifyMfaError } from '@/modules/auth/lib/classify-mfa-error';
import { useMfaVerifyMutation } from '@/modules/auth/queries/use-mfa-verify.mutation';
import { mfaVerifyRequestSchema } from '@/modules/auth/schemas/mfa.schema';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';
import { Button, Input, Label } from '@/modules/design-system';

import type { MfaFactorMode, MfaVerifyFailure } from '@/modules/auth/types/mfa.types';

const INPUT_CLASS =
  'h-[50px] rounded-[10px] border-[#CBD5E1] bg-[#F7F9FC] px-[15px] text-center text-[18px] tracking-[0.18em] text-[#0E2350] focus-visible:border-[#2563EB] focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[rgba(37,99,235,.15)] aria-invalid:border-[1.5px] aria-invalid:border-[#DC2626] aria-invalid:bg-white';

// W3-20 (D3 MFA-3): the ONE blocking "Verify your identity" dialog. The axios
// boundary raises the auth store's mfaRequired flag on a 403 MFA_REQUIRED; this
// host (mounted once in the dashboard frame) renders nothing until then, so a
// role the API does not enforce sees nothing and issues no request. The guarded
// tree stays mounted beneath it, like the session-expired card.
export function MfaStepUpHost() {
  const mfaRequired = useAuthStore((state) => state.mfaRequired);
  if (!mfaRequired) return null;
  return <MfaStepUpDialog />;
}

function MfaStepUpDialog() {
  const t = useTranslations('Auth');
  const format = useFormatter();
  const queryClient = useQueryClient();
  const setToken = useAuthStore((state) => state.setToken);
  const verify = useMfaVerifyMutation();
  const [mode, setMode] = useState<MfaFactorMode>('code');
  const [value, setValue] = useState('');
  const [localInvalid, setLocalInvalid] = useState(false);

  const failure: MfaVerifyFailure | null = localInvalid
    ? { key: 'invalidCode' }
    : verify.error
      ? classifyMfaError(verify.error)
      : null;

  const errorText = (f: MfaVerifyFailure): string => {
    if (f.key === 'invalidCode') {
      return f.attemptsRemaining === undefined
        ? t('mfaInvalidCode')
        : `${t('mfaInvalidCode')} ${t('mfaAttemptsRemaining', { count: f.attemptsRemaining })}`;
    }
    if (f.key === 'locked') {
      const time = format.dateTime(new Date(f.unlockAt ?? ''), { hour: 'numeric', minute: '2-digit' });
      return t('mfaLocked', { time });
    }
    if (f.key === 'notAvailable') return t('mfaNotAvailable');
    if (f.key === 'tooManyRequests') return t('tooManyRequests');
    if (f.key === 'offline') return t('offlineError');
    return t('serverError');
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const typed = value.trim();
    const parsed = mfaVerifyRequestSchema.safeParse(
      mode === 'code' ? { code: typed } : { recoveryCode: typed },
    );
    setLocalInvalid(!parsed.success);
    if (parsed.success) verify.mutate(parsed.data);
  };

  const switchMode = () => {
    setMode(mode === 'code' ? 'recovery' : 'code');
    setValue('');
    setLocalInvalid(false);
    verify.reset();
  };

  // Ending the session here must also drop the held token (the 403 left it in
  // place, so /sign-in would bounce straight back) and every cached payload.
  const signOut = () => {
    setToken(null);
    void queryClient.cancelQueries();
    queryClient.removeQueries();
  };

  return (
    <div
      data-slot="mfa-step-up"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="mfa-step-up-title"
      aria-describedby="mfa-step-up-body"
      className="fixed inset-0 z-50 grid place-items-center bg-[rgba(14,35,80,0.72)] p-6 backdrop-blur-[3px]"
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex w-[420px] max-w-full flex-col gap-4 rounded-[24px] bg-white p-8 shadow-[0_28px_56px_rgba(0,0,0,0.28)]"
      >
        <div className="mx-auto grid size-12 place-items-center rounded-[16px] bg-[#EEF3FE] text-[#2563EB]">
          <ShieldCheck aria-hidden className="size-[22px]" />
        </div>
        <h2 id="mfa-step-up-title" className="text-center text-[19px] font-semibold text-[#0E2350]">
          {t('mfaStepUpTitle')}
        </h2>
        <p id="mfa-step-up-body" className="text-center text-sm leading-[1.6] text-[#64748B]">
          {t('mfaStepUpBody')}
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="mfa-step-up-input" className="text-[13px] font-semibold text-[#0E2350]">
            {mode === 'code' ? t('mfaCodeLabel') : t('mfaRecoveryLabel')}
          </Label>
          <Input
            id="mfa-step-up-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoFocus
            autoComplete={mode === 'code' ? 'one-time-code' : 'off'}
            inputMode={mode === 'code' ? 'numeric' : 'text'}
            maxLength={mode === 'code' ? 6 : 24}
            spellCheck={false}
            aria-invalid={failure ? true : undefined}
            aria-describedby={failure ? 'mfa-step-up-error' : undefined}
            className={INPUT_CLASS}
          />
          {failure ? <AuthFieldError id="mfa-step-up-error" message={errorText(failure)} /> : null}
        </div>
        <Button type="submit" disabled={verify.isPending} className="h-[46px] w-full rounded-full">
          {t('mfaVerifyButton')}
        </Button>
        <Button type="button" variant="ghost" onClick={switchMode} className="w-full">
          {mode === 'code' ? t('mfaRecoveryToggle') : t('mfaCodeToggle')}
        </Button>
        <Button type="button" variant="link" href="/sign-in" onClick={signOut} className="w-full">
          {t('mfaSignOut')}
        </Button>
      </form>
    </div>
  );
}
