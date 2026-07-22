import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import type {
  ProgressBarProps,
  ProgressBarTone,
} from '@/modules/design-system/types/design-system.types';

const TONE_CLASSES: Record<ProgressBarTone, string> = {
  solid: '',
  gradient:
    '[&_[data-slot=progress-indicator]]:bg-gradient-to-r [&_[data-slot=progress-indicator]]:from-blue-600 [&_[data-slot=progress-indicator]]:to-teal-500',
};

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
