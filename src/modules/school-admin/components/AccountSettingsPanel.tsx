'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';

// VIEW 6 "Settings" tab (School Admin Portal.dc.html:881-889): the centered
// placeholder INSIDE a plain white 24-radius card — no dashed box. Settings
// are a placeholder for MVP — notification preferences and the rest land
// later. An explicit empty state, never a dead control.
export function AccountSettingsPanel() {
  const t = useTranslations('SchoolAdmin.account');

  return (
    <EmptyState
      icon={SlidersHorizontal}
      title={t('settingsEmptyTitle')}
      description={t('settingsEmptyDescription')}
      className="rounded-card border-0 bg-card px-7.5 py-14 shadow-sm"
    />
  );
}
