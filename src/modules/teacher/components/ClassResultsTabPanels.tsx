'use client';

import { useTranslations } from 'next-intl';

import { TabsContent } from '@/modules/design-system';
import { ExitPredictionsPanel } from '@/modules/teacher/components/ExitPredictionsPanel';
import { FamilyReportsPanel } from '@/modules/teacher/components/FamilyReportsPanel';
import { ProgressTabPanel } from '@/modules/teacher/components/ProgressTabPanel';
import { StudentsTabPanel } from '@/modules/teacher/components/StudentsTabPanel';
import { TeachingInsightsPanel } from '@/modules/teacher/components/TeachingInsightsPanel';
import { RESULTS_TAB_PANEL_CLASS } from '@/modules/teacher/constants/results.constants';
import { TestDayScreen, useClassSittingsQuery } from '@/modules/test-day';
import type { ClassResultsTabPanelsProps } from '@/modules/teacher/types/results-shell.types';

// The six tab bodies below the sticky header. Each renders inside ONE
// `data-tab-panel="<key>"` box, so the chunk that rebuilds a body swaps one
// line here. Base UI mounts only the selected panel.
function ClassResultsTabPanels({ classDocumentId, rows, sessionId }: ClassResultsTabPanelsProps) {
  return (
    <>
      <TabsContent value="students" data-tab-panel="students" className={RESULTS_TAB_PANEL_CLASS}>
        <StudentsTabPanel classDocumentId={classDocumentId} rows={rows} />
      </TabsContent>
      <TabsContent value="progress" data-tab-panel="progress" className={RESULTS_TAB_PANEL_CLASS}>
        <ProgressTabPanel classDocumentId={classDocumentId} rows={rows} />
      </TabsContent>
      <TabsContent value="insights" data-tab-panel="insights" className={RESULTS_TAB_PANEL_CLASS}>
        <TeachingInsightsPanel classDocumentId={classDocumentId} rows={rows} />
      </TabsContent>
      <TabsContent value="exit" data-tab-panel="exit" className={RESULTS_TAB_PANEL_CLASS}>
        <ExitPredictionsPanel />
      </TabsContent>
      <TabsContent value="reports" data-tab-panel="reports" className={RESULTS_TAB_PANEL_CLASS}>
        <FamilyReportsPanel classDocumentId={classDocumentId} rows={rows} />
      </TabsContent>
      <TabsContent
        value="live"
        data-tab-panel="live"
        data-session-id={sessionId ?? undefined}
        className={RESULTS_TAB_PANEL_CLASS}
      >
        <ClassLivePanel classDocumentId={classDocumentId} />
      </TabsContent>
    </>
  );
}

// teacher/08 — the Live tab is the folded test-day console. With nothing open it
// renders its own no-sitting panel and start control; the tab never swaps to a
// different component.
function ClassLivePanel({ classDocumentId }: { classDocumentId: string }) {
  const t = useTranslations('Teacher.results.detail');
  const classSittings = useClassSittingsQuery(classDocumentId);

  if (classSittings.isPending) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }
  if (classSittings.isError) {
    return (
      <p role="alert" className="text-sm text-danger-ink">
        {t('errorDescription')}
      </p>
    );
  }
  return <TestDayScreen embedded classDocumentId={classDocumentId} />;
}

export { ClassResultsTabPanels };
