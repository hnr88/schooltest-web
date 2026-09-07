'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ANNOUNCEMENT_LEVELS, type AnnouncementLevel } from '@schooltest/ops-contracts';

import { useAuthStore } from '@/modules/auth';
import { Button, Card, FieldShell, SelectField, Switch, Textarea } from '@/modules/design-system';
import { useAnnouncementMutation } from '@/modules/ops/queries/use-announcement.mutation';
import { useMaintenanceMutation } from '@/modules/ops/queries/use-maintenance.mutation';
import { useSettingsReadQuery } from '@/modules/ops/queries/use-settings-read.query';

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
// Values hydrate from the EXISTING settings read (`useSettingsReadQuery`) —
// there is no second read hook for fields the ops screen already fetches.
export type BannerVariant = 'maintenance' | 'announcement';

interface OpsBannerEditorProps {
  variant: BannerVariant;
}

const MESSAGE_MAX = 2000;

export function OpsBannerEditor({ variant }: OpsBannerEditorProps) {
  const t = useTranslations('Ops.flags');
  const scope = variant === 'maintenance' ? 'maintenance' : 'announcement';

  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const settings = useSettingsReadQuery(hydrated && Boolean(token));

  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState<AnnouncementLevel>('info');
  const [error, setError] = useState<string | undefined>(undefined);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [hydratedFrom, setHydratedFrom] = useState<string | null>(null);

  // Hook order cannot depend on a prop, so both are called and one is used.
  const maintenance = useMaintenanceMutation();
  const announcement = useAnnouncementMutation();
  const pending = variant === 'maintenance' ? maintenance.isPending : announcement.isPending;

  // Hydrate ONCE per served row rather than on every render: re-syncing on each
  // settings refetch would wipe an operator's half-typed message when another
  // console invalidates the same cache key.
  useEffect(() => {
    const row = settings.data;
    if (!row || hydratedFrom === row.updatedAt) return;
    if (variant === 'maintenance') {
      setEnabled(Boolean(row.maintenance_mode));
      setMessage(row.maintenance_message ?? '');
    } else {
      setEnabled(Boolean(row.announcement_enabled));
      setMessage(row.announcement_message ?? '');
      setLevel((row.announcement_level ?? 'info') as AnnouncementLevel);
    }
    setHydratedFrom(row.updatedAt);
  }, [settings.data, variant, hydratedFrom]);

  /**
   * A banner that is ON must say something — an enabled empty banner renders a
   * blank bar to every visitor. Turning one OFF needs no message, so the rule
   * is conditional rather than a blanket required field.
   */
  function validate(): string | undefined {
    if (enabled && message.trim().length === 0) return t('validation.messageRequiredWhenOn');
    if (message.length > MESSAGE_MAX) return t('validation.tooLong', { max: MESSAGE_MAX });
    return undefined;
  }

  function serverMessage(err: unknown): string | undefined {
    return (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data
      ?.error?.message;
  }

  function requestSave() {
    const found = validate();
    setError(found);
    if (found) return;
    setConfirmOpen(true);
  }

  async function confirmSave() {
    try {
      if (variant === 'maintenance') {
        const result = await maintenance.mutateAsync({
          enabled,
          message: message.trim().length === 0 ? null : message,
        });
        toast.success(
          result.maintenance_mode ? t('maintenance.onToast') : t('maintenance.offToast'),
        );
      } else {
        const result = await announcement.mutateAsync({
          enabled,
          message: message.trim().length === 0 ? null : message,
          level,
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
        <Switch
          data-slot={`ops-banner-switch-${variant}`}
          checked={enabled}
          disabled={pending}
          onCheckedChange={(next) => {
            setEnabled(next);
            setError(undefined);
          }}
        />
        {t(`${scope}.switchLabel`)}
      </label>

      <FieldShell
        id={`${variant}-message`}
        label={t('fields.message')}
        errorText={error}
        // Per-variant, not shared: "while the banner is on" is true of the
        // announcement and misleading for maintenance mode, which closes the
        // site rather than decorating it. Sharing the component should not mean
        // sharing copy that is only accurate for one of its two uses.
        helperText={t(`${scope}.messageHelp`)}
      >
        <Textarea
          id={`${variant}-message`}
          value={message}
          rows={3}
          maxLength={MESSAGE_MAX}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={error ? true : undefined}
        />
      </FieldShell>

      {variant === 'announcement' ? (
        <SelectField
          id="announcement-level"
          label={t('fields.level')}
          // Required by SelectFieldProps, but never rendered here: the level
          // always has a value (hydrated from the row, defaulting to info), so
          // there is no empty state for a placeholder to describe.
          placeholder={t('levels.info')}
          options={levelOptions}
          value={level}
          onValueChange={(next) => setLevel(next as AnnouncementLevel)}
          className="max-w-xs"
        />
      ) : null}

      <div>
        <Button
          type="button"
          variant={variant === 'maintenance' ? 'destructive' : 'default'}
          data-slot={`ops-banner-save-${variant}`}
          disabled={pending || settings.isPending}
          onClick={requestSave}
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
        description={
          enabled ? t(`${scope}.confirmOn`) : t(`${scope}.confirmOff`)
        }
        confirmLabel={t(`${scope}.confirmAction`)}
        cancelLabel={t('actions.cancel')}
        tone={variant === 'maintenance' ? 'destructive' : 'neutral'}
        pending={pending}
        onConfirm={() => void confirmSave()}
      />
    </Card>
  );
}
