'use client';

import { useTranslations } from 'next-intl';

import { ChangePasswordForm } from '@/modules/auth';
import { AccountIdentityPanel } from '@/modules/settings/components/AccountIdentityPanel';
import { SettingsLanguagePanel } from '@/modules/settings/components/SettingsLanguagePanel';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';
import { SAVE_AFFORDANCE } from '@/modules/settings/constants/components.constants';

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
