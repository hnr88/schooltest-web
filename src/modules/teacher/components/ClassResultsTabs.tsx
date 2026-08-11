'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Badge, Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/design-system';
import { ExitPredictionsPanel } from '@/modules/teacher/components/ExitPredictionsPanel';
import {
  DEFAULT_RESULTS_TAB,
  RESULTS_TABS_LIST_CLASS,
  RESULTS_TAB_PANEL_CLASS,
  RESULTS_TAB_TRIGGER_CLASS,
} from '@/modules/teacher/constants/results.constants';
import { isResultsTabValue } from '@/modules/teacher/lib/results-shell';
import type {
  ClassResultsTabsProps,
  ResultsTabValue,
} from '@/modules/teacher/types/results-shell.types';

// The four tabs of .qa/DESIGN.md §Results, on the repo tab primitive (Base UI
// Tabs.Root/List/Tab/Panel) — so the tablist/tab/tabpanel roles, aria-selected,
// the aria-controls ↔ aria-labelledby pair, the roving tabindex and Arrow/Home/
// End keyboard operation are the primitive's, not hand-rolled ARIA. The design
// system's UnderlineTabs is NOT reused: it renders a tab LIST only and cannot
// carry the panels, so its underline treatment is reproduced with the same
// tokens instead.
//
// Each panel's content is a NODE the caller owns: tasks 041/044/045 fill their
// own tab without editing this frame. "Exit predictions" is the exception — it
// has no content to fill and says so (brief flow 26).
function ClassResultsTabs({ students, insights, progress }: ClassResultsTabsProps) {
  const t = useTranslations('Teacher.results.tabs');
  const [tab, setTab] = useState<ResultsTabValue>(DEFAULT_RESULTS_TAB);

  return (
    <Tabs
      data-slot="class-results-tabs"
      value={tab}
      onValueChange={(next) => {
        if (isResultsTabValue(next)) setTab(next);
      }}
      className="gap-0"
    >
      <TabsList variant="line" aria-label={t('listLabel')} className={RESULTS_TABS_LIST_CLASS}>
        <TabsTrigger value="students" className={RESULTS_TAB_TRIGGER_CLASS}>
          {t('students')}
        </TabsTrigger>
        <TabsTrigger value="insights" className={RESULTS_TAB_TRIGGER_CLASS}>
          {t('insights')}
        </TabsTrigger>
        <TabsTrigger value="progress" className={RESULTS_TAB_TRIGGER_CLASS}>
          {t('progress')}
        </TabsTrigger>
        <TabsTrigger value="exit" className={RESULTS_TAB_TRIGGER_CLASS}>
          {t('exit')}
          <Badge variant="secondary" className="ml-2 text-meta font-semibold">
            {t('comingSoon')}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="students" className={RESULTS_TAB_PANEL_CLASS}>
        {students}
      </TabsContent>
      <TabsContent value="insights" className={RESULTS_TAB_PANEL_CLASS}>
        {insights}
      </TabsContent>
      <TabsContent value="progress" className={RESULTS_TAB_PANEL_CLASS}>
        {progress}
      </TabsContent>
      <TabsContent value="exit" className={RESULTS_TAB_PANEL_CLASS}>
        <ExitPredictionsPanel />
      </TabsContent>
    </Tabs>
  );
}

export { ClassResultsTabs };
