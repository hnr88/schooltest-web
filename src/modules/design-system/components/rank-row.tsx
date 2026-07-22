import { AvatarTint } from '@/modules/design-system/components/avatar-tint';
import { cn } from '@/lib/utils';

import type { RankRowProps } from '@/modules/design-system/types/record.types';

// Canonical RankRow (§02.11 — "Top performers"): 10px gap, a 20px rank column at
// 12.5/700, a 28px avatar, the name at 13.5/600 taking the remaining width, and the
// score at 13/700.
// The canonical medal inks are #D97706 / #94A3B8 / #B45309 — 3.19:1, 2.56:1 and
// 5.02:1 on white. The two failures are replaced with their AA-safe same-hue
// siblings (--color-warning-strong, --muted-foreground); rank is also a NUMBER, so
// the ordering never depends on the colour.
const RANK_TONES = [
  'text-warning-strong',
  'text-muted-foreground',
  'text-warning-ink',
] as const;

function RankRow({ rank, name, initials, score, tone = 'blue', className }: RankRowProps) {
  return (
    <div data-slot="rank-row" className={cn('flex items-center gap-2.5 py-2', className)}>
      <span
        className={cn(
          'w-5 shrink-0 text-meta font-bold tabular-nums',
          RANK_TONES[rank - 1] ?? 'text-muted-foreground',
        )}
      >
        {rank}
      </span>
      <AvatarTint initials={initials} tone={tone} />
      <span className="min-w-0 flex-1 truncate text-body-sm font-semibold text-foreground">
        {name}
      </span>
      <span className="shrink-0 text-caption font-bold text-foreground tabular-nums">{score}</span>
    </div>
  );
}

export { RankRow };
