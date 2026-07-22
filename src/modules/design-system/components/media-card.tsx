import { Check } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

import type { MediaCardProps } from '@/modules/design-system/types/media.types';

// Canonical CatalogCard (App Screens — Test catalog) grown an image slot:
//   panel r16, padding 20px, gap 12px, cursor pointer
//   pill row → title 16.5/700/1.3 → desc 13.5/1.5 → footer meta pushed to the end
//   selected: 2px #2563EB + shadow 0 2px 8px rgba(37,99,235,.12) + 22px check disc
//   hover:    border-color #CBD5E1
// The 1px→2px selected border is drawn as an inset ring so selection never nudges
// the grid. The whole card is ONE tab stop and ONE accessible name: the title link
// stretches over the card with `after:inset-0` instead of nesting extra anchors.
// A card WITHOUT a cover keeps the flat padded panel — the cover is a slot, so this
// is not two components.
function MediaCard({
  title,
  href,
  cover,
  badges,
  description,
  meta,
  trailing,
  footer,
  selected,
  className,
}: MediaCardProps) {
  return (
    <article
      data-slot="media-card"
      data-selected={selected ? '' : undefined}
      className={cn(
        'relative flex min-w-0 flex-col overflow-hidden rounded-panel border bg-card shadow-sm transition-colors duration-200 ease-out-expo has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring motion-reduce:transition-none',
        selected
          ? 'border-primary ring-1 ring-primary ring-inset'
          : 'border-border hover:border-input',
        className,
      )}
    >
      {cover ? <div className="p-2 pb-0">{cover}</div> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        {badges ? <div className="flex flex-wrap items-center gap-1.5">{badges}</div> : null}
        <h3 className="text-panel-title leading-snug font-bold text-balance text-foreground">
          {href ? (
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        {description ? (
          <p className="line-clamp-3 text-body-sm text-muted-foreground">{description}</p>
        ) : null}
        {meta || trailing ? (
          <div className="mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-meta text-muted-foreground">
            {meta}
            {trailing ? (
              <span className="ml-auto font-bold text-foreground">{trailing}</span>
            ) : null}
          </div>
        ) : null}
        {footer}
      </div>
      {selected ? (
        <span
          aria-hidden="true"
          className="absolute top-3 right-3 grid size-5.5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm"
        >
          <Check className="size-3 stroke-3" />
        </span>
      ) : null}
    </article>
  );
}

export { MediaCard };
