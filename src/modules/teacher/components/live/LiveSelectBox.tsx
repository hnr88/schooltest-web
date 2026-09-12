'use client';

import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { KIT_FOCUS_RING } from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { LiveSelectBoxProps } from '@/modules/teacher/types/live-students.types';

// Teacher Portal v2.dc.html:1161, :1173 — the 20px tick box: navy fill with a
// white tick when everything shown is ticked, a navy dash for a part selection.
function LiveSelectBox({ state, label, onToggle, className }: LiveSelectBoxProps) {
  const checked = state === 'all';
  const partial = state === 'some';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={partial ? 'mixed' : checked}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-[6px] border-[1.5px] transition-colors motion-reduce:transition-none',
        KIT_FOCUS_RING,
        checked ? 'border-navy-900 bg-navy-900' : partial ? 'border-navy-900 bg-white' : 'border-[#C4CEDC] bg-white',
        className,
      )}
    >
      {checked ? <Check aria-hidden="true" className="size-3 text-white" strokeWidth={3} /> : null}
      {partial ? <span aria-hidden="true" className="h-0.5 w-2.5 rounded-[2px] bg-navy-900" /> : null}
    </button>
  );
}

export { LiveSelectBox };
