'use client';

import { useTranslations } from 'next-intl';

import { TabsList, TabsTrigger } from '@/modules/design-system';
import { SETTINGS_TAB_CONFIG } from '@/modules/settings/constants/settings.constants';

export function SettingsTabs() {
  const t = useTranslations('Settings');

  return (
    <TabsList
      aria-label={t('tabsLabel')}
      className="grid h-auto w-full grid-cols-2 items-stretch gap-1 rounded-xl bg-muted p-1 group-data-horizontal/tabs:h-auto sm:flex sm:items-center sm:justify-start"
    >
      {SETTINGS_TAB_CONFIG.map((tab) => {
        const Icon = tab.icon;
        return (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="h-auto min-h-11 w-full justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:w-auto sm:flex-none sm:px-4 dark:text-slate-300 data-active:bg-card data-active:text-foreground data-active:shadow-sm"
          >
            <Icon aria-hidden="true" className="size-4" />
            {t(tab.labelKey)}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
