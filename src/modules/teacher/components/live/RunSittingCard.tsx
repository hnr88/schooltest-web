'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { SessionSettingsModal } from '@/modules/teacher/components/SessionSettingsModal';
import { JoinCodeCell } from '@/modules/teacher/components/live/JoinCodeCell';
import { RoomControlsCell } from '@/modules/teacher/components/live/RoomControlsCell';
import { TeacherStatusPill } from '@/modules/teacher/components/v2/TeacherStatusPill';
import { LIVE_EYEBROW_CLASS, SITTING_TOGGLE_KEYS } from '@/modules/teacher/constants/live-tab.constants';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import { effectiveSettings, settingsOnCount } from '@/modules/teacher/lib/live-tab';
import type { SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';
import type {
  TeacherTestSession,
  TestSessionMonitorResponse,
} from '@/modules/teacher/types/teacher-session.types';

/** The design's settings glyph (`:1092`): a circle and six rays. */
function SettingsGlyph() {
  return (
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M4.2 7.5l2.6 1.5M17.2 15l2.6 1.5M4.2 16.5l2.6-1.5M17.2 9l2.6-1.5" />
    </svg>
  );
}

// Teacher Portal v2.dc.html:1062–1113 — "Run the sitting": LIVE NOW, then the join
// code, the test (the served form, the server's stall threshold, the real settings)
// and the room controls, split by 1px hairlines. The 3-column strip also carries the
// design's `border-bottom:1px solid #EEF1F6` (`:1076`), a hairline just inside the
// card's own bottom border (P1 round 2 · N12).
function RunSittingCard({
  sitting,
  monitor,
  settings,
}: {
  sitting: TeacherTestSession;
  monitor: TestSessionMonitorResponse | null;
  settings: SittingSettings | null;
}) {
  const t = useTranslations('TeacherPortal.live.room');
  const tKit = useTranslations('TeacherPortal.kit');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const noValue = tKit('noValue');

  return (
    <section
      data-slot="run-sitting"
      data-sitting-id={sitting.sitting_document_id}
      aria-labelledby="run-sitting-title"
      className="flex flex-col overflow-hidden rounded-[14px] border border-[#E4E9F2] bg-white shadow-[0_1px_3px_rgba(14,35,80,0.05)]"
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-[#F1F3F6] bg-[#FBFCFE] px-[22px] py-[17px]">
        <h3 id="run-sitting-title" className="text-[15px] font-bold tracking-[-0.01em] text-navy-900">
          {t('title')}
        </h3>
        <TeacherStatusPill status="live" size="lg" />
        <span className="text-[12.5px] text-[#6B7280]">{t('subtitle')}</span>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-px border-b border-[#EEF1F6] bg-[#EEF1F6]">
        <JoinCodeCell sitting={sitting} monitor={monitor} />
        <div data-slot="run-sitting-test" className="flex flex-col bg-white px-6 py-[22px]">
          <span className={LIVE_EYEBROW_CLASS}>{t('test')}</span>
          <p className="mt-3 text-[16px] font-semibold text-navy-900">
            {t('testTitle', { className: sitting.class.name, test: sitting.form?.label ?? noValue })}
          </p>
          <p data-slot="run-sitting-stall" className="mt-[5px] text-[13px] leading-normal text-[#6B7280]">
            {monitor === null ? noValue : t('stallMeta', { minutes: monitor.stall_threshold_minutes })}
          </p>
          <div className="mt-auto pt-4">
            <button
              type="button"
              data-slot="test-settings-button"
              onClick={() => setSettingsOpen(true)}
              className={cn(
                'inline-flex h-[42px] items-center gap-[9px] rounded-[8px] border border-[#D8DFEA] bg-white px-4 text-[13.5px] font-semibold text-navy-900 transition-colors hover:border-navy-900',
                KIT_FOCUS_RING,
              )}
            >
              <SettingsGlyph />
              {t('settings')}
              <span className="text-[12px] font-medium text-[#6B7280]">
                {t('settingsCount', {
                  on: settingsOnCount(effectiveSettings(settings)),
                  total: SITTING_TOGGLE_KEYS.length,
                })}
              </span>
            </button>
          </div>
        </div>
        <RoomControlsCell sitting={sitting} monitor={monitor} />
      </div>
      <SessionSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} />
    </section>
  );
}

export { RunSittingCard };
