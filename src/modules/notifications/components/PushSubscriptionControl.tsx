'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { Button, DataPanel, StatusPill } from '@/modules/design-system';
import { PORTAL_CARD_CLASS } from '@/modules/notifications/constants/notification.constants';
import { PUSH_STATUS_CONFIG } from '@/modules/notifications/constants/push-subscription.constants';
import { useBrowserPushSubscription } from '@/modules/notifications/hooks/use-browser-push-subscription';

// The "Password & security" card shape (.qa/design/spec/03 §4.1 section 4): a 22px/30px
// card that is ONE row — 14/600 title over a 12.5px caption, ghost button pinned right.
// The control is ALWAYS rendered with its real status: when it cannot act it stays
// visible and disabled. It must never disappear, and never become an enabled no-op.
function PushSubscriptionControl() {
  const t = useTranslations('Settings');
  const push = useBrowserPushSubscription();
  const config = PUSH_STATUS_CONFIG[push.status];
  const isDisabled = push.isActionPending || (!push.isSubscribed && !push.canEnable);
  const actionLabel = push.isSubscribed
    ? push.isActionPending
      ? t('notificationPreferences.push.disabling')
      : t('notificationPreferences.push.disable')
    : push.isActionPending
      ? t('notificationPreferences.push.enabling')
      : t('notificationPreferences.push.enable');

  return (
    <DataPanel
      aria-labelledby="notification-push-title"
      data-surface="push-subscription-control"
      className={cn(
        PORTAL_CARD_CLASS,
        'flex flex-wrap items-center gap-4 px-7.5 py-5.5 sm:flex-nowrap',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 id="notification-push-title" className="text-body-md font-semibold text-foreground">
            {t('notificationPreferences.push.title')}
          </h2>
          <StatusPill tone={config.tone}>{t(config.labelKey)}</StatusPill>
        </div>
        <p id="notification-push-description" className="mt-1 text-meta text-body">
          {t('notificationPreferences.push.description')}
        </p>
      </div>
      <Button
        type="button"
        variant={push.isSubscribed ? 'outline' : 'default'}
        className="min-h-11 shrink-0 rounded-full px-4.5 disabled:bg-muted disabled:text-foreground disabled:opacity-100"
        aria-describedby="notification-push-description"
        disabled={isDisabled}
        loading={push.isActionPending}
        onClick={push.isSubscribed ? push.disable : push.enable}
      >
        {actionLabel}
      </Button>
    </DataPanel>
  );
}

export { PushSubscriptionControl };
