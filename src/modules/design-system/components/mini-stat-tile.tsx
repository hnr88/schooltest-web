import { cn } from '@/lib/utils';

import type {
  MiniStatTileProps,
  MiniStatTileTone,
} from '@/modules/design-system/types/design-system.types';

const VALUE_TONES: Record<MiniStatTileTone, string> = {
  default: 'text-foreground',
  positive: 'text-success-strong',
  negative: 'text-destructive',
  muted: 'text-muted-foreground',
};

function MiniStatTile({ value, label, tone = 'default', className }: MiniStatTileProps) {
  return (
    <div
      data-slot="mini-stat-tile"
      className={cn('flex min-w-0 flex-col gap-0.5 rounded-tile bg-background p-3.5', className)}
    >
      <span className={cn('truncate text-stat-sm font-bold', VALUE_TONES[tone])}>{value}</span>
      {/* slate-600, not muted-foreground: 12.5px on the #F7F9FC tile needs 4.5:1 */}
      <span className="text-meta text-balance text-slate-600">{label}</span>
    </div>
  );
}

export { MiniStatTile };
