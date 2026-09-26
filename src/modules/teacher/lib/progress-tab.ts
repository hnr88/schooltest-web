import { resultViewsOf, type RosterRow } from '@/modules/results';

import { classProgress } from '@/modules/teacher/lib/v2/class-progress';
import type { ProgressTabView } from '@/modules/teacher/types/progress-tab.types';

/** The Class progress tab (`Teacher Portal v2.dc.html:873–1002`) from the ONE roster read: `classProgress()` shaped for the kit. */
export function progressTabView(roster: readonly RosterRow[]): ProgressTabView {
  const view = classProgress(roster);
  return {
    status: resultViewsOf(roster).length === 0 ? 'empty' : 'ready',
    sittings: view.sittings,
    dotMap: view.dotMap,
    subMap: view.subMap,
    gainTop: view.gainTop,
    gainLow: view.gainLow,
    analysis: view.dotMap.summary,
  };
}
