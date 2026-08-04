import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { DataPanel } from '@/modules/design-system';
import { PORTAL_CARD_CLASS } from '@/modules/settings/constants/settings.constants';

import type { SettingsPanelProps } from '@/modules/settings/types/components.types';

export function SettingsPanel({
  id,
  title,
  description,
  action,
  children,
  className,
}: SettingsPanelProps) {
  return (
    <DataPanel
      data-slot="settings-panel"
      aria-labelledby={`${id}-title`}
      className={cn(PORTAL_CARD_CLASS, 'flex flex-col px-7.5 py-6.5', className)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <h2 id={`${id}-title`} className="text-body-lg font-semibold text-foreground">
            {title}
          </h2>
          {description ? <p className="mt-1.25 text-caption text-body">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-4 min-w-0">{children}</div>
    </DataPanel>
  );
}
