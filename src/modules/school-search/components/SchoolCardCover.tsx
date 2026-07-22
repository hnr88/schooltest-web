import { School } from 'lucide-react';
import Image from 'next/image';

import { toAbsoluteStrapiMediaUrl } from '@/lib/strapi-media';
import type { SchoolCoverImage } from '@/modules/school-search/types/school-search.types';

const SIZES = '(min-width: 1536px) 26rem, (min-width: 1024px) 22rem, 100vw';

// REAL API MEDIA ONLY. `coverImage` is the school-search response field; 1 of the 312
// live records carries one and the other 311 get the canonical no-image identity
// medallion — never a stock photo, never a placeholder service, never an invented URL.
// The fallback is a 44px medallion rather than a full 16:9 tile because the design's
// list rail is 340px wide and shows FOUR cards (spec 01 §8.4): a photo-shaped grey
// rectangle on the 311 records that have no photo would leave room for one and a half.
// The populated branch cannot go through MediaCover: that would run the absolute
// Strapi URL through the next/image optimizer, and the API origin is not in
// next.config `images.remotePatterns` (that file is outside this task's scope), so the
// request would fail. `unoptimized` keeps the real bytes at a 16:9 tile geometry.
function SchoolCardCover({ coverImage, alt }: { coverImage: SchoolCoverImage; alt: string }) {
  if (!coverImage) {
    return (
      <div
        data-slot="school-card-identity"
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-tile bg-blue-50 text-primary"
      >
        <School className="size-5" strokeWidth={1.75} />
      </div>
    );
  }

  return (
    <div
      data-slot="school-card-image"
      className="relative aspect-video w-full overflow-hidden rounded-tile bg-muted"
    >
      <Image
        fill
        unoptimized
        alt={alt}
        sizes={SIZES}
        src={toAbsoluteStrapiMediaUrl(coverImage.url)}
        className="object-cover transition-transform duration-300 ease-out-expo group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      />
    </div>
  );
}

export { SchoolCardCover };
