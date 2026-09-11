'use client';

import { useTranslations } from 'next-intl';

import { TabsList, TabsTrigger } from '@/modules/design-system';
import {
  RESULTS_TABS_LIST_CLASS,
  RESULTS_TAB_ORDER,
  RESULTS_TAB_TRIGGER_CLASS,
} from '@/modules/teacher/constants/results.constants';

// The six section tabs (`Teacher Portal v2.dc.html:632–638`, labels `:3154`): the
// underline row at the foot of the sticky header. It is the TabsList of the
// screen's Tabs root, so the tablist/tab roles, the roving tabindex and
// Arrow/Home/End stay the primitive's; the bodies sit below the sticky header
// (ClassResultsTabPanels) and the value lives in `?tab=`.
function ClassResultsTabs() {
  const t = useTranslations('TeacherPortal.classDetail.tabs');

  return (
    <TabsList
      variant="line"
      aria-label={t('listLabel')}
      data-slot="class-results-tabs"
      className={RESULTS_TABS_LIST_CLASS}
    >
      {RESULTS_TAB_ORDER.map((tab) => (
        <TabsTrigger key={tab} value={tab} data-tab={tab} className={RESULTS_TAB_TRIGGER_CLASS}>
          {t(tab)}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

export { ClassResultsTabs };
