import Image from 'next/image';
import { ImageOff } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { MediaCoverProps, MediaRatio } from '@/modules/design-system/types/media.types';

// The image slot the result cards were missing. Geometry follows the canonical card
// family: 12px inner radius (TintTile), flush to the card's own 16px panel radius
// when it sits at the top, object-fit cover so a non-conforming aspect never
// letterboxes, and a badge overlay rail at 12px inset.
// THE FALLBACK IS THE POINT. When the API exposes no image the slot renders the
// canonical EmptyState medallion (52px rounded-panel #EFF5FF field, 22px #2563EB
// glyph, DS §03 "EmptyState (in-panel)") on a recessed field — never a stock photo,
// never a coloured rectangle pretending to be one.
const RATIO: Record<MediaRatio, string> = {
  video: 'aspect-video',
  square: 'aspect-square',
};

function MediaCover({
  src,
  alt,
  icon: Icon = ImageOff,
  ratio = 'video',
  sizes = '(min-width: 1024px) 20rem, 100vw',
  priority,
  overlayStart,
  overlayEnd,
  className,
}: MediaCoverProps) {
  return (
    <div
      data-slot="media-cover"
      data-empty={src ? undefined : ''}
      className={cn(
        'relative w-full overflow-hidden rounded-tile bg-muted',
        RATIO[ratio],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 grid place-items-center bg-surface-inset"
        >
          <span className="grid size-13 place-items-center rounded-panel bg-blue-50 text-primary">
            <Icon className="size-5.5" />
          </span>
        </span>
      )}
      {overlayStart || overlayEnd ? (
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <span className="pointer-events-auto flex flex-wrap gap-1.5">{overlayStart}</span>
          <span className="pointer-events-auto flex flex-wrap justify-end gap-1.5">
            {overlayEnd}
          </span>
        </div>
      ) : null}
    </div>
  );
}

export { MediaCover };
