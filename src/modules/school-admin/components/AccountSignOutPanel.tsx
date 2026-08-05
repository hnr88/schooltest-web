'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';
import { useAccountSignOut } from '@/modules/school-admin/hooks/use-account-sign-out';

// Spec section 5: opening the "Sign out" sub-tab signs the user out and
// redirects to login. This panel is what shows for the frame between the two.
export function AccountSignOutPanel() {
  const t = useTranslations('SchoolAdmin.account');
  useAccountSignOut();

  return (
    <EmptyState
      icon={LogOut}
      title={t('signOutTitle')}
      description={t('signOutDescription')}
    />
  );
}
