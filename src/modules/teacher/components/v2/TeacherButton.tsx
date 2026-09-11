import { cn } from '@/lib/utils';
import { Button } from '@/modules/design-system';
import {
  KIT_FOCUS_RING,
  TEACHER_BUTTON_SIZES,
  TEACHER_BUTTON_TONES,
} from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { TeacherButtonProps } from '@/modules/teacher/types/teacher-kit-controls.types';

/**
 * Teacher Portal v2 — the design's buttons (design-surfaces §8.4) on the
 * design-system Button, so `href` (i18n Link), `loading` and `disabled` behave
 * as everywhere else. `primary` navy ("Start new session"), `outline` white
 * with a navy hover border (PDF/LLM, "Reports and data"), `secondary` white
 * grey-ink ("Add a session", "Edit"), `ghost` ("Close", "Cancel"),
 * `dangerOutline` ("Close sitting"), `inverse` white-on-navy.
 */
function TeacherButton({ tone = 'primary', size = 'md', className, ...props }: TeacherButtonProps) {
  return (
    <Button
      variant={tone === 'primary' ? 'navy' : 'outline'}
      size="default"
      className={cn(
        'transition-colors motion-reduce:transition-none',
        TEACHER_BUTTON_SIZES[size],
        TEACHER_BUTTON_TONES[tone],
        KIT_FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export { TeacherButton };
