import { Building2 } from 'lucide-react';
import Image from 'next/image';

import { toAbsoluteStrapiMediaUrl } from '@/lib/strapi-media';
import type { SchoolCoverImage, StateCode } from '@/modules/school-search/types/school-search.types';

function SchoolCardCover({
  coverImage,
  alt,
  state,
}: {
  coverImage: SchoolCoverImage;
  alt: string;
  state: StateCode | null;
}) {
  if (!coverImage) {
    return (
      <div
        aria-hidden="true"
        data-slot="school-card-identity"
        className="flex h-24 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-xl bg-navy-900 text-primary-foreground"
      >
        <Building2 className="size-6" strokeWidth={1.5} />
        {state ? <span className="text-caption font-bold tracking-wider">{state}</span> : null}
      </div>
    );
  }

  return (
    <div
      data-slot="school-card-image"
      className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-muted"
    >
      <Image
        fill
        unoptimized
        alt={alt}
        sizes="(min-width: 1024px) 128px, 128px"
        src={toAbsoluteStrapiMediaUrl(coverImage.url)}
        className="object-cover"
      />
    </div>
  );
}

export { SchoolCardCover };
