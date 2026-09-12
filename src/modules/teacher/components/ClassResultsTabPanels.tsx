'use client';

import { TabsContent } from '@/modules/design-system';
import { ExitPredictionsPanel } from '@/modules/teacher/components/ExitPredictionsPanel';
import { FamilyReportsPanel } from '@/modules/teacher/components/FamilyReportsPanel';
import { LiveTabPanel } from '@/modules/teacher/components/live/LiveTabPanel';
import { ProgressTabPanel } from '@/modules/teacher/components/ProgressTabPanel';
import { StudentsTabPanel } from '@/modules/teacher/components/StudentsTabPanel';
import { TeachingInsightsPanel } from '@/modules/teacher/components/TeachingInsightsPanel';
import { RESULTS_TAB_PANEL_CLASS } from '@/modules/teacher/constants/results.constants';
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
        <LiveTabPanel classDocumentId={classDocumentId} sessionId={sessionId} />
      </TabsContent>
    </>
  );
}

export { ClassResultsTabPanels };
