'use client';

import { useLocale, useTranslations } from 'next-intl';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/design-system';
import { getPathname, usePathname } from '@/i18n/navigation';
import { isLocale } from '@/i18n/routing';
import { LOCALES, LOCALE_LABELS } from '@/modules/i18n/constants/locales.constants';

export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const pathname = usePathname();

  const handleChange = (next: string | null) => {
    if (!isLocale(next) || next === locale) return;

    const query = window.location.search.slice(1);
    const hash = window.location.hash;
    // Next's pathname hook normally excludes query/hash. Normalize defensively
    // so a cached router state cannot duplicate either part of the URL.
    const routePathname = pathname.split(/[?#]/, 1)[0] || '/';
    const routeWithQuery = `${routePathname}${query ? `?${query}` : ''}`;
    const href = `${getPathname({ href: routeWithQuery, locale: next })}${hash}`;

    // The URL is the sole locale source: English stays unprefixed and every
    // other language uses its own prefix. No locale value is persisted in a cookie.
    window.location.replace(href);
  };

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger
        aria-label={t('label')}
        className="min-h-11 w-24 border-white/50 bg-white text-navy-900 shadow-sm hover:bg-blue-50"
      >
        <SelectValue>{(value) => (isLocale(value) ? LOCALE_LABELS[value] : '')}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} side="top">
        {LOCALES.map((code) => (
          <SelectItem key={code} value={code} className="focus:**:!text-navy-900">
            {LOCALE_LABELS[code]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
