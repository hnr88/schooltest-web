'use client';

import { ArrowUpRight, Building2, Handshake } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/modules/design-system';

export function DashboardExploreOptions() {
  const t = useTranslations('Dashboard');

  return (
    <section
      data-slot="dashboard-explore-options"
      aria-labelledby="dashboard-explore-options-title"
    >
      <Card className="h-full border-l-4 border-blue-100 border-l-blue-600 bg-card shadow-sm dark:border-blue-950">
        <CardHeader>
          <CardTitle id="dashboard-explore-options-title" role="heading" aria-level={2}>
            {t('exploreTitle')}
          </CardTitle>
          <CardDescription>{t('exploreSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            href="/dashboard/search?mode=schools"
            variant="outline"
            className="h-auto w-full justify-between px-4 py-4 text-left shadow-sm"
          >
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600"
              >
                <Building2 className="size-4" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{t('findSchools')}</span>
                <span className="text-caption font-normal text-muted-foreground">
                  {t('findSchoolsDescription')}
                </span>
              </span>
            </span>
            <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
          </Button>
          <Button
            href="/dashboard/search?mode=agents"
            variant="outline"
            className="h-auto w-full justify-between px-4 py-4 text-left shadow-sm"
          >
            <span className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600"
              >
                <Handshake className="size-4" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-semibold">{t('findAgents')}</span>
                <span className="text-caption font-normal text-muted-foreground">
                  {t('findAgentsDescription')}
                </span>
              </span>
            </span>
            <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" />
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}
