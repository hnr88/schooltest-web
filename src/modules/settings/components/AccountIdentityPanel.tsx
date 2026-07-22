'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { useAuth } from '@/modules/auth';
import { KeyValueList, KeyValueRow, Skeleton, StatusBadge } from '@/modules/design-system';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';

// Account card (.qa/design/spec/03 §4.1 section 1): a 54px navy initial disc, the
// 15/600 account name and a 13px meta line, all in one PortalCard.
// The design's `Edit` action is deliberately absent: the API exposes no
// profile-update endpoint, so a button that cannot save anything would be a lie.
// Every value below is the real /api/users/me payload.
export function AccountIdentityPanel() {
  const t = useTranslations('Settings');
  const format = useFormatter();
  const { user, isLoading } = useAuth();

  if (isLoading || !user) {
    return <Skeleton aria-hidden="true" className="h-56 w-full rounded-card" />;
  }

  return (
    <SettingsPanel id="settings-account" title={t('account.title')}>
      <div className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden="true"
          className="grid size-13.5 shrink-0 place-items-center rounded-full bg-navy-900 text-h4 font-semibold text-primary-foreground"
        >
          {user.username.slice(0, 1).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate text-lede font-semibold text-foreground">{user.username}</p>
          <p className="mt-0.5 truncate text-caption text-body">{user.email}</p>
        </div>
      </div>
      <KeyValueList className="mt-5 [&_dt]:text-body">
        <KeyValueRow label={t('account.confirmedLabel')}>
          <StatusBadge
            status={user.confirmed ? 'live' : 'draft'}
            label={t(user.confirmed ? 'account.confirmed' : 'account.unconfirmed')}
          />
        </KeyValueRow>
        {user.createdAt ? (
          <KeyValueRow label={t('account.memberSinceLabel')}>
            {format.dateTime(new Date(user.createdAt), {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </KeyValueRow>
        ) : null}
      </KeyValueList>
    </SettingsPanel>
  );
}
