'use client';

import { useTranslations } from 'next-intl';

import { TabsList, TabsTrigger } from '@/modules/design-system';
import { SETTINGS_TAB_CONFIG } from '@/modules/settings/constants/settings.constants';

export function SettingsTabs() {
  const t = useTranslations('Settings');

  return (
    <TabsList
      aria-label={t('tabsLabel')}
      className="w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted p-1"
    >
      {SETTINGS_TAB_CONFIG.map((tab) => {
        const Icon = tab.icon;
        return (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="min-h-11 flex-none gap-2 rounded-lg px-4 text-sm font-semibold text-slate-700 transition-colors duration-150 ease-out hover:bg-card hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none dark:text-slate-300 data-active:bg-card data-active:text-foreground data-active:shadow-sm"
          >
            <Icon aria-hidden="true" className="size-4" />
            {t(tab.labelKey)}
          </TabsTrigger>
        );
      })}
    </TabsList>
  );
}
