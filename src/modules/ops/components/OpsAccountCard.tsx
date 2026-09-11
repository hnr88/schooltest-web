'use client';

import { useState } from 'react';

import { useCapabilitiesQuery } from '@/modules/ops/queries/use-capabilities.query';
import { useOpsProfileForm } from '@/modules/ops/hooks/use-platform-settings-form';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FieldShell,
  Input,
} from '@/modules/design-system';

// C-OPS-PORTAL-031 — rename your own account. The only write support may
// perform; the server refuses anything but first_name/last_name on the
// JWT-resolved user. Saved names invalidate actor, capabilities and the auth
// profile, so the header updates after save and clears on logout.
//
// The drawn Settings screen (`Ops Portal.dc.html:537-541`) is a profile card:
// navy avatar initial, name, email · role, and an Edit pill. The rename form
// lives behind that pill in a design-system Dialog. The data markers below are
// load-bearing — `ops-portal/settings.spec.ts:106` keys on both (D-33).
export function OpsAccountCard() {
  const { t, form, handleSubmit, isSaving } = useOpsProfileForm();
  const errors = form.formState.errors;
  const query = useCapabilitiesQuery();
  const actor = query.data?.actor;
  const [open, setOpen] = useState(false);

  const name = actor ? [actor.first_name, actor.last_name].filter(Boolean).join(' ') : '';
  const initial = (actor?.first_name?.[0] ?? actor?.email?.[0] ?? '').toUpperCase();

  return (
    <div
      data-slot="ops-account-card"
      data-ops-scope="ops-account"
      className="flex items-center gap-4 rounded-[24px] bg-white px-[30px] py-[26px] shadow-[0_1px_2px_rgba(14,35,80,0.04)]"
    >
      <span className="grid size-[54px] shrink-0 place-items-center rounded-full bg-[#0E2350] text-[18px] font-semibold text-white">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold text-[#0E2350]">{name || t('title')}</p>
        {actor ? (
          <p className="mt-0.5 text-[13px] text-[#7C8698]">
            {actor.email} · {t('role')}
          </p>
        ) : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button type="button" variant="outline" data-testid="ops-account-edit" className="rounded-full border-[#D8DFEA] px-[18px] py-2.5 text-[13px] font-semibold text-[#0E2350] hover:border-[#0E2350]" />}>
          {t('edit')}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-body">{t('description')}</p>
          <form
            onSubmit={async (event) => {
              await handleSubmit(event);
              setOpen(false);
            }}
            className="flex flex-col gap-4"
          >
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
