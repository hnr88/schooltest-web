'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, Card, FieldShell, Input } from '@/modules/design-system';
import { SETTINGS_GROUPS } from '@/modules/ops/constants/ops-settings.constants';
import { OpsSettingsControl } from '@/modules/ops/components/OpsSettingsControl';
import { OpsTestEmailPanel } from '@/modules/ops/components/OpsTestEmailPanel';
import {
  useOpsProfileForm,
  usePlatformSettingsForm,
} from '@/modules/ops/hooks/use-platform-settings-form';

// C-SET-02/03, C-OPS-PORTAL-067 — the ops platform settings screen. Every value
// here is read from and written to the real single-type row; nothing is local
// state that looks saved. Server-side validation errors are mapped onto the
// exact inputs.
//
// The three states are kept VISIBLY distinct. A failed read used to render the
// same empty inputs as a slow one, so "the API is down" and "nothing is
// configured" looked identical; the error surface now names the failure and
// offers a real retry, and the loading surface says it is still loading.
//
// The internal operations account card is a separate surface on the same route
// (C-OPS-PORTAL-031), rendered in every settings state above the ops-only form.
// It lives in THIS file because task 31 creates no new files; the fold takes
// the component past the 120-line convention on purpose.
export function OpsPlatformSettings() {
  const t = useTranslations('Ops.settings');
  const tCommon = useTranslations('Common');
  const { form, query, handleSubmit, isSaving } = usePlatformSettingsForm();

  return (
    <div className="flex flex-col gap-6">
      <OpsAccountCard />
      {query.isError ? (
        <Alert
          variant="error"
          title={t('errorTitle')}
          action={
            <Button
              type="button"
              variant="outline"
              data-ops-action="settings-retry"
              onClick={() => void query.refetch()}
            >
              {tCommon('retry')}
            </Button>
          }
        >
          {t('errorDescription')}
        </Alert>
      ) : query.isPending ? (
        <div
          data-surface="ops-platform-settings"
          data-state="loading"
          role="status"
          aria-live="polite"
          className="rounded-xl border bg-card p-6 text-sm text-body"
        >
          {tCommon('loading')}
        </div>
      ) : (
        <form
          data-surface="ops-platform-settings"
          data-ops-scope="ops-only"
          data-state="ready"
          onSubmit={handleSubmit}
          className="flex flex-col gap-6"
        >
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
      )}
    </div>
  );
}

// C-OPS-PORTAL-031 — rename your own account. The only write support may
// perform; the server refuses anything but first_name/last_name on the
// JWT-resolved user. Saved names invalidate actor, capabilities and the auth
// profile, so the header updates after save and clears on logout.
function OpsAccountCard() {
  const { t, form, handleSubmit, isSaving } = useOpsProfileForm();
  const errors = form.formState.errors;

  return (
    <Card
      className="flex flex-col gap-5 p-6"
      data-slot="ops-account-card"
      data-ops-scope="ops-account"
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('title')}</h2>
        <p className="mt-1 text-sm text-body">{t('description')}</p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid gap-5 sm:grid-cols-2">
          <FieldShell
            id="ops-profile-first-name"
            label={t('firstName')}
            errorText={errors.first_name?.message}
          >
            <Input id="ops-profile-first-name" autoComplete="given-name" {...form.register('first_name')} />
          </FieldShell>
          <FieldShell
            id="ops-profile-last-name"
            label={t('lastName')}
            errorText={errors.last_name?.message}
          >
            <Input id="ops-profile-last-name" autoComplete="family-name" {...form.register('last_name')} />
          </FieldShell>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={isSaving || !form.formState.isDirty}>
            {isSaving ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
