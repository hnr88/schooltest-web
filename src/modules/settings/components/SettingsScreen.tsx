'use client';

import type { JSX } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { NotificationPreferencesPanel } from '@/modules/notifications';
import { AuthSettingsPanel } from '@/modules/settings/components/AuthSettingsPanel';
import { ChildrenSettingsPanel } from '@/modules/settings/components/ChildrenSettingsPanel';
import { SearchPreferencesForm } from '@/modules/settings/components/SearchPreferencesForm';
import { SettingsTabs } from '@/modules/settings/components/SettingsTabs';
import { PORTAL_SCREEN_CLASS } from '@/modules/settings/constants/settings.constants';
import { useSettingsTabSync } from '@/modules/settings/hooks/use-settings-tab-sync';
import type { SettingsTab } from '@/modules/settings/types/settings.types';

const SETTINGS_PANELS: Record<SettingsTab, () => JSX.Element> = {
  auth: AuthSettingsPanel,
  search: SearchPreferencesForm,
  notifications: NotificationPreferencesPanel,
  children: ChildrenSettingsPanel,
};

// Portal Settings (.qa/design/spec/03 §4.1): a 30/500 h1 over a 14px lede, then one
// 820px column of stacked PortalCards on a 22px rhythm. The design has no tabs, but
// this app's settings carry four independent surfaces (auth, search, notifications,
// children) that the portal export never had, so the DS underline tab row stays as
// the section switch. The panel is keyed on the tab so switching replays the rise.
export function SettingsScreen() {
  const t = useTranslations('Settings');
  const { tab, setTab } = useSettingsTabSync();
  const Panel = SETTINGS_PANELS[tab];

  return (
    <main
      data-surface="settings"
      className={cn(
        PORTAL_SCREEN_CLASS,
        // Slide only, no `fade-in-0`: an opacity ramp on this main would composite
        // the active blue tab label on the #EEF2F7 well below AA for the length of
        // the transition, which axe fails as SERIOUS.
        'animate-in duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none',
      )}
    >
      <header className="min-w-0">
        <h1 className="text-portal-title font-medium text-foreground">{t('title')}</h1>
        <p className="mt-1.5 text-body-md text-body">{t('subtitle')}</p>
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
