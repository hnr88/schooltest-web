'use client';

import { useTranslations } from 'next-intl';

import { Tabs, TabsContent } from '@/modules/design-system';
import { AuthSettingsPanel } from '@/modules/settings/components/AuthSettingsPanel';
import { ChildrenSettingsPanel } from '@/modules/settings/components/ChildrenSettingsPanel';
import { SearchSettingsPanel } from '@/modules/settings/components/SearchSettingsPanel';
import { SettingsTabs } from '@/modules/settings/components/SettingsTabs';
import { useSettingsTabSync } from '@/modules/settings/hooks/use-settings-tab-sync';
import { isSettingsTab } from '@/modules/settings/lib/settings-tab';

export function SettingsScreen() {
  const t = useTranslations('Settings');
  const { tab, setTab } = useSettingsTabSync();

  return (
    <main className="flex flex-1 animate-in flex-col gap-6 px-8 py-7 duration-300 ease-out slide-in-from-bottom-2 motion-reduce:animate-none">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <Tabs value={tab} onValueChange={(value) => isSettingsTab(value) && setTab(value)}>
        <SettingsTabs />
        <TabsContent value="auth" className="pt-6">
          <AuthSettingsPanel />
        </TabsContent>
        <TabsContent value="search" className="pt-6">
          <SearchSettingsPanel />
        </TabsContent>
        <TabsContent value="children" className="pt-6">
          <ChildrenSettingsPanel />
        </TabsContent>
      </Tabs>
    </main>
  );
}
