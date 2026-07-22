import { cn } from '@/lib/utils';

import type { TintTileProps, TintTileTone } from '@/modules/design-system/types/record.types';

// Canonical TintTile (§01 — Parent overview mini-stats, Result detail
// recommendations, Class detail recent tests, Create test question bank, Student
// detail teacher note): a RECESS inside a white panel — radius 12px, padding 14px,
// no border, no shadow.
// It is the generic recess. `MiniStatTile` is the value+label SPECIALISATION of it;
// reaching for MiniStatTile when you only need a recessed box is what put 14 of them
// on the dashboard.
// Ink inside a tint is --color-body (6.9:1 on every tone below); --muted-foreground
// is 4.34:1 on #F1F5F9 and fails AA there.
const TONES: Record<TintTileTone, string> = {
  inset: 'bg-surface-inset text-body',
  well: 'bg-background text-body',
  brand: 'bg-blue-50 text-secondary-foreground',
  accent: 'bg-teal-50 text-teal-700',
};

function TintTile({ tone = 'inset', children, className }: TintTileProps) {
  return (
    <div
      data-slot="tint-tile"
      data-tone={tone}
      className={cn('rounded-tile p-3.5', TONES[tone], className)}
    >
      {children}
    </div>
  );
}

export { TintTile };
