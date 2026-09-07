'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  RATE_LIMIT_MAX_MAX,
  RATE_LIMIT_MAX_MIN,
  RATE_LIMIT_WINDOW_MAX_MS,
  RATE_LIMIT_WINDOW_MIN_MS,
} from '@schooltest/ops-contracts';

import { useAuthStore } from '@/modules/auth';
import { Button, Card, FieldShell, Input } from '@/modules/design-system';
import { useRateLimitMutation } from '@/modules/ops/queries/use-rate-limit.mutation';
import { useSettingsReadQuery } from '@/modules/ops/queries/use-settings-read.query';

import { OpsConfirmDialog } from './OpsConfirmDialog';

// C-OPSF-05 — the auth rate limit.
//
// NOT shared with the banner editors: this is two bounded integers with no
// switch and no message, and forcing it into the same component would need a
// field-schema abstraction that nothing else asks for. The banners share one
// component because they genuinely are one interaction; this is a different one.
//
// The bounds come from the CONTRACT, which mirrors the controller's own
// validation (max 1..1000, window 1000..3_600_000 ms) — so the inline check
// cannot drift into permitting what the server refuses. The server is still the
// authority: a rejection surfaces its message verbatim.
//
// Confirm-gated because this governs POST /api/auth/local. A `max` of 1 locks
// operators out of sign-in, which is the kind of change that should cost one
// deliberate extra click.
export function OpsRateLimitEditor() {
  const t = useTranslations('Ops.flags');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const settings = useSettingsReadQuery(hydrated && Boolean(token));
  const rateLimit = useRateLimitMutation();

  const [max, setMax] = useState('');
  const [windowMs, setWindowMs] = useState('');
  const [errors, setErrors] = useState<{ max?: string; windowMs?: string }>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hydratedFrom, setHydratedFrom] = useState<string | null>(null);

  useEffect(() => {
    const row = settings.data;
    if (!row || hydratedFrom === row.updatedAt) return;
    setMax(String(row.rate_limit_auth_max ?? ''));
    setWindowMs(String(row.rate_limit_auth_window_ms ?? ''));
    setHydratedFrom(row.updatedAt);
  }, [settings.data, hydratedFrom]);

  /** Integers only, inside the server's own bounds. */
  function validate(): { max?: string; windowMs?: string } {
    const next: { max?: string; windowMs?: string } = {};
    const maxValue = Number(max);
    const windowValue = Number(windowMs);

    if (!Number.isInteger(maxValue) || maxValue < RATE_LIMIT_MAX_MIN || maxValue > RATE_LIMIT_MAX_MAX) {
      next.max = t('validation.maxBounds', { min: RATE_LIMIT_MAX_MIN, max: RATE_LIMIT_MAX_MAX });
    }
    if (
      !Number.isInteger(windowValue) ||
      windowValue < RATE_LIMIT_WINDOW_MIN_MS ||
      windowValue > RATE_LIMIT_WINDOW_MAX_MS
    ) {
      next.windowMs = t('validation.windowBounds', {
        min: RATE_LIMIT_WINDOW_MIN_MS,
        max: RATE_LIMIT_WINDOW_MAX_MS,
      });
    }
    return next;
  }

  function requestSave() {
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setConfirmOpen(true);
  }

  async function confirmSave() {
    try {
      const result = await rateLimit.mutateAsync({
        max: Number(max),
        window_ms: Number(windowMs),
      });
      toast.success(
        t('rateLimit.savedToast', {
          max: result.rate_limit_auth_max,
          window: result.rate_limit_auth_window_ms,
        }),
      );
      setConfirmOpen(false);
    } catch (error) {
      setConfirmOpen(false);
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response
        ?.data?.error?.message;
      toast.error(message ?? t('errorToast'));
    }
  }

  return (
    <Card data-slot="ops-rate-limit-editor" className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">{t('rateLimit.title')}</h2>
        <p className="text-sm text-body">{t('rateLimit.description')}</p>
      </div>

      <div className="flex flex-wrap gap-4">
        <FieldShell
          id="rate-limit-max"
          label={t('rateLimit.maxLabel')}
          errorText={errors.max}
          helperText={t('validation.maxBounds', { min: RATE_LIMIT_MAX_MIN, max: RATE_LIMIT_MAX_MAX })}
          required
          className="max-w-48"
        >
          <Input
            id="rate-limit-max"
            inputMode="numeric"
            value={max}
            onChange={(event) => setMax(event.target.value)}
            aria-invalid={errors.max ? true : undefined}
          />
        </FieldShell>

        <FieldShell
          id="rate-limit-window"
          label={t('rateLimit.windowLabel')}
          errorText={errors.windowMs}
          helperText={t('validation.windowBounds', {
            min: RATE_LIMIT_WINDOW_MIN_MS,
            max: RATE_LIMIT_WINDOW_MAX_MS,
          })}
          required
          className="max-w-64"
        >
          <Input
            id="rate-limit-window"
            inputMode="numeric"
            value={windowMs}
            onChange={(event) => setWindowMs(event.target.value)}
            aria-invalid={errors.windowMs ? true : undefined}
          />
        </FieldShell>
      </div>

      <div>
        <Button
          type="button"
          data-slot="ops-rate-limit-save"
          disabled={rateLimit.isPending || settings.isPending}
          onClick={requestSave}
        >
          {t('rateLimit.save')}
        </Button>
      </div>

      <OpsConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('rateLimit.confirmTitle')}
        description={t('rateLimit.confirmDescription', { max, window: windowMs })}
        confirmLabel={t('rateLimit.confirmAction')}
        cancelLabel={t('actions.cancel')}
        tone="destructive"
        pending={rateLimit.isPending}
        onConfirm={() => void confirmSave()}
      />
    </Card>
  );
}
