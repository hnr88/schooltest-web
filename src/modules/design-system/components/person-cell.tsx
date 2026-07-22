import { cn } from '@/lib/utils';

import { AvatarTint, getAvatarTone } from '@/modules/design-system/components/avatar-tint';
import { getInitials } from '@/modules/design-system/lib/initials';
import type { PersonCellProps } from '@/modules/design-system/types/primitives.types';

// Canonical identity cell (Students roster / Linked parents / Class detail): a
// 34px tinted-initials avatar, 11px gap, the name at 13.5-14px/600 navy, and an
// optional 12px secondary line. Initials and tint are derived from the name when
// the caller does not supply them, so every roster gets a stable colour per person.
function PersonCell({
  name,
  secondary,
  initials,
  tone,
  size = 'sm',
  trailing,
  className,
}: PersonCellProps) {
  return (
    <span data-slot="person-cell" className={cn('flex min-w-0 items-center gap-2.75', className)}>
      <AvatarTint
        initials={initials ?? getInitials(name)}
        tone={tone ?? getAvatarTone(name)}
        size={size}
      />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body-sm font-semibold text-foreground">{name}</span>
        {secondary ? (
          <span className="truncate text-meta text-muted-foreground">{secondary}</span>
        ) : null}
      </span>
      {trailing ? <span className="ml-auto shrink-0">{trailing}</span> : null}
    </span>
  );
}

export { PersonCell };
