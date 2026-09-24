import type { CmsTableOfContentsProps } from '@/modules/cms/types/components.types';

// Same-document fragment jumps, so plain anchors (never <Link>).
function CmsTableOfContents({ entries, title, label }: CmsTableOfContentsProps) {
  if (entries.length === 0) return null;
  return (
    <nav aria-label={label} className="mt-8 rounded-card bg-surface-inset p-5">
      <h2 className="text-caption font-semibold tracking-wider text-body uppercase">{title}</h2>
      <ol className="mt-3 flex flex-col gap-1">
        {entries.map((entry, index) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className="inline-flex min-h-11 items-center gap-3 rounded-sm text-body-md text-body transition-colors duration-200 ease-out hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none"
            >
              <span aria-hidden="true" className="tabular-nums text-body-sm text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export { CmsTableOfContents };
