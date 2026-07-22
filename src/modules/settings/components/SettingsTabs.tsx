'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { UnderlineTabs } from '@/modules/design-system';
import { SETTINGS_TAB_CONFIG } from '@/modules/settings/constants/settings.constants';
import { isSettingsTab } from '@/modules/settings/lib/settings-tab';
import type { SettingsTab } from '@/modules/settings/types/settings.types';

interface SettingsTabsProps {
  value: SettingsTab;
  onValueChange: (tab: SettingsTab) => void;
}

// DS §5.6 underline tabs: a hairline rule with 26px-gapped 14/600 labels and a
// 2px active underline — not the stretched full-width segmented slab this screen
// used to draw. The canonical control is intrinsically sized and left-aligned.
// The row scrolls sideways on narrow viewports so four labels never make the
// page body scroll horizontally.
// CONTRAST-SPEC.md: "Text directly on the well moves #64748B → #475569. NOT a
// style choice — forced by AA." §5.6's idle ink is 4.76:1 on white but 4.23:1 on
// the deepened well this strip sits on, so the consumer that puts the control
// there re-inks the IDLE label only: :not([data-active]) leaves the active blue
// untouched, and the :hover rule outranks it so the navy hover survives.
const IDLE_INK_ON_WELL =
  '[&_[data-slot=tabs-trigger]:not([data-active])]:text-body [&_[data-slot=tabs-trigger]:not([data-active]):hover]:text-foreground';

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
