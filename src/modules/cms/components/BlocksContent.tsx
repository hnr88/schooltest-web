import { toAbsoluteStrapiMediaUrl } from '@/lib/strapi-media';
import { InlineContent } from '@/modules/cms/components/InlineContent';
import type { CmsBlock, CmsList } from '@/modules/cms/types/cms-blocks.types';
import type { BlocksContentProps } from '@/modules/cms/types/components.types';

const TEXT = 'text-body-md leading-relaxed text-body';

function ListBlock({ list }: { list: CmsList }) {
  const Tag = list.format === 'ordered' ? 'ol' : 'ul';
  return (
    <Tag className={`ml-5 flex flex-col gap-2 ${list.format === 'ordered' ? 'list-decimal' : 'list-disc'}`}>
      {list.children.map((child, index) =>
        child.type === 'list' ? (
          <li key={index} className="list-none">
            <ListBlock list={child} />
          </li>
        ) : (
          <li key={index} className={TEXT}>
            <InlineContent nodes={child.children} />
          </li>
        ),
      )}
    </Tag>
  );
}

function Block({ block }: { block: CmsBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className={TEXT}>
          <InlineContent nodes={block.children} />
        </p>
      );
    case 'heading':
      return (
        <h3 className="text-h4 font-semibold text-foreground">
          <InlineContent nodes={block.children} />
        </h3>
      );
    case 'list':
      return <ListBlock list={block} />;
    case 'quote':
      return (
        <blockquote className={`border-l-4 border-border pl-4 italic ${TEXT}`}>
          <InlineContent nodes={block.children} />
        </blockquote>
      );
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-card bg-surface-inset p-4 text-body-sm">
          <InlineContent nodes={block.children} />
        </pre>
      );
    case 'image':
      return (
        // eslint-disable-next-line @next/next/no-img-element -- CMS media host is not a configured next/image remote
        <img
          src={toAbsoluteStrapiMediaUrl(block.image.url)}
          alt={block.image.alternativeText ?? ''}
          width={block.image.width ?? undefined}
          height={block.image.height ?? undefined}
          className="h-auto max-w-full rounded-card"
          loading="lazy"
        />
      );
    default:
      return null;
  }
}

// Strapi `blocks` → semantic HTML. Headings inside a body are h3 (the section
// heading is the h2), so the page outline stays ordered.
function BlocksContent({ blocks }: BlocksContentProps) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  );
}

export { BlocksContent };
