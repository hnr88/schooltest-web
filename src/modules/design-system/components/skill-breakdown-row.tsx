import { cn } from '@/lib/utils';

import type {
  SkillBreakdownRowProps,
  SkillVerdictTone,
} from '@/modules/design-system/types/record.types';

// Canonical SkillBreakdownRow (§07 / §03 SkillPanelCard — Admissions profile):
// 118px label at 12.5px · a 9px track · a 76px verdict at 11.5/700
// (Mastered / Emerging / Not yet / Not assessed).
// `value: null` is the HONEST not-assessed state: an empty track and the neutral
// verdict, never a zero bar, because "0%" and "we never measured this" are different
// facts. Verdict inks are the AA-safe strong/ink tokens, not the 3.2:1 canonical
// #16A34A / #D97706.
const VERDICTS: Record<SkillVerdictTone, { fill: string; ink: string }> = {
  mastered: { fill: 'bg-success', ink: 'text-success-strong' },
  emerging: { fill: 'bg-warning', ink: 'text-warning-strong' },
  notYet: { fill: 'bg-destructive', ink: 'text-danger-strong' },
  notAssessed: { fill: 'bg-transparent', ink: 'text-muted-foreground' },
};

function SkillBreakdownRow({
  label,
  value,
  verdict,
  tone = 'notAssessed',
  className,
}: SkillBreakdownRowProps) {
  const width = value === null ? 0 : Math.min(100, Math.max(0, value));
  return (
    <div
      data-slot="skill-breakdown-row"
      role="group"
      aria-label={`${label} ${verdict}`}
      className={cn('grid grid-cols-skill-row items-center gap-2.5 py-1.5', className)}
    >
      <span className="truncate text-meta text-body">{label}</span>
      <span className="block h-2.25 w-full overflow-hidden rounded-full bg-divider">
        <span
          className={cn(
            'block h-full rounded-full transition-[width] duration-700 ease-out-expo motion-reduce:transition-none',
            VERDICTS[tone].fill,
          )}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className={cn('text-overline font-bold', VERDICTS[tone].ink)}>{verdict}</span>
    </div>
  );
}

export { SkillBreakdownRow };
