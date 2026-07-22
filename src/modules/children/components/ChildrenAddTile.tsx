'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';

// §A.6 AddChildTile — the dashed r24 affordance that always closes the grid. It is
// a LINK, not a div with a click handler, so it is tabbable and carries the same
// focus ring as every other target. Hover recolours border, glyph and both labels
// in one step because the SVG inherits `currentColor`.
export function ChildrenAddTile() {
  const t = useTranslations('Children');

  return (
    <Link
      href="/dashboard/children/new"
      data-slot="children-add-tile"
      className="group grid min-h-55 w-full min-w-0 animate-in place-items-center rounded-card border-2 border-dashed border-input p-6 text-center text-body transition duration-300 ease-out-expo fade-in slide-in-from-bottom-3 hover:-translate-y-0.5 hover:border-primary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-well focus-visible:outline-none motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <span className="flex flex-col items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-card shadow-sm transition-transform duration-200 ease-out-expo group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <Plus aria-hidden="true" className="size-4.5" strokeWidth={2} />
        </span>
        <span className="flex flex-col gap-0.75">
          <span className="text-body-md font-semibold">{t('addChild')}</span>
          <span className="text-meta">{t('addChildHint')}</span>
        </span>
      </span>
    </Link>
  );
}
