import { AvatarTint } from '@/modules/design-system/components/avatar-tint';
import { cn } from '@/lib/utils';

import type { AvatarStackProps } from '@/modules/design-system/types/record.types';

// Canonical AvatarStack (§03 TestSummaryCard): overlapped initial discs with a white
// ring, then a "+N" disc for the remainder.
// The stack is DECORATIVE — AvatarTint is aria-hidden and the count is the only text
// a screen reader needs — so the wrapper carries one accessible name and nothing
// inside it announces separately.
function AvatarStack({
  entries,
  max = 4,
  overflowLabel,
  ariaLabel,
  className,
}: AvatarStackProps) {
  const shown = entries.slice(0, max);
  const overflow = entries.length - shown.length;
  return (
    <div
      data-slot="avatar-stack"
      role="img"
      aria-label={ariaLabel}
      className={cn('flex items-center -space-x-2', className)}
    >
      {shown.map((entry, index) => (
        <AvatarTint
          key={`${entry.initials}-${index}`}
          initials={entry.initials}
          tone={entry.tone}
          className="ring-2 ring-card"
        />
      ))}
      {overflow > 0 ? (
        <span
          aria-hidden="true"
          className="grid size-8.5 shrink-0 place-items-center rounded-full bg-surface-inset text-meta font-bold text-body ring-2 ring-card"
        >
          {overflowLabel ?? `+${overflow}`}
        </span>
      ) : null}
    </div>
  );
}

export { AvatarStack };
