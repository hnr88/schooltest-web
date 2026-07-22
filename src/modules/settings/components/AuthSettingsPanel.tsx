'use client';

import { useTranslations } from 'next-intl';

import { ChangePasswordForm } from '@/modules/auth';
import { AccountSummaryPanel } from '@/modules/settings/components/AccountSummaryPanel';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';

// Canonical "Parent settings" composition: two equal columns at a 20px gutter,
// top-aligned. The password fields therefore measure ~500px, matching the
// canonical Profile-card fields, instead of stretching the full content width.
export function AuthSettingsPanel() {
  const t = useTranslations('Settings');

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <SettingsPanel
        id="settings-auth"
        title={t('changePasswordTitle')}
        description={t('changePasswordSubtitle')}
      >
        <ChangePasswordForm />
      </SettingsPanel>
      <AccountSummaryPanel />
    </div>
  );
}
