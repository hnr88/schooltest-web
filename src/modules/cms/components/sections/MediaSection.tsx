import { toAbsoluteStrapiMediaUrl } from '@/lib/strapi-media';
import type { MediaSectionProps } from '@/modules/cms/types/components.types';

function MediaSection({ section }: MediaSectionProps) {
  if (!section.image) return null;
  return (
    <figure className="flex flex-col gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- CMS media host is not a configured next/image remote */}
      <img
        src={toAbsoluteStrapiMediaUrl(section.image.url)}
        alt={section.image.alternativeText ?? ''}
        width={section.image.width ?? undefined}
        height={section.image.height ?? undefined}
        className="h-auto max-w-full rounded-card"
        loading="lazy"
      />
      {section.caption ? (
        <figcaption className="text-body-sm text-muted-foreground">{section.caption}</figcaption>
      ) : null}
    </figure>
  );
}

export { MediaSection };
