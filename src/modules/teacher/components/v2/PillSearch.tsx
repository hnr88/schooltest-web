'use client';

import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  PILL_SEARCH_HEIGHTS,
  PILL_SEARCH_VARIANTS,
} from '@/modules/teacher/constants/teacher-kit-controls.constants';
import type { PillSearchProps } from '@/modules/teacher/types/teacher-kit-controls.types';

/**
 * Teacher Portal v2 — the search field: grey #F5F6F8 36px r9 on the Classes
 * toolbar (`Teacher Portal v2.dc.html:94–97`), white bordered r12 at 40/42px on
 * the Live and Students tabs (`:269`, `:360`). Magnifier + borderless input,
 * 240px wide; the whole field shows focus.
 */
function PillSearch({
  value,
  onValueChange,
  placeholder,
  label,
  variant = 'grey',
  size = 'lg',
  id,
  className,
}: PillSearchProps) {
  const skin = PILL_SEARCH_VARIANTS[variant];

  return (
    <label
      data-slot="pill-search"
      className={cn(
        'flex w-60 max-w-full cursor-text items-center border transition-colors focus-within:border-navy-900/40 motion-reduce:transition-none',
        skin.root,
        variant === 'white' && PILL_SEARCH_HEIGHTS[size],
        className,
      )}
    >
      <Search aria-hidden="true" className={cn('shrink-0', skin.icon)} strokeWidth={2} />
      <input
        id={id}
        type="search"
        aria-label={label}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onValueChange(event.target.value)}
        className="min-w-0 flex-1 border-none bg-transparent p-0 text-[13.5px] text-navy-900 outline-none placeholder:text-[#9CA3AF] [&::-webkit-search-cancel-button]:hidden"
      />
    </label>
  );
}

export { PillSearch };
