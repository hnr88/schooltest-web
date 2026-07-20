'use client';

import { ArrowRight, Compass } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Eyebrow,
} from '@/modules/design-system';
import type { DashboardOverview } from '@/modules/dashboard/types/dashboard-overview.types';

export function DashboardHero({ overview }: { overview: DashboardOverview }) {
  const t = useTranslations('Dashboard');

  return (
    <section data-slot="dashboard-hero" aria-labelledby="dashboard-hero-title">
      <Card className="border-navy-800 bg-navy-900 py-6 text-white shadow-lg">
        <CardHeader className="gap-3 px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow tone="teal" className="text-teal-100">
              {t('overviewEyebrow')}
            </Eyebrow>
            <Badge className="border-white/20 bg-white/10 text-white">
              {t('profileCount', { count: overview.totalStudents })}
            </Badge>
          </div>
          <CardTitle
            id="dashboard-hero-title"
            role="heading"
            aria-level={2}
            className="max-w-2xl text-h3 font-bold text-white"
          >
            {t('overviewTitle')}
          </CardTitle>
          <CardDescription className="max-w-2xl text-blue-100">
            {t('overviewSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <Button href="/dashboard/search?mode=schools" variant="white" size="lg">
            <Compass aria-hidden="true" className="size-4" />
            {t('exploreSchools')}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
