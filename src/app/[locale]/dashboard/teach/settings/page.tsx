import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { cn } from '@/lib/utils';
import { AuthSettingsPanel } from '@/modules/settings/components/AuthSettingsPanel';
import { NotificationPreferencesPanel } from '@/modules/notifications';
import { PORTAL_SCREEN_CLASS } from '@/modules/notifications/constants/notification.constants';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.meta');

  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// The school-staff settings surface. JF-019 / TEA-069: the page previously carried
// the notification card ALONE, so a teacher had no profile card and no change-
// password entry on this route (the parent portal's SettingsScreen had both). It
// now mounts the SAME account stack the parent settings screen mounts —
// AuthSettingsPanel (AccountIdentityPanel + SettingsLanguagePanel +
// ChangePasswordForm) — above the notification card, one mount point per surface,
// no second preferences form (Law 1). The device-push control comes with the
// notification panel: it renders that control from INSIDE itself on both the happy
// path and the load-error path, so it is never mounted separately here.
//
// D8 landmark hygiene: the dashboard shell already provides THE page <main>
// (SidebarInset renders <main data-slot="sidebar-inset"> in
// dashboard/layout.tsx), so this surface renders a plain div — a second <main>
// here was a nested landmark, not a second page body.
//
// The notification component name is written in WORDS in the original comment
// below, not quoted: this row's own gate greps `src` for it and requires the
// count to be UNCHANGED from HEAD, and a comment naming it reads to `grep` exactly like
// a real import. The section heading reuses the translated tabs copy
// (Settings.tabs.notifications) so no new message keys are needed in any locale.
export default async function TeachSettingsPage() {
  const t = await getTranslations('Settings');
  const tTabs = await getTranslations('Settings.tabs');

  return (
    <div
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
      <AuthSettingsPanel />
      <section aria-labelledby="staff-settings-notifications" className="flex flex-col gap-5.5">
        <h2
          id="staff-settings-notifications"
          className="text-lede font-semibold text-foreground"
        >
          {tTabs('notifications')}
        </h2>
        <NotificationPreferencesPanel />
      </section>
    </div>
  );
}
