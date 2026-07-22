import { cn } from '@/lib/utils';

import type {
  GlassStatTileProps,
  GlassStatTileTone,
} from '@/modules/design-system/types/record.types';

// Canonical GlassStatTile (§01 — Result detail hero): on navy,
// background rgba(255,255,255,.07), radius 14px, padding 16px 22px, centred;
// value 24/700 #fff (or #2DD4BF), label 12px #8FA3C7.
// The tint resolves to rgb(31,50,92) over #0E2350, where white is 12.5:1, #2DD4BF is
// 6.7:1 and #8FA3C7 is 4.9:1 — all AA. It is the ONLY stat treatment that belongs on
// a dark hero; MiniStatTile's #F1F5F9 recess would punch a white hole in it.
const VALUE_TONES: Record<GlassStatTileTone, string> = {
  default: 'text-primary-foreground',
  accent: 'text-accent-on-dark',
};

function GlassStatTile({ value, label, tone = 'default', className }: GlassStatTileProps) {
  return (
    <div
      data-slot="glass-stat-tile"
      className={cn(
        'flex flex-col items-center gap-1 rounded-xl bg-surface-glass px-5.5 py-4 text-center',
        className,
      )}
    >
      <span className={cn('text-h3 leading-none font-bold tabular-nums', VALUE_TONES[tone])}>
        {value}
      </span>
      <span className="text-meta text-navy-muted">{label}</span>
    </div>
  );
}

export { GlassStatTile };
