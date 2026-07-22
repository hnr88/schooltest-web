'use client';

import { Compass, Plus } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

// Portal greeting row (spec 01 §2): a 13px date line above a 32px/500 headline,
// the trailing cluster right-aligned on the same `items-end` baseline, the whole
// row wrapping at narrow widths.
//
// The design's trailing cluster is a search pill and a bell. Both already ship in
// the app topbar 64px above this row, so re-drawing them here would be a second
// copy of live chrome; the two destinations the overview actually owns take that
// slot instead.
export function DashboardGreeting({ name }: { name: string }) {
  const format = useFormatter();
  const t = useTranslations('Dashboard');

  return (
    <header className="flex flex-wrap items-end justify-between gap-x-5 gap-y-4">
      <div className="flex min-w-0 flex-col gap-1.5">
        {/* #7C8698 has no token and fails AA on the well besides; --color-body
            (#475569, 6.74:1) is the canonical DS Body ink for this line. */}
        <p className="text-body-sm text-body">
          {format.dateTime(new Date(), { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-h2 font-medium text-balance text-foreground">
          {t('welcomeTitle', { name })}
        </h1>
        <p className="text-lede text-body">{t('welcomeSubtitle')}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button href="/dashboard/search?mode=schools" variant="outline">
          <Compass aria-hidden="true" className="size-4" />
          {t('exploreSchools')}
        </Button>
        <Button href="/dashboard/children/new">
          <Plus aria-hidden="true" className="size-4" strokeWidth={2.4} />
          {t('addStudent')}
        </Button>
      </div>
    </header>
  );
}
