'use client';

import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { ANNOUNCEMENT_LEVELS } from '@schooltest/ops-contracts';

import { useAuthStore } from '@/modules/auth';
import { Button, Card, FieldShell, SelectField, Switch, Textarea } from '@/modules/design-system';
import { useAnnouncementMutation } from '@/modules/ops/queries/use-announcement.mutation';
import { useMaintenanceMutation } from '@/modules/ops/queries/use-maintenance.mutation';
import { useSettingsReadQuery } from '@/modules/ops/queries/use-settings-read.query';
import {
  BANNER_MESSAGE_MAX,
  createBannerFormSchema,
  type BannerFormValues,
} from '@/modules/ops/schemas/flags-console.schema';

import { OpsConfirmDialog } from './OpsConfirmDialog';

// C-OPSF-03 / C-OPSF-04 — ONE editor for both public banners.
//
// Maintenance mode and the announcement are the same interaction over two
// routes: a switch, a message, a confirm-gated save. They differ in one field
// (the announcement carries a level) and in consequence language, so this is
// one configurable component rather than two near-identical ones — the same
// call as the Comms console's single composer.
//
// Both are CONFIRM-GATED because both change what every public visitor sees,
// and maintenance additionally closes the site. The dialog names the specific
// consequence; a generic "are you sure?" trains operators to click through.
//
// HYDRATION IS `values`-ONLY, which is this codebase's stated pattern for
// server-fed forms (`use-platform-settings-form.ts`, hydrating this very
// settings query): RHF re-applies `values` with `keepFieldsRef: true`, whereas
// a hand-rolled effect that calls setState — or a `form.reset()` — wipes
// `control._fields` and silently drops later keystrokes. It also keeps this
// component free of `set-state-in-effect`, which an earlier revision of this
// file tripped.
export type BannerVariant = 'maintenance' | 'announcement';

interface OpsBannerEditorProps {
  variant: BannerVariant;
}

