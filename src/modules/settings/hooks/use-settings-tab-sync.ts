'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { SETTINGS_TAB_PARAM } from '@/modules/settings/constants/settings.constants';
import { coerceSettingsTab } from '@/modules/settings/lib/settings-tab';
import type { SettingsTab } from '@/modules/settings/types/settings.types';

interface SettingsTabSync {
  tab: SettingsTab;
  setTab: (tab: SettingsTab) => void;
}

export function useSettingsTabSync(): SettingsTabSync {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = coerceSettingsTab(searchParams.get(SETTINGS_TAB_PARAM));

  const setTab = useCallback(
    (next: SettingsTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(SETTINGS_TAB_PARAM, next);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams],
  );

  return { tab, setTab };
}
