'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/modules/design-system';
import { DEFAULT_SITTING_SETTINGS, type SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';

// S18 (Teacher Portal v2.dc.html:1817–1843) — the READ-ONLY session settings
// modal. It renders the C-SIT-SETTINGS payload as the design's `setRows`
// (:4021–4026): label, description, an On/Off word with its own tone — then
// the time limit and the design's fixed-once-open line (:1839). There is no
// writable control anywhere in it: the refusal that promise rides on is the
// api's 409, and the composer that CAN write is task 22's, through the same
// hook this surface deliberately never calls.
//
// A sitting with `settings: null` renders from the design defaults (:2615) —
// never a blank list.
interface SettingRow {
  label: string;
  desc: string;
  state: string;
  on: boolean;
}

/** The ten toggle keys, in the design's order; `timeLimit` is the 11th row. */
export const ROW_ORDER = [
  'lowBw',
  'skip',
  'review',
  'flag',
  'bigText',
  'lockdown',
  'focusFlag',
  'warn5',
  'autoSubmit',
  'showScore',
] as const;

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
  const t = useTranslations('Teacher.testSessions.live.settings');
  const effective = settings ?? DEFAULT_SITTING_SETTINGS;

  // The counter counts the TEN toggles the design's own setCount formula
  // (:4021) counts — `timeLimit` is a number that is always set, so including
  // it would make "N of 11 on" permanently off by one (ruling, chat-7db00094).
  const onCount = ROW_ORDER.filter((key) => effective[key]).length;

  const rows: SettingRow[] = [
    ...ROW_ORDER.map((key) => ({
      label: t(`rows.${key}.label`),
      desc: t(`rows.${key}.desc`),
      state: effective[key] ? t('on') : t('off'),
      on: effective[key],
    })),
    {
      label: t('rows.timeLimit.label'),
      desc: t('rows.timeLimit.desc'),
      state: t('minutes', { minutes: effective.timeLimit }),
      on: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        showCloseButton={false}
        data-slot="session-settings-modal"
        data-settings-count={`${onCount} of ${ROW_ORDER.length} on`}
        className="max-h-[calc(100dvh-2rem)] gap-0 overflow-hidden p-0 sm:max-w-[38rem]"
      >
        <DialogHeader className="relative border-b border-divider px-6 py-5 pr-14">
          <DialogTitle className="text-panel-title font-semibold">{t('title')}</DialogTitle>
          <DialogDescription>
            {t('subtitle')} {t('count', { on: onCount, total: ROW_ORDER.length })}.
          </DialogDescription>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('close')}
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </DialogHeader>
        <div className="scroll-region flex min-h-0 flex-col px-6 pb-5">
          {rows.map((row) => (
            <div
              key={row.label}
              data-slot="session-settings-row"
              className="flex items-start gap-4 border-b border-divider py-4 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="text-body font-semibold text-foreground">{row.label}</div>
                <div className="mt-1 text-meta leading-relaxed text-muted-foreground">{row.desc}</div>
              </div>
              <span
                className={`flex-none rounded-full px-3 py-1 text-meta font-semibold ${
                  row.on ? 'bg-success-soft text-success-ink' : 'bg-surface-inset text-muted-foreground'
                }`}
              >
                {row.state}
              </span>
            </div>
          ))}
          <p className="pt-4 text-meta leading-relaxed text-muted-foreground">{t('fixed')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export { SessionSettingsModal };
