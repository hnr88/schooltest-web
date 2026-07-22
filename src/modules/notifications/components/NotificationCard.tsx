import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

// Canonical Parent-settings card (App Screens → "Parent settings"): one white
// surface, hairline border, 16px radius, 26px padding, a single soft shadow and
// a 17px/600 heading over a 13.5px slate lede.
export function NotificationCard({
  id,
  title,
  description,
  children,
  className,
}: {
  id?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-slot="settings-panel"
      aria-labelledby={title === undefined ? undefined : `${id}-title`}
      className={cn('rounded-panel border border-border bg-card p-6.5 shadow-sm', className)}
    >
      {title === undefined ? null : (
        <div className="mb-4 flex flex-col gap-1">
          <h2 id={`${id}-title`} className="text-panel-title font-semibold text-foreground">
            {title}
          </h2>
          {description === undefined ? null : (
            <p className="text-body-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
