import type { JsonLdNode } from '@/modules/seo/types/seo.types';

interface JsonLdProps {
  readonly data: JsonLdNode;
}

// Server Component. Emits one schema.org graph node as a JSON-LD script tag.
// The payload is a typed object built by `@/modules/seo/lib/json-ld` and
// serialised with JSON.stringify, so no caller can inject markup here; `<` is
// escaped because a literal `</script>` inside a JSON string would close the tag.
function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

export { JsonLd };
