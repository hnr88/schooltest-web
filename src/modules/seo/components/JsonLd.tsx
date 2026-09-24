import { serializeJsonLd } from '@/modules/seo/lib/serialize-json-ld';

import type { JsonLdProps } from '@/modules/seo/types/components.types';

// Server Component. Emits one JSON-LD document (normally the page's @graph).
// serializeJsonLd escapes `<`, `>` and `&`, so no string value — CMS copy
// included — can close the script tag or open an HTML comment.
function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
  );
}

export { JsonLd };
