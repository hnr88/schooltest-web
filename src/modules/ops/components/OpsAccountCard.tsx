'use client';

import { Button, Card, FieldShell, Input } from '@/modules/design-system';
import { useOpsProfileForm } from '@/modules/ops/hooks/use-platform-settings-form';

// C-OPS-PORTAL-031 — rename your own account. The only write support may
// perform; the server refuses anything but first_name/last_name on the
// JWT-resolved user. Saved names invalidate actor, capabilities and the auth
// profile, so the header updates after save and clears on logout.
//
// Extracted verbatim from OpsPlatformSettings.tsx:112-151 (task 42, R-15): the
// six-group platform-settings form and its panels retired around it, but this
// card is the drawn Settings screen (`Ops Portal.dc.html:537-541`) and gets
// stronger, not weaker. The data markers below are load-bearing —
// `ops-portal/settings.spec.ts:185` keys on both (decisions.md#D-33).
export function OpsAccountCard() {
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
