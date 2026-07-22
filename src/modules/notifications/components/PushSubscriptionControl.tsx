'use client';

import { BellRing } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge, Button } from '@/modules/design-system';
import { PUSH_STATUS_CONFIG } from '@/modules/notifications/constants/push-subscription.constants';
import { useBrowserPushSubscription } from '@/modules/notifications/hooks/use-browser-push-subscription';

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
    <section
      aria-labelledby="notification-push-title"
      data-surface="push-subscription-control"
      className="flex flex-col gap-4 rounded-panel border border-border bg-card p-6.5 shadow-sm"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-tile bg-primary text-primary-foreground">
          <BellRing aria-hidden="true" className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id="notification-push-title"
              className="text-panel-title font-semibold text-foreground"
            >
              {t('notificationPreferences.push.title')}
            </h3>
            <Badge variant={config.variant}>{t(config.labelKey)}</Badge>
          </div>
          <p id="notification-push-description" className="text-body-sm text-muted-foreground">
            {t('notificationPreferences.push.description')}
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant={push.isSubscribed ? 'outline' : 'default'}
        className="min-h-11 shrink-0 self-start px-4 disabled:bg-muted disabled:text-foreground disabled:opacity-100"
        aria-describedby="notification-push-description"
        disabled={isDisabled}
        loading={push.isActionPending}
        onClick={push.isSubscribed ? push.disable : push.enable}
      >
        {actionLabel}
      </Button>
    </section>
  );
}

export { PushSubscriptionControl };
