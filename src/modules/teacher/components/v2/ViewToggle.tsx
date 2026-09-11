'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  KIT_FOCUS_RING,
  VIEW_TOGGLE_ACTIVE,
  VIEW_TOGGLE_IDLE,
  VIEW_TOGGLE_OPTIONS,
} from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { ViewToggleProps } from '@/modules/teacher/types/teacher-kit-controls.types';

/**
 * Teacher Portal v2 — the tiles/list toggle (`Teacher Portal v2.dc.html:108–115`):
 * a #F5F6F8 track with two 34×32 r7 icon buttons; the active one is white with
 * a hairline shadow. `aria-pressed` buttons (it switches what the panel shows,
 * it is not a form answer). Extra props (`data-slot`…) land on the group.
 */
function ViewToggle({ value, onValueChange, labels, label, className, ...rest }: ViewToggleProps) {
  const t = useTranslations('TeacherPortal.kit');
  const names = labels ?? { tiles: t('tiles'), list: t('list') };

  return (
    <div
      role="group"
      aria-label={label ?? t('viewLabel')}
      className={cn('flex gap-0.5 rounded-[9px] bg-[#F5F6F8] p-0.5', className)}
      {...rest}
    >
      {VIEW_TOGGLE_OPTIONS.map(({ value: option, Icon }) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            aria-label={names[option]}
            title={names[option]}
            data-value={option}
            onClick={() => onValueChange(option)}
            className={cn(
              'inline-flex h-8 w-[34px] items-center justify-center rounded-[7px] transition-colors motion-reduce:transition-none',
              KIT_FOCUS_RING,
              active ? VIEW_TOGGLE_ACTIVE : VIEW_TOGGLE_IDLE,
            )}
          >
            <Icon aria-hidden="true" className="size-[15px]" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}

export { ViewToggle };
