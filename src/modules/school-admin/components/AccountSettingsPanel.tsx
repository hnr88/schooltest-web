'use client';

import { SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';

// Spec section 5 and "Out of scope": the Settings sub-tab is a placeholder for
// MVP — notification preferences and the rest land later. An explicit empty
// state, never a dead control.
export function AccountSettingsPanel() {
  const t = useTranslations('SchoolAdmin.account');

  return (
    <EmptyState
      icon={SlidersHorizontal}
      title={t('settingsEmptyTitle')}
      description={t('settingsEmptyDescription')}
    />
  );
}
