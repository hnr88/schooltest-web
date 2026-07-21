'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useSubscribePushMutation } from '@/modules/notifications/queries/use-subscribe-push.mutation';
import { useUnsubscribePushMutation } from '@/modules/notifications/queries/use-unsubscribe-push.mutation';
import { useVapidPublicKeyQuery } from '@/modules/notifications/queries/use-vapid-public-key.query';
import { pushSubscriptionRequestSchema } from '@/modules/notifications/schemas/push-subscription.schema';
import type {
  BrowserPushStatus,
  PushSubscriptionRequest,
} from '@/modules/notifications/types/push-subscription.types';

function supportsBrowserPush(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'PushManager' in window &&
    'serviceWorker' in navigator
  );
}

function toApplicationServerKey(value: string): ArrayBuffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = window.atob(`${normalized}${padding}`);
  const key = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(key);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return key;
}

function toSubscriptionRequest(subscription: PushSubscription): PushSubscriptionRequest {
  const json = subscription.toJSON();
  return pushSubscriptionRequestSchema.parse({
    endpoint: subscription.endpoint,
    keys: json.keys,
    expirationTime: subscription.expirationTime,
    userAgent: navigator.userAgent,
  });
}

async function registerPushWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register('/service-worker', { scope: '/' });
  await navigator.serviceWorker.ready;
  return registration;
}

function useBrowserPushSubscription() {
  const t = useTranslations('Settings');
  const vapidQuery = useVapidPublicKeyQuery();
  const { mutateAsync: subscribe } = useSubscribePushMutation();
  const { mutateAsync: unsubscribe } = useUnsubscribePushMutation();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [browserStatus, setBrowserStatus] = useState<BrowserPushStatus>('checking');
  const [isActionPending, setIsActionPending] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSubscription() {
      if (!supportsBrowserPush()) {
        if (active) setBrowserStatus('unsupported');
        return;
      }
      try {
        const registration = await registerPushWorker();
        const current = await registration.pushManager.getSubscription();
        if (!active) return;
        setSubscription(current);
        if (current) setBrowserStatus('subscribed');
        else setBrowserStatus(Notification.permission === 'denied' ? 'permission-denied' : 'ready');
      } catch {
        if (active) setBrowserStatus('error');
      }
    }

    void loadSubscription();
    return () => {
      active = false;
    };
  }, []);

  const enable = useCallback(async () => {
    const publicKey = vapidQuery.data;
    if (!publicKey || !supportsBrowserPush()) return;
    if (Notification.permission === 'denied') {
      setBrowserStatus('permission-denied');
      return;
    }

    setIsActionPending(true);
    try {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setBrowserStatus('permission-denied');
          return;
        }
      }
      const registration = await registerPushWorker();
      const current =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          applicationServerKey: toApplicationServerKey(publicKey),
          userVisibleOnly: true,
        }));
      await subscribe(toSubscriptionRequest(current));
      setSubscription(current);
      setBrowserStatus('subscribed');
      toast.success(t('notificationPreferences.push.enabled'));
    } catch {
      setBrowserStatus('error');
      toast.error(t('notificationPreferences.push.enableError'));
    } finally {
      setIsActionPending(false);
    }
  }, [subscribe, t, vapidQuery.data]);

  const disable = useCallback(async () => {
    if (!subscription) return;

    setIsActionPending(true);
    try {
      const request = toSubscriptionRequest(subscription);
      await unsubscribe({ endpoint: request.endpoint });
      await subscription.unsubscribe();
      setSubscription(null);
      setBrowserStatus('ready');
      toast.success(t('notificationPreferences.push.disabled'));
    } catch {
      setBrowserStatus('error');
      toast.error(t('notificationPreferences.push.disableError'));
    } finally {
      setIsActionPending(false);
    }
  }, [subscription, t, unsubscribe]);

  let status = browserStatus;
  if (!subscription) {
    if (vapidQuery.isLoading || browserStatus === 'checking') status = 'checking';
    else if (vapidQuery.isError) status = 'error';
    else if (vapidQuery.data === null) status = 'not-configured';
  }

  return {
    status,
    isSubscribed: subscription !== null,
    isActionPending,
    // A worker-side error can be retried only when a parsed VAPID key is still
    // available. A failed config request has no key, so an enabled button would
    // be a no-op; keep that control honestly unavailable instead.
    canEnable: status === 'ready' || (status === 'error' && typeof vapidQuery.data === 'string'),
    enable,
    disable,
  };
}

export { useBrowserPushSubscription };
