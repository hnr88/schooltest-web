import { cn } from '@/lib/utils';
import {
  ACTION_PILL_CLASSES,
  ICON_CLASSES,
  TONE_CLASSES,
} from '@/modules/design-system/constants/insight-callout.constants';

import type { InsightCalloutProps } from '@/modules/design-system/types/design-system.types';

function InsightCallout({
  icon: Icon,
  tone = 'info',
  children,
  action,
  className,
}: InsightCalloutProps) {
  return (
    <div
      data-slot="insight-callout"
      data-tone={tone}
      className={cn(
        'flex items-center gap-2.5 rounded-tile px-3.5 py-3 text-body-sm',
        TONE_CLASSES[tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className={cn('size-4 shrink-0', ICON_CLASSES[tone])} />
      <span className="min-w-0 flex-1">{children}</span>
      {action ? (
        <span
          data-slot="insight-callout-action"
          className={cn('shrink-0', ACTION_PILL_CLASSES[tone])}
        >
          {action}
        </span>
      ) : null}
    </div>
  );
}

export { InsightCallout };
