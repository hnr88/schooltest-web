'use client';

import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/design-system';
import { ExitPredictionsPanel } from '@/modules/teacher/components/ExitPredictionsPanel';
import {
  RESULTS_TABS_LIST_CLASS,
  RESULTS_TAB_ORDER,
  RESULTS_TAB_PANEL_CLASS,
  RESULTS_TAB_TRIGGER_CLASS,
} from '@/modules/teacher/constants/results.constants';
import { isResultsTabValue } from '@/modules/teacher/lib/results-shell';
import type { ClassResultsTabsProps } from '@/modules/teacher/types/results-shell.types';

// The six tabs of the class shell in the design export's label order
// (`Teacher Portal v2:3154–3166`): Students · Progress · Teaching insights ·
// Exit predictions · Family reports · Live sessions ([D-05] — existing copy
// stays; the ORDER and the two new values ship). Triggers render FROM
// `RESULTS_TAB_ORDER`, so the constant stays the one source of the order and
// `isResultsTabValue`'s narrowed set can never disagree with the DOM.
//
// On the repo tab primitive (Base UI Tabs.Root/List/Tab/Panel) — so the
// tablist/tab/tabpanel roles, aria-selected, the aria-controls ↔
// aria-labelledby pair, the roving tabindex and Arrow/Home/End keyboard
// operation are the primitive's, not hand-rolled ARIA. The design system's
// UnderlineTabs is NOT reused: it renders a tab LIST only and cannot carry the
// panels, so its underline treatment is reproduced with the same tokens instead.
//
// The tab VALUE is controlled by the screen: hiding the strip while a
// non-reading skill is showing must not lose the teacher's tab, because Reading
// restores the previous one (`:4579` + `:3089`). `reports` and `live` are tab
// VALUES, not routes ([D-20]) — tasks 25 and 08 fill their panels, so until
// then the panels are honestly empty: no stand-in body, no dead control (OP-2).
function ClassResultsTabs({
  value,
  onValueChange,
  students,
  insights,
  progress,
  live,
}: ClassResultsTabsProps) {
  const t = useTranslations('Teacher.results.tabs');

  return (
    <Tabs
      data-slot="class-results-tabs"
      value={value}
      onValueChange={(next) => {
        if (isResultsTabValue(next)) onValueChange(next);
      }}
      className="gap-0"
    >
      <TabsList variant="line" aria-label={t('listLabel')} className={RESULTS_TABS_LIST_CLASS}>
        {RESULTS_TAB_ORDER.map((tab) => (
          <TabsTrigger key={tab} value={tab} className={RESULTS_TAB_TRIGGER_CLASS}>
            {t(tab)}
          </TabsTrigger>
        ))}
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
      <TabsContent value="reports" className={RESULTS_TAB_PANEL_CLASS} />
      <TabsContent value="live" className={RESULTS_TAB_PANEL_CLASS}>
        {live}
      </TabsContent>
    </Tabs>
  );
}

export { ClassResultsTabs };
