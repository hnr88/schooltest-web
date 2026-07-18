import { getTranslations } from 'next-intl/server';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Section } from '@/modules/design-system/components/layout';
import { DataTable } from './data-table';
import { SegmentedDemo } from './segmented-demo';

const TABS = [
  { value: 'overview', labelKey: 'tabsOverview', panelKey: 'tabsOverviewPanel' },
  { value: 'questions', labelKey: 'tabsQuestions', panelKey: 'tabsQuestionsPanel' },
  { value: 'results', labelKey: 'tabsResults', panelKey: 'tabsResultsPanel' },
] as const;

async function DataSection() {
  const t = await getTranslations('DesignSystem');
  return (
    <Section id="data">
      <h2 className="text-2xl font-bold tracking-tight">{t('sectionData')}</h2>
      <Tabs defaultValue="overview" className="mt-6">
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-slate-600 dark:text-slate-400">
              {t(tab.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
        {TABS.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="pt-3 text-muted-foreground">
            {t(tab.panelKey)}
          </TabsContent>
        ))}
      </Tabs>
      <div className="mt-6">
        <SegmentedDemo
          options={[
            { value: 'week', label: t('segmentedWeek') },
            { value: 'month', label: t('segmentedMonth') },
            { value: 'year', label: t('segmentedYear') },
          ]}
          initialValue="week"
          ariaLabel={t('sectionData')}
        />
      </div>
      <Separator className="my-8" />
      <DataTable />
      <Separator className="my-8" />
      <Breadcrumb aria-label={t('breadcrumbNavAria')}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">{t('breadcrumbDashboard')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#">{t('breadcrumbTests')}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('breadcrumbCurrent')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Accordion defaultValue={['overview']} className="mt-8 max-w-2xl">
        {TABS.map((tab) => (
          <AccordionItem key={tab.value} value={tab.value}>
            <AccordionTrigger>{t(tab.labelKey)}</AccordionTrigger>
            <AccordionContent>{t(tab.panelKey)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  );
}

export { DataSection };
