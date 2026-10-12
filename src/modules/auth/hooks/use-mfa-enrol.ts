'use client';

import { isAxiosError } from 'axios';
import { useState } from 'react';

import { classifyMfaError } from '@/modules/auth/lib/classify-mfa-error';
import {
  useMfaEnrolConfirmMutation,
  useMfaEnrolStartMutation,
} from '@/modules/auth/queries/use-mfa-enrol.mutation';
import {
  mfaCodeSchema,
  mfaEmailCodeSchema,
  type MfaEnrolSecretResponse,
} from '@/modules/auth/schemas/mfa.schema';
import { useAuthStore } from '@/modules/auth/stores/use-auth-store';

import type { MfaErrorBody, MfaVerifyFailure } from '@/modules/auth/types/mfa.types';

// W3-22 (D3 MFA-3): the enrolment state machine. All state lives in this
// component's memory: the secret and the recovery codes are never written to
// localStorage/sessionStorage, the query cache or the mutation cache.
//   idle -> emailSent -> secretShown -> confirmed (recovery codes) -> done
export type MfaEnrolPhase = 'idle' | 'emailSent' | 'secretShown' | 'confirmed' | 'done';

/** What the panel renders. Raw server strings select a state and are never shown. */
export type MfaEnrolFailure =
  | MfaVerifyFailure
  | { key: 'stepUpRequired' }
  | { key: 'setupExpired' };

type Step = 'begin' | 'email' | 'confirm';

const FAILURE_MESSAGE_KEYS = {
  notAvailable: 'mfaNotAvailable',
  tooManyRequests: 'tooManyRequests',
  offline: 'offlineError',
  stepUpRequired: 'mfaReplaceNeedsStepUp',
  setupExpired: 'mfaEnrolExpired',
} as const;

/** The `Auth` message key for every failure that carries no parameters. */
export function mfaEnrolFailureMessageKey(failure: MfaEnrolFailure) {
  return failure.key in FAILURE_MESSAGE_KEYS
    ? FAILURE_MESSAGE_KEYS[failure.key as keyof typeof FAILURE_MESSAGE_KEYS]
    : 'serverError';
}

function failureOf(error: unknown, step: Step): MfaEnrolFailure {
  if (isAxiosError<MfaErrorBody>(error)) {
    const code = error.response?.data?.error?.details?.code;
    if (error.response?.status === 403 && code === 'MFA_REQUIRED') return { key: 'stepUpRequired' };
    if (code === 'MFA_NO_PENDING_ENROLMENT') return { key: 'setupExpired' };
  }
  const failure = classifyMfaError(error);
  // A 400 while asking for the code is the mail failing, not a wrong code.
  if (step === 'begin' && failure.key === 'invalidCode') return { key: 'server' };
  // The emailed code has its own three-try budget, not the account lockout.
  if (step === 'email' && failure.key === 'invalidCode') return { key: 'invalidCode' };
  return failure;
}

export function useMfaEnrol() {
  const start = useMfaEnrolStartMutation();
  const confirm = useMfaEnrolConfirmMutation();
  const markMfaRequired = useAuthStore((state) => state.markMfaRequired);
  const [phase, setPhase] = useState<MfaEnrolPhase>('idle');
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [secret, setSecret] = useState<MfaEnrolSecretResponse | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [failure, setFailure] = useState<MfaEnrolFailure | null>(null);

  const fail = (error: unknown, step: Step) => {
    const next = failureOf(error, step);
    setFailure(next);
    if (next.key === 'setupExpired') {
      setSecret(null);
      setPhase('idle');
    }
    // Replacing a device needs the step-up proof: the MFA surface never raises
    // the W3-20 dialog by itself, so ask the host for it explicitly.
    if (next.key === 'stepUpRequired') markMfaRequired();
  };

  const adopt = (data: Awaited<ReturnType<typeof start.mutateAsync>>) => {
    if ('sent' in data) {
      setExpiresInSeconds(data.expiresInSeconds);
      setPhase('emailSent');
    } else {
      setSecret(data);
      setPhase('secretShown');
    }
  };

  /** idle -> emailSent (first enrolment), or -> secretShown (replace, with proof). */
  const begin = async () => {
    setFailure(null);
    try {
      adopt(await start.mutateAsync({}));
    } catch (error) {
      fail(error, 'begin');
    } finally {
      start.reset();
    }
  };

  /** emailSent -> secretShown. */
  const submitEmailCode = async (typed: string) => {
    const parsed = mfaEmailCodeSchema.safeParse(typed.replace(/\s+/g, ''));
    if (!parsed.success) return setFailure({ key: 'invalidCode' });
    setFailure(null);
    try {
      adopt(await start.mutateAsync({ emailCode: parsed.data }));
    } catch (error) {
      fail(error, 'email');
    } finally {
      start.reset();
    }
  };

  /** secretShown -> confirmed (the recovery codes screen). */
  const submitConfirmCode = async (typed: string) => {
    const parsed = mfaCodeSchema.safeParse(typed.replace(/\s+/g, ''));
    if (!parsed.success) return setFailure({ key: 'invalidCode' });
    setFailure(null);
    try {
      const data = await confirm.mutateAsync({ code: parsed.data });
      setRecoveryCodes(data.recoveryCodes);
      setSecret(null);
      setPhase('confirmed');
    } catch (error) {
      fail(error, 'confirm');
    } finally {
      confirm.reset();
    }
  };

  /** confirmed -> done: the codes leave memory. */
  const acknowledge = () => {
    setRecoveryCodes([]);
    setSecret(null);
    setFailure(null);
    setPhase('done');
  };

  return {
    phase,
    secret,
    recoveryCodes,
    expiresInSeconds,
    failure,
    isPending: start.isPending || confirm.isPending,
    begin,
    submitEmailCode,
    submitConfirmCode,
    acknowledge,
  };
}
