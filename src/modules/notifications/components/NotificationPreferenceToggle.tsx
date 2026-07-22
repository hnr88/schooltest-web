'use client';

import type { ComponentProps, FC } from 'react';

import { cn } from '@/lib/utils';
import { ToggleRow } from '@/modules/design-system';
import { useSwitchDescribedBy } from '@/modules/notifications/hooks/use-switch-described-by';

// DS §36 "toggle rows on dividers" (canonical Parent settings → Notifications
// card): rows share one card, a #F1F5F9 hairline separates siblings and the last
// row drops it — no bordered tile per toggle, no two-column grid. The optional
// caveat line rides inside the same divider cell so the hairline still lands
// under the whole row.
const HELPER_CLASSES = {
  warning: 'text-warning-ink',
  muted: 'text-muted-foreground',
} as const;

// The caveat line must be announced WITH the switch, and it must be in the SERVER
// markup — the same defect class the switch's own label had. ToggleRow owns the
// switch, so only ToggleRow can render the attribute; `describedById` is the
// pass-through requested from the design-system this round (see report). The
// widened type is a plain assignment, not a cast: a component accepting fewer
// props is assignable to one accepting more, so passing it today is inert and it
// starts working the moment the design-system lands the prop. Until then
// useSwitchDescribedBy stamps the link after hydration; it de-duplicates ids, so
// the two never fight once both are live.
const DescribableToggleRow: FC<ComponentProps<typeof ToggleRow> & { describedById?: string }> =
  ToggleRow;

function NotificationPreferenceToggle({
  id,
  title,
  description,
  helper,
  helperTone = 'warning',
  checked,
  disabled = false,
  onCheckedChange,
}: {
  id: string;
  title: string;
  description: string;
  helper?: string;
  helperTone?: 'warning' | 'muted';
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const helperId = `${id}-helper`;
  const rowRef = useSwitchDescribedBy<HTMLDivElement>(helper === undefined ? null : helperId);

  return (
    <div
      ref={rowRef}
      data-slot="notification-preference-toggle"
      data-field={id}
      className="border-b border-divider last:border-b-0"
    >
      <DescribableToggleRow
        label={title}
        description={description}
        describedById={helper === undefined ? undefined : helperId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className={cn('border-b-0', helper && 'pb-1')}
      />
      {helper ? (
        <p id={helperId} className={cn('pb-3 text-meta font-medium', HELPER_CLASSES[helperTone])}>
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export { NotificationPreferenceToggle };
