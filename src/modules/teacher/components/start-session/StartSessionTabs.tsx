'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/design-system';
import { START_SESSION_TABS } from '@/modules/teacher/constants/start-session.constants';
import { TAB_LIST_CLASS, TAB_TRIGGER_CLASS } from '@/modules/teacher/constants/start-session-styles.constants';
import { isStartSessionTab } from '@/modules/teacher/lib/start-session-view';
import type { StartSessionTab } from '@/modules/teacher/types/start-session.types';

/** Test · Students · Settings with their live sub-lines (`mTabs`), on the design-system Tabs. */
function StartSessionTabs({
  tab,
  onTab,
  subs,
  panels,
}: {
  tab: StartSessionTab;
  onTab: (tab: StartSessionTab) => void;
  subs: Record<StartSessionTab, string>;
  panels: Record<StartSessionTab, ReactNode>;
}) {
  const t = useTranslations('TeacherPortal.startSession.tabs');
  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        if (isStartSessionTab(next)) onTab(next);
      }}
      className="gap-0"
    >
      <TabsList variant="line" aria-label={t('listLabel')} className={TAB_LIST_CLASS}>
        {START_SESSION_TABS.map((key) => (
          <TabsTrigger key={key} value={key} data-tab={key} className={TAB_TRIGGER_CLASS}>
            <span>{t(key)}</span>
            <span className="mt-[3px] text-[12px] font-normal text-[#6B7280]">{subs[key]}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {START_SESSION_TABS.map((key) => (
        <TabsContent key={key} value={key} data-tab-panel={key} className="text-[14px] leading-[normal]">
          {panels[key]}
        </TabsContent>
      ))}
    </Tabs>
  );
}

export { StartSessionTabs };
