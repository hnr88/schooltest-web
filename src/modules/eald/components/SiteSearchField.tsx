'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

import { useRouter } from '@/i18n/navigation';
import { Button, Input, Label } from '@/modules/design-system';

// D-04: the masthead search submits to the app's real search surface,
// `/dashboard/search?mode=schools` — the destination the utility bar and footer
// already use for SchoolSearch, with `?mode=` as its only URL-synced state.
// No endpoint, no q param, no client-side index.
function SiteSearchField() {
  const t = useTranslations('Eald');
  const router = useRouter();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push({ pathname: '/dashboard/search', query: { mode: 'schools' } });
  };

  return (
    <form role="search" onSubmit={handleSearch} className="hidden items-center gap-2.5 lg:flex">
      <Label htmlFor="site-search" className="shrink-0 text-body-sm font-semibold text-navy-800">
        {t('nav.searchLabel')}
      </Label>
      <div className="relative flex items-center">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground"
        />
        <Input
          id="site-search"
          name="site-search"
          type="search"
          placeholder={t('nav.searchPlaceholder')}
          className="h-11 w-64 pl-10"
        />
      </div>
      <Button type="submit" variant="navy" className="h-11 shrink-0 rounded-lg px-5 text-body-sm">
        {t('nav.searchSubmit')}
      </Button>
    </form>
  );
}

export { SiteSearchField };
