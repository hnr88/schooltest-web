'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { useAuth } from '@/modules/auth';
import { PersonCell, Skeleton, StatusBadge } from '@/modules/design-system';
import { SettingsFactRow } from '@/modules/settings/components/SettingsFactRow';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';

// The canonical Parent-settings screen pairs the editable card with an identity
// card in the second column. This one is read-only because the API exposes no
// profile-update endpoint yet — every value below comes from /api/users/me.
// The avatar tint is pinned rather than derived: the palette's teal pair only
// reaches 4.33:1, so a username that hashed to it would fail contrast.
export function AccountSummaryPanel() {
  const t = useTranslations('Settings');
  const format = useFormatter();
  const { user, isLoading } = useAuth();

  return (
    <SettingsPanel
      id="settings-account"
      title={t('account.title')}
      description={t('account.description')}
    >
      {isLoading || !user ? (
        <div aria-hidden="true" className="flex flex-col gap-3">
          <Skeleton className="h-8.5 w-56" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="border-b border-divider pb-4">
            <PersonCell name={user.username} secondary={user.email} size="md" tone="blue" />
          </div>
          <SettingsFactRow label={t('account.emailLabel')}>{user.email}</SettingsFactRow>
          <SettingsFactRow label={t('account.confirmedLabel')}>
            <StatusBadge
              status={user.confirmed ? 'live' : 'draft'}
              label={t(user.confirmed ? 'account.confirmed' : 'account.unconfirmed')}
            />
          </SettingsFactRow>
          {user.createdAt ? (
            <SettingsFactRow label={t('account.memberSinceLabel')}>
              {format.dateTime(new Date(user.createdAt), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </SettingsFactRow>
          ) : null}
        </div>
      )}
    </SettingsPanel>
  );
}
