'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { UnderlineTabs } from '@/modules/design-system';
import { SETTINGS_TAB_CONFIG } from '@/modules/settings/constants/settings.constants';
import { isSettingsTab } from '@/modules/settings/lib/settings-tab';
import type { SettingsTab } from '@/modules/settings/types/settings.types';

import type { SettingsTabsProps } from '@/modules/settings/types/components.types';
import { IDLE_INK_ON_WELL } from '@/modules/settings/constants/components.constants';

export function SettingsTabs({ value, onValueChange }: SettingsTabsProps) {
  const t = useTranslations('Settings');
  const options = SETTINGS_TAB_CONFIG.map((tab) => ({
    value: tab.value,
    label: t(tab.labelKey),
  }));

  return (
    <UnderlineTabs
      options={options}
      value={value}
      onValueChange={(next) => {
        if (isSettingsTab(next)) onValueChange(next);
      }}
      ariaLabel={t('tabsLabel')}
      className={cn('overflow-x-auto', IDLE_INK_ON_WELL)}
    />
  );
}
