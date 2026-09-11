'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { StatusPill } from '@/modules/design-system';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import {
  LIVE_BADGE_SIZES,
  STATUS_DOT_CLASSES,
  STATUS_TONE,
} from '@/modules/teacher/constants/teacher-kit.constants';
import type { TeacherStatusPillProps } from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 — one status vocabulary, three drawings:
 * - `live`: the solid red badge with a pulsing white dot ("LIVE NOW"; "LIVE"
 *   at the strip size xs) — `Teacher Portal v2.dc.html:78, 131, 197, 1066`;
 * - `appearance="dot"`: the list row's plain dot + 13px text (`:196`);
 * - otherwise the tinted pill with a dot (`:130`), or at `size="lg"` the class
 *   header pill whose "Sitting now" dot pulses a red ring (`:541`).
 */
function TeacherStatusPill({
  status,
  appearance = 'pill',
  size,
  label,
  className,
}: TeacherStatusPillProps) {
  const t = useTranslations('TeacherPortal.kit.status');

  if (status === 'live') {
    const live = LIVE_BADGE_SIZES[size ?? 'md'];
    return (
      <StatusPill
        tone="danger"
        className={cn(
          'gap-1.5 bg-[#DC2626] font-bold whitespace-nowrap text-white uppercase',
          live.root,
          className,
        )}
      >
        <span aria-hidden="true" className={cn('shrink-0 rounded-full bg-white', live.dot)} />
        {label ?? t(size === 'xs' ? 'liveShort' : 'live')}
      </StatusPill>
    );
  }

  const text = label ?? t(status);

  if (appearance === 'dot') {
    return (
      <span
        data-slot="teacher-status-dot"
        data-status-key={status}
        className={cn(
          'inline-flex items-center gap-2 text-[13px] font-medium whitespace-nowrap text-[#374151]',
          className,
        )}
      >
        <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', STATUS_DOT_CLASSES[status])} />
        {text}
      </span>
    );
  }

  // The class header pill (`:541`) draws its dot only while sitting (`sittingDotDisplay`).
  const header = size === 'lg';
  return (
    <ToneChip tone={STATUS_TONE[status]} size={header ? 'xl' : 'md'} className={className}>
      {header && status !== 'sittingNow' ? null : (
        <span
          aria-hidden="true"
          className={cn(
            'shrink-0 rounded-full',
            header ? 'size-2 animate-om-pulse-ring bg-[#D92D20]' : 'size-1.5 bg-current',
          )}
        />
      )}
      {text}
    </ToneChip>
  );
}

export { TeacherStatusPill };
