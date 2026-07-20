'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/design-system';
import { LOCALE_COOKIE } from '@/i18n/routing';
import { LOCALES, LOCALE_LABELS } from '@/modules/i18n/constants/locales.constants';

export function LocaleSwitcher() {
  const t = useTranslations('LocaleSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: string | null) => {
    if (!next) return;
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => router.refresh());
  };

  return (
    <Select value={locale} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        aria-label={t('label')}
        className="min-h-11 w-32 border-white/50 bg-white text-navy-900 shadow-sm hover:bg-blue-50"
      >
        <SelectValue />
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