export function OpsBannerEditor({ variant }: OpsBannerEditorProps) {
  const t = useTranslations('Ops.flags');
  const scope = variant === 'maintenance' ? 'maintenance' : 'announcement';

  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const settings = useSettingsReadQuery(hydrated && Boolean(token));

  const [confirmOpen, setConfirmOpen] = useState(false);

  // Hook order cannot depend on a prop, so both are called and one is used.
  const maintenance = useMaintenanceMutation();
  const announcement = useAnnouncementMutation();
  const pending = variant === 'maintenance' ? maintenance.isPending : announcement.isPending;

  const schema = useMemo(
    () =>
      createBannerFormSchema(
        t('validation.messageRequiredWhenOn'),
        t('validation.tooLong', { max: BANNER_MESSAGE_MAX }),
      ),
    [t],
  );

  const row = settings.data;
  const values = useMemo<BannerFormValues | undefined>(() => {
    if (!row) return undefined;
    return variant === 'maintenance'
      ? { enabled: Boolean(row.maintenance_mode), message: row.maintenance_message ?? '', level: 'info' }
      : {
          enabled: Boolean(row.announcement_enabled),
          message: row.announcement_message ?? '',
          level: row.announcement_level ?? 'info',
        };
  }, [row, variant]);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { enabled: false, message: '', level: 'info' },
    values,
  });

  // `useWatch` rather than `form.watch()`: watch() cannot be memoized safely
  // under the React Compiler (the repo's own lint says so), and this value only
  // drives the card attribute and the dialog's copy.
  const enabled = Boolean(useWatch({ control: form.control, name: 'enabled' }));
  const messageError = form.formState.errors.message?.message;

  function serverMessage(err: unknown): string | undefined {
    return (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
      ?.error?.message;
  }

  // Validation runs FIRST: on a bad form RHF never calls this, so the dialog
  // stays shut and nothing reaches the API.
  const requestSave = form.handleSubmit(() => setConfirmOpen(true));

  async function confirmSave() {
    const current = form.getValues();
    const message = current.message.trim().length === 0 ? null : current.message;
    try {
      if (variant === 'maintenance') {
        const result = await maintenance.mutateAsync({ enabled: current.enabled, message });
        toast.success(
          result.maintenance_mode ? t('maintenance.onToast') : t('maintenance.offToast'),
        );
      } else {
        const result = await announcement.mutateAsync({
          enabled: current.enabled,
          message,
          level: current.level,
        });
        toast.success(
          result.announcement_enabled
            ? t('announcement.onToast', { level: result.announcement_level })
            : t('announcement.offToast'),
        );
      }
      setConfirmOpen(false);
    } catch (err) {
      setConfirmOpen(false);
      toast.error(serverMessage(err) ?? t('errorToast'));
    }
  }

  const levelOptions = ANNOUNCEMENT_LEVELS.map((value) => ({
    value,
    label: t(`levels.${value}`),
  }));

  return (
    <Card
      data-slot={`ops-banner-editor-${variant}`}
      data-variant={variant}
      data-enabled={enabled ? 'true' : 'false'}
      className="flex flex-col gap-4 p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-foreground">{t(`${scope}.title`)}</h2>
        <p className="text-sm text-body">{t(`${scope}.description`)}</p>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium text-foreground">
        <Controller
          control={form.control}
          name="enabled"
          render={({ field }) => (
            <Switch
              data-slot={`ops-banner-switch-${variant}`}
              checked={Boolean(field.value)}
              disabled={pending}
              onCheckedChange={field.onChange}
            />
          )}
        />
        {t(`${scope}.switchLabel`)}
      </label>

      <FieldShell
        id={`${variant}-message`}
        label={t('fields.message')}
        errorText={messageError}
        // Per-variant, not shared: "while the banner is on" is true of the
        // announcement and misleading for maintenance mode, which closes the
        // site rather than decorating it. Sharing the component should not mean
        // sharing copy that is only accurate for one of its two uses.
        helperText={t(`${scope}.messageHelp`)}
      >
        <Controller
          control={form.control}
          name="message"
          render={({ field }) => (
            <Textarea
              id={`${variant}-message`}
              name={field.name}
              ref={field.ref}
              value={String(field.value ?? '')}
              rows={3}
              maxLength={BANNER_MESSAGE_MAX}
              onChange={field.onChange}
              onBlur={field.onBlur}
              aria-invalid={messageError ? true : undefined}
            />
          )}
        />
      </FieldShell>

      {variant === 'announcement' ? (
        <Controller
          control={form.control}
          name="level"
          render={({ field }) => (
            <SelectField
              id="announcement-level"
              label={t('fields.level')}
              // Required by SelectFieldProps, but never rendered here: the level
              // always has a value (hydrated from the row, defaulting to info),
              // so there is no empty state for a placeholder to describe.
              placeholder={t('levels.info')}
              options={levelOptions}
              value={String(field.value ?? 'info')}
              onValueChange={field.onChange}
              className="max-w-xs"
            />
          )}
        />
      ) : null}

      <div>
        <Button
          type="button"
          variant={variant === 'maintenance' ? 'destructive' : 'default'}
          data-slot={`ops-banner-save-${variant}`}
          disabled={pending || settings.isPending}
          onClick={() => void requestSave()}
        >
          {t(`${scope}.save`)}
        </Button>
      </div>

      <OpsConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t(`${scope}.confirmTitle`)}
        // The consequence is stated for the DIRECTION being saved: closing the
        // site and reopening it are not the same decision.
        description={enabled ? t(`${scope}.confirmOn`) : t(`${scope}.confirmOff`)}
        confirmLabel={t(`${scope}.confirmAction`)}
        cancelLabel={t('actions.cancel')}
        tone={variant === 'maintenance' ? 'destructive' : 'neutral'}
        pending={pending}
        onConfirm={() => void confirmSave()}
      />
    </Card>
  );
}
