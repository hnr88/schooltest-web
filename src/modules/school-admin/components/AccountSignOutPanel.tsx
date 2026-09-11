'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { EmptyState } from '@/modules/design-system';
import { useAccountSignOut } from '@/modules/school-admin/hooks/use-account-sign-out';

// VIEW 6 "Sign out" tab (School Admin Portal.dc.html:891-900): the same plain
// white 24-radius card as the Settings placeholder. Spec section 5: opening
// the tab signs the user out and redirects to login — the card is what shows
// for the frame between the two, so it carries no controls of its own.
export function AccountSignOutPanel() {
  const t = useTranslations('SchoolAdmin.account');
  useAccountSignOut();

  return (
    <EmptyState
      icon={LogOut}
      title={t('signOutTitle')}
      description={t('signOutDescription')}
      className="rounded-card border-0 bg-card px-7.5 py-14 shadow-sm"
    />
  );
}
