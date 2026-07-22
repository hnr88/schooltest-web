'use client';

import { cn } from '@/lib/utils';
import { Switch } from '@/modules/design-system';

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
  const descriptionId = `${id}-description`;
  const helperId = `${id}-helper`;

  return (
    <label
      className={cn(
        'flex min-h-16 items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-colors duration-200 ease-out-expo',
        disabled
          ? 'cursor-not-allowed bg-muted/60'
          : 'cursor-pointer hover:border-primary/50 hover:bg-muted/40',
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </span>
        {helper ? (
          <span
            id={helperId}
            className={cn(
              'text-xs font-medium',
              helperTone === 'warning' ? 'text-amber-700' : 'text-muted-foreground',
            )}
          >
            {helper}
          </span>
        ) : null}
      </span>
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        aria-describedby={helper ? `${descriptionId} ${helperId}` : descriptionId}
      />
    </label>
  );
}

export { NotificationPreferenceToggle };
