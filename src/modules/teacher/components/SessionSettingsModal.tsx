'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/modules/design-system';
import { SITTING_TOGGLE_KEYS } from '@/modules/teacher/constants/live-tab.constants';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import { DEFAULT_SITTING_SETTINGS, type SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';

// S18 (Teacher Portal v2.dc.html:1817–1843) — the READ-ONLY session settings
// modal. It renders the C-SIT-SETTINGS payload as the design's `setRows`
// (:4021–4027): label, description, an On/Off chip with its own tone — then
// the time limit and the design's fixed-once-open line (:1839). There is no
// writable control anywhere in it: the refusal that promise rides on is the
// api's 409.
//
// A sitting with `settings: null` renders from the design defaults (:2615) —
// never a blank list.
interface SettingRow {
  label: string;
  desc: string;
  state: string;
  tone: 'on' | 'off' | 'value';
}

/** The ten toggle keys, in the design's order; `timeLimit` is the 11th row. */
export const ROW_ORDER = SITTING_TOGGLE_KEYS;

const STATE_CHIP: Record<SettingRow['tone'], string> = {
  on: 'bg-[#E9F6EF] text-[#1F7A4D]',
  off: 'bg-[#F5F6F8] text-[#6B7280]',
  value: 'bg-[#F5F6F8] text-navy-900',
};

function SessionSettingsModal({
  open,
  onClose,
  settings,
}: {
  open: boolean;
  onClose: () => void;
  /** The served settings, or `null` — the modal renders the design defaults for null. */
  settings: SittingSettings | null;
}) {
  const t = useTranslations('TeacherPortal.live.settingsPanel');
  const effective = settings ?? DEFAULT_SITTING_SETTINGS;

  // The counter counts the TEN toggles the design's own setCount formula
  // (:4021) counts — `timeLimit` is a number that is always set.
  const onCount = ROW_ORDER.filter((key) => effective[key]).length;

  const rows: SettingRow[] = [
    ...ROW_ORDER.map((key) => ({
      label: t(`rows.${key}.label`),
      desc: t(`rows.${key}.desc`),
      state: effective[key] ? t('on') : t('off'),
      tone: effective[key] ? ('on' as const) : ('off' as const),
    })),
    {
      label: t('rows.timeLimit.label'),
      desc: t('rows.timeLimit.desc'),
      state: t('minutes', { minutes: effective.timeLimit }),
      tone: 'value',
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        data-slot="session-settings-modal"
        data-settings-count={`${onCount} of ${ROW_ORDER.length} on`}
        className="flex max-h-[82vh] flex-col gap-0 overflow-hidden rounded-[12px] p-0 leading-[normal] shadow-[0_28px_56px_rgba(0,0,0,0.22)] sm:max-w-[620px]"
      >
        <DialogHeader className="flex-row items-center gap-3.5 border-b border-[#ECEEF2] px-[26px] py-[22px] text-left">
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-[18px] font-semibold tracking-[-0.01em] text-navy-900">{t('title')}</DialogTitle>
            <DialogDescription className="mt-1 text-[13px] text-[#6B7280]">
              {t('subtitle', { on: onCount, total: ROW_ORDER.length })}
            </DialogDescription>
          </div>
          <button
            type="button"
            aria-label={t('close')}
            onClick={onClose}
            className={cn(
              'grid size-9 flex-none place-items-center rounded-[8px] border border-[#ECEEF2] bg-white text-[#6B7280] transition-colors hover:border-navy-900',
              KIT_FOCUS_RING,
            )}
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </DialogHeader>
        <div className="min-h-0 overflow-y-auto px-[26px] pt-1.5 pb-5">
          {rows.map((row) => (
            <div
              key={row.label}
              data-slot="session-settings-row"
              className="flex items-start gap-4 border-b border-[#F3F4F6] py-[15px]"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-navy-900">{row.label}</div>
                <div className="mt-1 text-[12.5px] leading-normal text-[#6B7280]">{row.desc}</div>
              </div>
              <span className={cn('flex-none rounded-full px-3 py-[5px] text-[12px] font-semibold', STATE_CHIP[row.tone])}>
                {row.state}
              </span>
            </div>
          ))}
          <p className="pt-3.5 text-[12.5px] leading-normal text-[#6B7280]">{t('fixed')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { SessionSettingsModal };
