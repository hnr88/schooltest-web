'use client';

import type { JSX } from 'react';
import { useTranslations } from 'next-intl';

import { NotificationPreferencesPanel } from '@/modules/notifications';
import { AuthSettingsPanel } from '@/modules/settings/components/AuthSettingsPanel';
import { ChildrenSettingsPanel } from '@/modules/settings/components/ChildrenSettingsPanel';
import { SearchSettingsPanel } from '@/modules/settings/components/SearchSettingsPanel';
import { SettingsTabs } from '@/modules/settings/components/SettingsTabs';
import { useSettingsTabSync } from '@/modules/settings/hooks/use-settings-tab-sync';
import type { SettingsTab } from '@/modules/settings/types/settings.types';

const SETTINGS_PANELS: Record<SettingsTab, () => JSX.Element> = {
  auth: AuthSettingsPanel,
  search: SearchSettingsPanel,
  notifications: NotificationPreferencesPanel,
  children: ChildrenSettingsPanel,
};

// Canonical "Parent settings" screen: a 26px page title, the underline tab row,
// then the panel column on a 20px rhythm. The panel is keyed on the tab so
// switching sections replays the short rise-and-fade.
export function SettingsScreen() {
  const t = useTranslations('Settings');
  const { tab, setTab } = useSettingsTabSync();
  const Panel = SETTINGS_PANELS[tab];

  return (
    <main className="flex flex-1 animate-in flex-col gap-5 px-4 py-6 duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none sm:px-6 lg:px-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-page-title font-bold text-foreground">{t('title')}</h1>
        <p className="text-lede text-body">{t('subtitle')}</p>
      </header>
      <SettingsTabs value={tab} onValueChange={setTab} />
      <div
        key={tab}
        role="tabpanel"
        aria-label={t(`tabs.${tab}`)}
        className="animate-in duration-200 ease-out-expo fade-in-0 slide-in-from-bottom-1 motion-reduce:animate-none"
      >
        <Panel />
      </div>
    </main>
  );
}
