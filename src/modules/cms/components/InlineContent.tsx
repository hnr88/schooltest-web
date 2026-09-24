import type { CmsTextNode } from '@/modules/cms/types/cms-blocks.types';
import type { InlineContentProps } from '@/modules/cms/types/components.types';
import { isExternalHref } from '@/modules/cms/lib/cms-paths';

function Text({ node }: { node: CmsTextNode }) {
  let content: React.ReactNode = node.text;
  if (node.code) content = <code className="rounded bg-surface-inset px-1 text-body-sm">{content}</code>;
  if (node.bold) content = <strong>{content}</strong>;
  if (node.italic) content = <em>{content}</em>;
  if (node.underline) content = <u>{content}</u>;
  if (node.strikethrough) content = <s>{content}</s>;
  return <>{content}</>;
}

// Text nodes only, never HTML: the CMS body is structured JSON (Strapi blocks).
function InlineContent({ nodes }: InlineContentProps) {
  return (
    <>
      {nodes.map((node, index) =>
        node.type === 'text' ? (
          <Text key={index} node={node} />
        ) : (
          <a
            key={index}
            href={node.url}
            className="text-primary underline underline-offset-2 hover:no-underline"
            {...(isExternalHref(node.url) && !node.url.startsWith('mailto:')
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {node.children.map((child, childIndex) => (
              <Text key={childIndex} node={child} />
            ))}
          </a>
        ),
      )}
    </>
  );
}

export { InlineContent };
