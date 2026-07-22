'use client';

import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { LOCALES, LOCALE_LABELS } from '@/modules/i18n';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';
import {
  PORTAL_PILL_CLASS,
  PORTAL_PILL_IDLE_CLASS,
  PORTAL_PILL_SELECTED_CLASS,
} from '@/modules/settings/constants/settings.constants';

// Language card (.qa/design/spec/03 §4.1 section 2): a wrapped row of PortalChip
// pills. The URL is this app's only locale source (routing.localeCookie is false), so
// each pill is a real link to the same route under another prefix — no fake
// preference that nothing persists.
export function SettingsLanguagePanel() {
  const t = useTranslations('Settings');
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const href = query ? `${pathname}?${query}` : pathname;

  return (
    <SettingsPanel
      id="settings-language"
      title={t('language.title')}
      description={t('language.description')}
    >
      <div className="flex flex-wrap gap-2">
        {LOCALES.map((code) => {
          const active = code === locale;
          return (
            <Link
              key={code}
              href={href}
              locale={code}
              aria-current={active ? 'true' : undefined}
              className={cn(
                PORTAL_PILL_CLASS,
                active ? PORTAL_PILL_SELECTED_CLASS : PORTAL_PILL_IDLE_CLASS,
              )}
            >
              {LOCALE_LABELS[code]}
            </Link>
          );
        })}
      </div>
    </SettingsPanel>
  );
}
