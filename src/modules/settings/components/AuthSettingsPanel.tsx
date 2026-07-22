'use client';

import { useTranslations } from 'next-intl';

import { ChangePasswordForm } from '@/modules/auth';
import { AccountIdentityPanel } from '@/modules/settings/components/AccountIdentityPanel';
import { SettingsLanguagePanel } from '@/modules/settings/components/SettingsLanguagePanel';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';

// Portal settings order (.qa/design/spec/03 §4.1): Account, Language, then Password &
// security — four stacked cards in one scrolling column, never a two-column grid.
// SAVE_AFFORDANCE: the canonical primary button sits at `align-self:flex-start` at the
// END of the panel it belongs to. ChangePasswordForm lives in @/modules/auth and is
// outside this task's scope, so the correction is applied from the panel that hosts it.
const SAVE_AFFORDANCE = '[&_form>div:last-child]:justify-start';

export function AuthSettingsPanel() {
  const t = useTranslations('Settings');

  return (
    <div className="flex flex-col gap-5.5">
      <AccountIdentityPanel />
      <SettingsLanguagePanel />
      <SettingsPanel
        id="settings-auth"
        title={t('changePasswordTitle')}
        description={t('changePasswordSubtitle')}
        className={SAVE_AFFORDANCE}
      >
        <ChangePasswordForm />
      </SettingsPanel>
    </div>
  );
}
