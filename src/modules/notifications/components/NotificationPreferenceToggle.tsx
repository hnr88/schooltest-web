'use client';

import { Switch } from '@/modules/design-system';

function NotificationPreferenceToggle({
  id,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const descriptionId = `${id}-description`;

  return (
    <label className="flex min-h-16 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </span>
      </span>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-describedby={descriptionId}
      />
    </label>
  );
}

export { NotificationPreferenceToggle };
