import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ChangePasswordForm } from '@/modules/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/modules/design-system';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Settings.meta');
  return {
    title: t('title'),
    description: t('description'),
    openGraph: { title: t('title'), description: t('description') },
  };
}

// The parent auth gate lives in the dashboard layout (task 012) — no per-page
// guard. Content column caps at ~640px (C-UI-AUTH-PAGES change slice); the
// sectioned layout leaves room for the future profile form section.
export default async function SettingsPage() {
  const t = await getTranslations('Settings');

  return (
    // Entrance is transform-only (no fade) — the DashboardScreen precedent:
    // an opacity ramp makes axe's color-contrast scan time-sensitive.
    <main className="flex flex-1 flex-col px-8 py-7 duration-300 ease-out animate-in slide-in-from-bottom-2 motion-reduce:animate-none">
      <div className="flex w-full max-w-160 flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </header>
        <section aria-labelledby="settings-change-password-title">
          <Card className="rounded-2xl [--card-spacing:--spacing(7)]">
            <CardHeader>
              <CardTitle id="settings-change-password-title" className="font-semibold">
                {t('changePasswordTitle')}
              </CardTitle>
              <CardDescription>{t('changePasswordSubtitle')}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChangePasswordForm />
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
