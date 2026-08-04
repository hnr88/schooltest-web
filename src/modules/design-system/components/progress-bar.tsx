import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TONE_CLASSES } from '@/modules/design-system/constants/progress-bar.constants';

import type { ProgressBarProps } from '@/modules/design-system/types/design-system.types';

function ProgressBar({ value, tone = 'solid', ariaLabel, className }: ProgressBarProps) {
  return (
    <Progress
      value={value}
      aria-label={ariaLabel}
      className={cn(
        'h-1.5 [&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-track]]:h-1.5 [&_[data-slot=progress-track]]:bg-divider',
        TONE_CLASSES[tone],
        className,
      )}
    />
  );
}

export { ProgressBar };
