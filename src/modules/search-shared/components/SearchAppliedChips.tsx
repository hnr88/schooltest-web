'use client';

import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { searchChipVariants } from '@/modules/search-shared/lib/chip-variants';
import type { SearchAppliedChipsProps } from '@/modules/search-shared/types/search-shared.types';

// The design's applied-filter row (spec 01 §8.2): one white/navy pill per narrowing
// the corpus is under, each removable on click, and a quiet line instead when none is
// applied. The visible label plus the removal verb IS the accessible name — the ✕ the
// design draws is a glyph, so it carries `aria-hidden` and the button owns the name.
// Chips enter with the canonical fade+zoom so a filter landing in the bar is seen.
function SearchAppliedChips({ chips, emptyLabel, removeLabel }: SearchAppliedChipsProps) {
  if (chips.length === 0) {
    // On the page well (#EEF2F7), --muted-foreground is only 4.23:1 — below AA — so
    // the quiet empty hint uses --color-body (6.74:1). The design's #9AA6B8 would fail
    // WCAG; the brief requires AA even where the design draws a lighter grey.
    return <span className="text-caption text-body">{emptyLabel}</span>;
  }

  return (
    <>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          data-slot="search-applied-chip"
          onClick={chip.onRemove}
          aria-label={removeLabel(chip.label)}
          className={cn(
            searchChipVariants({ tone: 'outline' }),
            'duration-200 ease-out-expo animate-in fade-in zoom-in-95 motion-reduce:animate-none',
          )}
        >
          <span className="max-w-40 truncate">{chip.label}</span>
          <X aria-hidden="true" className="size-3 shrink-0 stroke-3" />
        </button>
      ))}
    </>
  );
}

export { SearchAppliedChips };
