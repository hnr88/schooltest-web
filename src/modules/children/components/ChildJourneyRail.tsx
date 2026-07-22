'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { ChildJourneyRung } from '@/modules/children/types/children.types';

interface ChildJourneyRailProps {
  label: string;
  verdict: string;
  rungs: ChildJourneyRung[];
  railLabel: string;
}

const DOT_CLASSES: Record<ChildJourneyRung['state'], string> = {
  done: 'border-foreground bg-foreground',
  current: 'border-foreground bg-foreground',
  future: 'border-portal-input bg-card',
};

const LABEL_CLASSES: Record<ChildJourneyRung['state'], string> = {
  done: 'font-medium text-foreground',
  current: 'font-bold text-foreground',
  future: 'font-medium text-muted-foreground',
};

// §B.4 rail, one per skill. The design draws ONE rail for the child; a single
// per-child level is a cross-skill composite the product forbids (CONTRACTS
// Amendment A1), so the same tick visual is repeated per skill over the REAL
// six-rung ladder pre_A1 → C1 — the design's `C2` does not exist in this system.
// Connectors are half-length at both ends so the rail starts and stops at a dot
// centre, exactly as the slice does.
export function ChildJourneyRail({ label, verdict, rungs, railLabel }: ChildJourneyRailProps) {
  const t = useTranslations('Children');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-body-sm font-semibold text-foreground">{label}</span>
        <span className="shrink-0 text-meta font-semibold text-muted-foreground">{verdict}</span>
      </div>
      <ol aria-label={railLabel} className="flex items-start">
        {rungs.map((rung, index) => (
          <li key={rung.band} className="relative flex min-w-0 flex-1 flex-col items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                'absolute top-2.25 h-0.5',
                index === 0 ? 'left-1/2' : 'left-0',
                index === rungs.length - 1 ? 'right-1/2' : 'right-0',
                rung.state === 'future' ? 'bg-divider' : 'bg-foreground',
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                'relative box-border grid size-5 place-items-center rounded-full border-2',
                DOT_CLASSES[rung.state],
              )}
            >
              {rung.state === 'current' ? (
                <span className="size-1.5 animate-in rounded-full bg-card duration-500 ease-out-expo zoom-in-50 motion-reduce:animate-none" />
              ) : null}
            </span>
            <span className={cn('text-overline', LABEL_CLASSES[rung.state])}>
              {t(`cefrBands.${rung.band}`)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
