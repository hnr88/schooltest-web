'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { useState, type FormEvent } from 'react';

import { AuthFieldError } from '@/modules/auth/components/AuthFieldError';
import { MfaRecoveryCodes } from '@/modules/auth/components/MfaRecoveryCodes';
import {
  mfaEnrolFailureMessageKey,
  useMfaEnrol,
  type MfaEnrolFailure,
} from '@/modules/auth/hooks/use-mfa-enrol';
import { useMfaStatusQuery } from '@/modules/auth/queries/use-mfa-status.query';
import { Button, Input, Label } from '@/modules/design-system';

import type { MfaStatusResponse } from '@/modules/auth/schemas/mfa.schema';

const CARD_CLASS =
  'flex flex-col gap-4 rounded-[24px] bg-white px-[30px] py-[26px] shadow-[0_1px_2px_rgba(14,35,80,0.04)]';
const SECRET_CLASS =
  'rounded-[10px] border border-[#CBD5E1] bg-[#F7F9FC] px-3 py-2 font-mono text-[15px] tracking-[0.08em] break-all text-[#0E2350]';
const BODY_CLASS = 'text-sm leading-[1.6] text-[#64748B]';
const LABEL_CLASS = 'text-[13px] font-semibold text-[#0E2350]';

// W3-22 (D3 MFA-3): renders ONLY when GET /api/auth/mfa/status says
// `available: true`. For every other answer (not offered to this role, MFA env
// unset, a failed read) it renders nothing and issues no further request.
export function MfaEnrolPanel() {
  const status = useMfaStatusQuery();
  if (!status.data?.available) return null;
  return <MfaEnrolCard status={status.data} />;
}

function MfaEnrolCard({ status }: { status: MfaStatusResponse }) {
  const t = useTranslations('Auth');
  const format = useFormatter();
  const enrol = useMfaEnrol();
  const { phase, failure } = enrol;

  const errorText = (f: MfaEnrolFailure): string => {
    if (f.key === 'invalidCode') {
      return f.attemptsRemaining === undefined
        ? t('mfaInvalidCode')
        : `${t('mfaInvalidCode')} ${t('mfaAttemptsRemaining', { count: f.attemptsRemaining })}`;
    }
    if (f.key === 'locked') {
      const at = new Date(f.unlockAt ?? '');
      return t('mfaLocked', { time: format.dateTime(at, { hour: 'numeric', minute: '2-digit' }) });
    }
    return t(mfaEnrolFailureMessageKey(f));
  };
  const error = failure ? errorText(failure) : undefined;
  const showEnrolled = status.enrolled && (phase === 'idle' || phase === 'done');

  return (
    <section
      data-slot="mfa-enrol-panel"
      data-phase={phase}
      aria-labelledby="mfa-enrol-title"
      className={CARD_CLASS}
    >
      <div className="flex flex-col gap-1">
        <h2 id="mfa-enrol-title" className="text-[16px] font-semibold text-[#0E2350]">
          {t('mfaEnrolTitle')}
        </h2>
        {phase === 'idle' ? <p className={BODY_CLASS}>{t('mfaEnrolIntro')}</p> : null}
      </div>

      {showEnrolled || phase === 'done' ? (
        <p data-slot="mfa-enrolled-status" className="text-sm font-medium text-[#0E2350]">
          {showEnrolled && status.enrolledAt
            ? t('mfaEnrolledStatus', {
                date: format.dateTime(new Date(status.enrolledAt), { dateStyle: 'medium' }),
                count: status.recoveryCodesRemaining,
              })
            : t('mfaEnrolDone')}
        </p>
      ) : null}
      {showEnrolled ? (
        <div>
          <Button type="button" variant="outline" loading={enrol.isPending} onClick={() => void enrol.begin()}>
            {t('mfaReplaceButton')}
          </Button>
        </div>
      ) : null}
      {phase === 'idle' && !status.enrolled ? (
        <div>
          <Button type="button" loading={enrol.isPending} onClick={() => void enrol.begin()}>
            {t('mfaSendCodeButton')}
          </Button>
        </div>
      ) : null}

      {phase === 'emailSent' ? (
        <>
          <p className={BODY_CLASS}>
            {t('mfaEmailSentBody', { minutes: Math.max(1, Math.ceil((enrol.expiresInSeconds ?? 0) / 60)) })}
          </p>
          <CodeForm
            id="mfa-email-code"
            label={t('mfaEmailCodeLabel')}
            length={8}
            submitLabel={t('mfaEmailCodeSubmit')}
            loading={enrol.isPending}
            error={error}
            onSubmit={(value) => void enrol.submitEmailCode(value)}
          />
          <div>
            <Button type="button" variant="ghost" onClick={() => void enrol.begin()} disabled={enrol.isPending}>
              {t('mfaResendCodeButton')}
            </Button>
          </div>
        </>
      ) : null}

      {phase === 'secretShown' && enrol.secret ? (
        <>
          <MfaSecret secret={enrol.secret.secret} uri={enrol.secret.otpauthUri} />
          <CodeForm
            id="mfa-confirm-code"
            label={t('mfaCodeLabel')}
            length={6}
            submitLabel={t('mfaConfirmButton')}
            loading={enrol.isPending}
            error={error}
            onSubmit={(value) => void enrol.submitConfirmCode(value)}
          />
        </>
      ) : null}

      {phase === 'confirmed' ? (
        <MfaRecoveryCodes codes={enrol.recoveryCodes} onAcknowledge={enrol.acknowledge} />
      ) : null}

      {error && (phase === 'idle' || phase === 'done') ? (
        <AuthFieldError id="mfa-enrol-error" message={error} />
      ) : null}
    </section>
  );
}

// The manual key (groups of four) and the otpauth:// URI as text. No QR image
// is generated: an external QR service would receive the secret.
function MfaSecret({ secret, uri }: { secret: string; uri: string }) {
  const t = useTranslations('Auth');
  const grouped = secret.replace(/\s+/g, '').match(/.{1,4}/g)?.join(' ') ?? secret;
  return (
    <div data-slot="mfa-secret" className="flex flex-col gap-2">
      <p className={BODY_CLASS}>{t('mfaSecretHelp')}</p>
      <span className={LABEL_CLASS}>{t('mfaSecretLabel')}</span>
      <code data-slot="mfa-secret-key" className={SECRET_CLASS}>
        {grouped}
      </code>
      <span className={LABEL_CLASS}>{t('mfaUriLabel')}</span>
      <code data-slot="mfa-secret-uri" className={SECRET_CLASS}>
        {uri}
      </code>
    </div>
  );
}

interface CodeFormProps {
  id: string;
  label: string;
  length: number;
  submitLabel: string;
  loading: boolean;
  error: string | undefined;
  onSubmit: (value: string) => void;
}

function CodeForm({ id, label, length, submitLabel, loading, error, onSubmit }: CodeFormProps) {
  const [value, setValue] = useState('');
  const handle = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(value);
  };
  return (
    <form onSubmit={handle} noValidate className="flex flex-col gap-2">
      <Label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete="one-time-code"
        inputMode="numeric"
        maxLength={length + 2}
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="max-w-[260px] tracking-[0.18em]"
      />
      {error ? <AuthFieldError id={`${id}-error`} message={error} /> : null}
      <div>
        <Button type="submit" loading={loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
