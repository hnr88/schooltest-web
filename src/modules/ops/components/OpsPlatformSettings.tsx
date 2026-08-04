'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, Card } from '@/modules/design-system';
import { SETTINGS_GROUPS } from '@/modules/ops/constants/ops-settings.constants';
import { OpsSettingsControl } from '@/modules/ops/components/OpsSettingsControl';
import { OpsTestEmailPanel } from '@/modules/ops/components/OpsTestEmailPanel';
import { usePlatformSettingsForm } from '@/modules/ops/hooks/use-platform-settings-form';

// C-SET-02/03 — the ops platform settings screen. Every value here is read from
// and written to the real single-type row; nothing is local state that looks
// saved. Server-side validation errors are mapped onto the exact inputs.
export function OpsPlatformSettings() {
  const t = useTranslations('Ops.settings');
  const { form, query, handleSubmit, isSaving } = usePlatformSettingsForm();

  if (query.isError) {
    return (
      <Alert variant="error" title={t('errorTitle')}>
        {t('errorDescription')}
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {SETTINGS_GROUPS.map((group) => (
        <Card key={group.id} className="flex flex-col gap-5 p-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t(`groups.${group.id}.title`)}</h2>
            <p className="mt-1 text-sm text-body">{t(`groups.${group.id}.description`)}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {group.fields.map((field) => (
              <OpsSettingsControl
                key={field}
                form={form}
                field={field}
                label={t(`fields.${field}.label`)}
                helperText={t(`fields.${field}.helper`)}
                optionLabel={(option) => t(`options.${option}`)}
              />
            ))}
          </div>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSaving || query.isLoading}>
          {isSaving ? t('saving') : t('save')}
        </Button>
        {form.formState.isDirty ? (
          <span className="text-sm text-body">{t('unsaved')}</span>
        ) : null}
      </div>

      <OpsTestEmailPanel />
    </form>
  );
}
