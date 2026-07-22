'use client';

import { Compass, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';

export function DashboardGreeting({ name }: { name: string }) {
  const t = useTranslations('Dashboard');

  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-page-title font-bold text-foreground">
          {t('welcomeTitle', { name })}
        </h1>
        {/* This line sits DIRECTLY on the well, not on a white panel:
            #64748B (--muted-foreground) is 4.51:1 on #F7F9FC but only 4.23:1 on
            #EEF2F7 — it fails AA on the deepened surface. --color-body (#475569) is
            the canonical DS `Body` ink and measures 6.74:1. */}
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
