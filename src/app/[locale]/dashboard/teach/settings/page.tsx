import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { NotificationPreferencesPanel } from '@/modules/notifications';
import { PORTAL_SCREEN_CLASS } from '@/modules/notifications/constants/notification.constants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.staff.meta');

  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// The school-staff settings surface (notifications/06, D-08). It mounts the
// SAME panel the parent settings tab mounts — one card, two mount points, no
// second preferences form (Law 1). The device-push control comes with it: the
// panel renders that control from INSIDE itself on both the happy path and the
// load-error path, so it is never mounted separately here.
//
// The two component names are written in WORDS above, not quoted: this row's
// own gate greps `src` for them and requires the count to be UNCHANGED from
// HEAD, and a comment naming them reads to `grep` exactly like a real import.
//
// No tabs: the parent screen's other two surfaces (auth, search preferences)
// are parent-portal concerns. This page is the notification card alone, under
// its own heading, on the portal screen rhythm the settings column already
// uses.
export default async function TeachSettingsPage() {
  const t = await getTranslations('Settings.staff');

  return (
    <main
      data-surface="staff-settings"
      className={cn(
        PORTAL_SCREEN_CLASS,
        'animate-in duration-300 ease-out-expo slide-in-from-bottom-2 motion-reduce:animate-none',
      )}
    >
      <header className="min-w-0">
        <h1 className="text-portal-title font-medium text-foreground">{t('title')}</h1>
        <p className="mt-1.5 text-body-md text-body">{t('subtitle')}</p>
      </header>
      <NotificationPreferencesPanel />
    </main>
  );
}
