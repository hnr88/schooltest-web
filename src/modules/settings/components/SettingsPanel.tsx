import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// Canonical Parent-settings card (App Screens → "Parent settings"): one white
// surface, hairline border, 16px radius, 26px padding and a single soft shadow
// on the card itself. The heading is 17px/600 navy over a 13.5px slate lede,
// and the body starts 16px below it — exactly the Profile / Notifications /
// Security cards on that screen.
interface SettingsPanelProps {
  id: string;
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SettingsPanel({
  id,
  title,
  description,
  action,
  children,
  className,
}: SettingsPanelProps) {
  return (
    <section
      data-slot="settings-panel"
      aria-labelledby={`${id}-title`}
      className={cn('rounded-panel border border-border bg-card p-6.5 shadow-sm', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={`${id}-title`} className="text-panel-title font-semibold text-foreground">
            {title}
          </h2>
          {description ? (
            <p className="text-body-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
