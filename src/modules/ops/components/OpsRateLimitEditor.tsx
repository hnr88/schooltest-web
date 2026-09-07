'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Controller, useForm, useWatch } from 'react-hook-form';
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
import {
  createRateLimitFormSchema,
  type RateLimitFormValues,
} from '@/modules/ops/schemas/flags-console.schema';

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
//
// Hydration is `values`-only, per `use-platform-settings-form.ts` — see the
// note in OpsBannerEditor for why an effect is the wrong tool here.
export function OpsRateLimitEditor() {
  const t = useTranslations('Ops.flags');
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const settings = useSettingsReadQuery(hydrated && Boolean(token));
  const rateLimit = useRateLimitMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const maxBounds = t('validation.maxBounds', {
    min: RATE_LIMIT_MAX_MIN,
    max: RATE_LIMIT_MAX_MAX,
  });
  const windowBounds = t('validation.windowBounds', {
    min: RATE_LIMIT_WINDOW_MIN_MS,
    max: RATE_LIMIT_WINDOW_MAX_MS,
  });

  const schema = useMemo(
    () => createRateLimitFormSchema(maxBounds, windowBounds),
    [maxBounds, windowBounds],
  );

  const row = settings.data;
  const values = useMemo<RateLimitFormValues | undefined>(
    () =>
      row
        ? {
            max: Number(row.rate_limit_auth_max ?? RATE_LIMIT_MAX_MIN),
            window_ms: Number(row.rate_limit_auth_window_ms ?? RATE_LIMIT_WINDOW_MIN_MS),
          }
        : undefined,
    [row],
  );

  const form = useForm<RateLimitFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { max: RATE_LIMIT_MAX_MIN, window_ms: RATE_LIMIT_WINDOW_MIN_MS },
    values,
  });

  const maxError = form.formState.errors.max?.message;
  const windowError = form.formState.errors.window_ms?.message;

  const requestSave = form.handleSubmit(() => setConfirmOpen(true));

  async function confirmSave() {
    const current = form.getValues();
    try {
      const result = await rateLimit.mutateAsync({
        max: Number(current.max),
        window_ms: Number(current.window_ms),
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

  // Watched through `useWatch` (see OpsBannerEditor) so the confirm dialog can
  // quote the exact numbers about to be sent without tripping the compiler's
  // unmemoizable-watch() rule.
  const pendingMax = useWatch({ control: form.control, name: 'max' });
  const pendingWindow = useWatch({ control: form.control, name: 'window_ms' });

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
          errorText={maxError}
          helperText={maxBounds}
          required
          className="max-w-48"
        >
          <Controller
            control={form.control}
            name="max"
            render={({ field }) => (
              <Input
                id="rate-limit-max"
                name={field.name}
                ref={field.ref}
                type="number"
                value={String(field.value ?? '')}
                // `valueAsNumber` per the OpsSettingsControl precedent: the form
                // value stays a number, so the non-coerced schema validates it
                // directly and a non-numeric entry arrives as NaN and fails.
                onChange={(event) => field.onChange(event.target.valueAsNumber)}
                onBlur={field.onBlur}
                aria-invalid={maxError ? true : undefined}
              />
            )}
          />
        </FieldShell>

        <FieldShell
          id="rate-limit-window"
          label={t('rateLimit.windowLabel')}
          errorText={windowError}
          helperText={windowBounds}
          required
          className="max-w-64"
        >
          <Controller
            control={form.control}
            name="window_ms"
            render={({ field }) => (
              <Input
                id="rate-limit-window"
                name={field.name}
                ref={field.ref}
                type="number"
                value={String(field.value ?? '')}
                onChange={(event) => field.onChange(event.target.valueAsNumber)}
                onBlur={field.onBlur}
                aria-invalid={windowError ? true : undefined}
              />
            )}
          />
        </FieldShell>
      </div>

      <div>
        <Button
          type="button"
          data-slot="ops-rate-limit-save"
          disabled={rateLimit.isPending || settings.isPending}
          onClick={() => void requestSave()}
        >
          {t('rateLimit.save')}
        </Button>
      </div>

      <OpsConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('rateLimit.confirmTitle')}
        description={t('rateLimit.confirmDescription', {
          max: pendingMax,
          window: pendingWindow,
        })}
        confirmLabel={t('rateLimit.confirmAction')}
        cancelLabel={t('actions.cancel')}
        tone="destructive"
        pending={rateLimit.isPending}
        onConfirm={() => void confirmSave()}
      />
    </Card>
  );
}
