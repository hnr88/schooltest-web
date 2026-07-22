'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { READINESS_FIELD_LABEL_KEYS } from '@/modules/dashboard/constants/dashboard.constants';
import type { ReadinessField } from '@/modules/dashboard/types/dashboard-overview.types';

// The per-child rail from spec 01 §5 item 3: six 5px ticks at a 6px gap, each
// capped at 52px, over a 10px label; reached ticks fill navy and take a bold
// label, unreached ticks stay on the hairline tint.
//
// The design's six labels are a CEFR ladder (A1…C2). Amendment A1 deletes the
// per-child level outright — it is a cross-skill composite the product forbids —
// so the ticks are pointed at the six planning fields that already define profile
// readiness. The rail is decorative here: the row's link carries the same "n of 6"
// in its accessible name, so a screen reader hears it once, not seven times.
export function DashboardReadinessRail({ fields }: { fields: ReadinessField[] }) {
  const t = useTranslations('Dashboard');

  return (
    <span aria-hidden="true" className="flex min-w-30 flex-1 items-center gap-1.5">
      {fields.map((field) => (
        <span key={field.key} className="flex max-w-13 min-w-0 flex-1 flex-col items-center gap-1.25">
          <span
            className={cn(
              'h-1.25 w-full rounded-full',
              field.filled ? 'bg-navy-900' : 'bg-divider',
            )}
          />
          {/* Below sm the rail shares one line with the plan pill, which leaves
              ~25px per tick — every label truncates to two letters. The ticks
              stay (they still read as a segmented meter) and the labels drop; the
              row's link carries the same "n of 6" in its accessible name either
              way. */}
          <span
            className={cn(
              'hidden w-full truncate text-center text-micro sm:block',
              field.filled ? 'font-semibold text-foreground' : 'text-body',
            )}
          >
            {t(READINESS_FIELD_LABEL_KEYS[field.key])}
          </span>
        </span>
      ))}
    </span>
  );
}
